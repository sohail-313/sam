import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';

// Interfaces for the new data structure
interface User {
  phone: string;
  name?: string;
  profilePicture?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeen: Timestamp;
  contactsLastSynced?: Timestamp;
  settings: {
    notifications: boolean;
    readReceipts: boolean;
  };
}

interface Contact {
  phoneNumber: string;
  savedName: string;
  isMutual: boolean;
  addedAt: Timestamp;
  updatedAt: Timestamp;
}

interface Group {
  groupId: string;
  name: string;
  emoji?: string;
  members: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  memberCount: number;
  lastUsed?: Timestamp;
}

interface FYI {
  fyiId: string;
  senderId: string;
  senderName?: string;
  text: string;
  targetType: 'all' | 'group';
  targetGroupId?: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  reactionCount: number;
  seenCount: number;
  isActive: boolean;
}

interface TimelineItem {
  fyiId: string;
  senderId: string;
  senderName?: string;
  text: string;
  targetType: 'all' | 'group';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  reactionCount: number;
  seenCount: number;
  hasReacted: boolean;
  hasSeen: boolean;
  isFromGroup?: string;
}

interface ActiveFYI {
  userId: string;
  fyiId: string;
  updatedAt: Timestamp;
}

interface Reaction {
  userId: string;
  userName?: string;
  emoji: string;
  reactedAt: Timestamp;
}

interface SeenStatus {
  userId: string;
  seenAt: Timestamp;
}

// Request/Response types
interface CreateFYIRequest {
  text: string;
  targetType: 'all' | 'group';
  targetGroupId?: string;
}

interface CreateFYIResponse {
  success: boolean;
  fyiId?: string;
  error?: string;
}

interface ContactSyncResponse {
  success: boolean;
  newMutualContacts: number;
  totalMutualContacts: number;
  error?: string;
}

interface CreateGroupForm {
  name: string;
  emoji?: string;
  members: string[];
}

// Constants
const FYI_EXPIRY_HOURS = 24;
type EmojiType = '❤️' | '😂' | '👍' | '😮' | '😢' | '😡';

class FYIService {

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async createUser(phoneNumber: string, name?: string): Promise<User> {
    const userRef = doc(db, 'users', phoneNumber);

    // Check if user already exists to avoid overwrites
    const existingUser = await getDoc(userRef);
    if (existingUser.exists()) {
      console.log('User already exists, returning existing user');
      return existingUser.data() as User;
    }

    const userData: any = {
      phone: phoneNumber,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastSeen: serverTimestamp() as Timestamp,
      settings: {
        notifications: true,
        readReceipts: true,
      },
    };

    // Only include name if it's provided and not empty
    if (name && name.trim()) {
      userData.name = name.trim();
    }

    await setDoc(userRef, userData);
    console.log('Created new user:', phoneNumber, name ? `with name: ${name}` : 'without name');
    return userData as User;
  }

  async getUser(phoneNumber: string): Promise<User | null> {
    const userRef = doc(db, 'users', phoneNumber);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as User : null;
  }

  async updateUser(phoneNumber: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', phoneNumber);

    // Filter out undefined values to avoid Firestore errors
    const cleanUpdates: any = { updatedAt: serverTimestamp() };

    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        // Special handling for name field - trim whitespace
        if (key === 'name' && typeof value === 'string') {
          const trimmedName = value.trim();
          if (trimmedName) {
            cleanUpdates[key] = trimmedName;
          }
        } else {
          cleanUpdates[key] = value;
        }
      }
    });

    console.log('Updating user:', phoneNumber, 'with:', cleanUpdates);
    await updateDoc(userRef, cleanUpdates);
  }

  // New method: Get or create user (better for onboarding flow)
  async getOrCreateUser(phoneNumber: string, name?: string): Promise<User> {
    let user = await this.getUser(phoneNumber);

    if (!user) {
      user = await this.createUser(phoneNumber, name);
    }

    return user;
  }

  // New method: Complete user profile (for after name collection)
  async completeUserProfile(phoneNumber: string, profileData: { name: string;[key: string]: any }): Promise<void> {
    const { name, ...otherData } = profileData;
    const updates: Partial<User> = {
      name: name.trim(),
      ...otherData
    };

    await this.updateUser(phoneNumber, updates);

    // After completing profile, we might want to trigger contact sync
    console.log('User profile completed for:', phoneNumber);
  }

  // ============================================================================
  // CONTACT MANAGEMENT
  // ============================================================================

  async syncContacts(
    userPhone: string,
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ): Promise<ContactSyncResponse> {
    try {
      const batch = writeBatch(db);
      let newMutualContacts = 0;

      // Check which contacts are FYI users
      const userPhones = deviceContacts.map(c => c.phoneNumber);
      const existingUsers = await this.getUsersBatch(userPhones);

      // Update contacts subcollection
      for (const contact of deviceContacts) {
        const isMutual = existingUsers.includes(contact.phoneNumber);
        const contactRef = doc(db, 'users', userPhone, 'contacts', contact.phoneNumber);

        // Check if this is a new mutual contact
        const existingContact = await getDoc(contactRef);
        if (isMutual && (!existingContact.exists() || !existingContact.data()?.isMutual)) {
          newMutualContacts++;
        }

        batch.set(contactRef, {
          phoneNumber: contact.phoneNumber,
          savedName: contact.savedName,
          isMutual,
          addedAt: existingContact.exists() ? existingContact.data()?.addedAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Update user's last sync time
      const userRef = doc(db, 'users', userPhone);
      batch.update(userRef, {
        contactsLastSynced: serverTimestamp(),
      });

      await batch.commit();

      // If new mutual contacts, rebuild timeline
      if (newMutualContacts > 0) {
        await this.rebuildUserTimeline(userPhone);
      }

      return {
        success: true,
        newMutualContacts,
        totalMutualContacts: existingUsers.length,
      };
    } catch (error) {
      console.error('Contact sync error:', error);
      return {
        success: false,
        newMutualContacts: 0,
        totalMutualContacts: 0,
        error: 'Failed to sync contacts',
      };
    }
  }

  async getMutualContacts(userPhone: string): Promise<Contact[]> {
    const contactsRef = collection(db, 'users', userPhone, 'contacts');
    // Temporarily remove orderBy to avoid index requirement
    // TODO: Create Firestore composite index for isMutual + savedName
    const q = query(contactsRef, where('isMutual', '==', true));
    const snapshot = await getDocs(q);
    const contacts = snapshot.docs.map(doc => doc.data() as Contact);

    // Sort in memory instead of using Firestore orderBy
    return contacts.sort((a, b) => a.savedName.localeCompare(b.savedName));
  }

  private async getUsersBatch(phoneNumbers: string[]): Promise<string[]> {
    const existingUsers: string[] = [];

    // Firestore 'in' queries are limited to 10 items, so batch them
    const chunks = this.chunkArray(phoneNumbers, 10);

    for (const chunk of chunks) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', 'in', chunk));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => existingUsers.push(doc.data().phone));
    }

    return existingUsers;
  }

  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================

  async createGroup(userPhone: string, groupData: CreateGroupForm): Promise<string> {
    const groupRef = doc(collection(db, 'users', userPhone, 'groups'));
    const groupId = groupRef.id;

    const group: Group = {
      groupId,
      name: groupData.name,
      emoji: groupData.emoji,
      members: groupData.members,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      memberCount: groupData.members.length,
    };

    await setDoc(groupRef, group);
    return groupId;
  }

  async getUserGroups(userPhone: string): Promise<Group[]> {
    const groupsRef = collection(db, 'users', userPhone, 'groups');
    const q = query(groupsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Group);
  }

  async updateGroup(userPhone: string, groupId: string, updates: Partial<Group>): Promise<void> {
    const groupRef = doc(db, 'users', userPhone, 'groups', groupId);
    await updateDoc(groupRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      ...(updates.members && { memberCount: updates.members.length }),
    });
  }

  async deleteGroup(userPhone: string, groupId: string): Promise<void> {
    const groupRef = doc(db, 'users', userPhone, 'groups', groupId);
    await deleteDoc(groupRef);
  }

  // ============================================================================
  // FYI MANAGEMENT
  // ============================================================================

  async createFYI(senderPhone: string, fyiData: CreateFYIRequest): Promise<CreateFYIResponse> {
    try {
      const batch = writeBatch(db);

      // 1. Deactivate any existing active FYI
      await this.deactivateUserFYI(senderPhone);

      // 2. Create new FYI
      const fyiRef = doc(collection(db, 'fyis'));
      const fyiId = fyiRef.id;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + FYI_EXPIRY_HOURS);

      const fyi: FYI = {
        fyiId,
        senderId: senderPhone,
        senderName: await this.getUserName(senderPhone),
        text: fyiData.text,
        targetType: fyiData.targetType,
        targetGroupId: fyiData.targetGroupId,
        createdAt: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt),
        reactionCount: 0,
        seenCount: 0,
        isActive: true,
      };

      batch.set(fyiRef, fyi);

      // 3. Update active FYI index
      const activeFyiRef = doc(db, 'activeFyis', senderPhone);
      batch.set(activeFyiRef, {
        userId: senderPhone,
        fyiId,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      // 4. Add to relevant user timelines (async)
      this.addToTimelines(fyi);

      return { success: true, fyiId };
    } catch (error) {
      console.error('Create FYI error:', error);
      return { success: false, error: 'Failed to create FYI' };
    }
  }

  async getUserActiveFYI(userPhone: string): Promise<FYI | null> {
    const activeFyiRef = doc(db, 'activeFyis', userPhone);
    const activeFyiSnap = await getDoc(activeFyiRef);

    if (!activeFyiSnap.exists()) return null;

    const { fyiId } = activeFyiSnap.data() as ActiveFYI;
    const fyiRef = doc(db, 'fyis', fyiId);
    const fyiSnap = await getDoc(fyiRef);

    return fyiSnap.exists() ? fyiSnap.data() as FYI : null;
  }

  async getFYI(fyiId: string): Promise<FYI | null> {
    const fyiRef = doc(db, 'fyis', fyiId);
    const fyiSnap = await getDoc(fyiRef);
    return fyiSnap.exists() ? fyiSnap.data() as FYI : null;
  }

  private async deactivateUserFYI(userPhone: string): Promise<void> {
    const activeFyiRef = doc(db, 'activeFyis', userPhone);
    const activeFyiSnap = await getDoc(activeFyiRef);

    if (activeFyiSnap.exists()) {
      const { fyiId } = activeFyiSnap.data() as ActiveFYI;
      const fyiRef = doc(db, 'fyis', fyiId);
      await updateDoc(fyiRef, { isActive: false });
    }
  }

  private async addToTimelines(fyi: FYI): Promise<void> {
    let targetUsers: string[] = [];

    if (fyi.targetType === 'all') {
      // Get all mutual contacts of sender
      const mutualContacts = await this.getMutualContacts(fyi.senderId);
      targetUsers = mutualContacts.map(c => c.phoneNumber);
    } else if (fyi.targetGroupId) {
      // Get group members
      const groupRef = doc(db, 'users', fyi.senderId, 'groups', fyi.targetGroupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const group = groupSnap.data() as Group;
        targetUsers = group.members;
      }
    }

    // Add to each target user's timeline
    const batch = writeBatch(db);
    const timelineItem: TimelineItem = {
      fyiId: fyi.fyiId,
      senderId: fyi.senderId,
      senderName: fyi.senderName,
      text: fyi.text,
      targetType: fyi.targetType,
      createdAt: fyi.createdAt,
      expiresAt: fyi.expiresAt,
      reactionCount: 0,
      seenCount: 0,
      hasReacted: false,
      hasSeen: false,
      isFromGroup: fyi.targetGroupId,
    };

    for (const userPhone of targetUsers) {
      const timelineRef = doc(db, 'users', userPhone, 'timeline', fyi.fyiId);
      batch.set(timelineRef, timelineItem);
    }

    await batch.commit();
  }

  // ============================================================================
  // TIMELINE MANAGEMENT
  // ============================================================================

  async getUserTimeline(
    userPhone: string,
    limitCount: number = 20,
    lastVisible?: any
  ): Promise<{ items: TimelineItem[]; lastVisible?: any }> {
    const timelineRef = collection(db, 'users', userPhone, 'timeline');

    // Simplified query to avoid index requirements during development
    // TODO: Create composite index for expiresAt + createdAt
    let q = query(
      timelineRef,
      where('expiresAt', '>', new Date()),
      limit(limitCount)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => doc.data() as TimelineItem);

    // Sort in memory for now
    items.sort((a, b) => {
      // Sort by createdAt desc (newest first)
      return b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime() || 0;
    });

    const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
    return { items, lastVisible: newLastVisible };
  }

  async rebuildUserTimeline(userPhone: string): Promise<void> {
    // This is an expensive operation, use sparingly
    // Typically only needed after contact sync with new mutual contacts

    const batch = writeBatch(db);

    // Clear existing timeline
    const timelineRef = collection(db, 'users', userPhone, 'timeline');
    const existingTimeline = await getDocs(timelineRef);
    existingTimeline.docs.forEach(doc => batch.delete(doc.ref));

    // Get all active FYIs from mutual contacts
    const mutualContacts = await this.getMutualContacts(userPhone);
    const mutualPhones = mutualContacts.map(c => c.phoneNumber);

    // Get active FYIs (in chunks due to Firestore limits)
    const chunks = this.chunkArray(mutualPhones, 10);
    for (const chunk of chunks) {
      const fyisRef = collection(db, 'fyis');
      const q = query(
        fyisRef,
        where('senderId', 'in', chunk),
        where('isActive', '==', true),
        where('expiresAt', '>', new Date())
      );

      const snapshot = await getDocs(q);
      snapshot.docs.forEach(docSnap => {
        const fyi = docSnap.data() as FYI;
        if (fyi.targetType === 'all') {
          // Add to timeline
          const timelineItemRef = doc(db, 'users', userPhone, 'timeline', fyi.fyiId);
          const timelineItem: TimelineItem = {
            fyiId: fyi.fyiId,
            senderId: fyi.senderId,
            senderName: fyi.senderName,
            text: fyi.text,
            targetType: fyi.targetType,
            createdAt: fyi.createdAt,
            expiresAt: fyi.expiresAt,
            reactionCount: fyi.reactionCount,
            seenCount: fyi.seenCount,
            hasReacted: false, // Will be updated by checking reactions
            hasSeen: false,    // Will be updated by checking seen status
          };
          batch.set(timelineItemRef, timelineItem);
        }
      });
    }

    await batch.commit();
  }

  // ============================================================================
  // REACTIONS & SEEN STATUS
  // ============================================================================

  async addReaction(fyiId: string, userPhone: string, emoji: EmojiType): Promise<void> {
    const batch = writeBatch(db);

    // Add reaction
    const reactionRef = doc(db, 'fyis', fyiId, 'reactions', userPhone);
    batch.set(reactionRef, {
      userId: userPhone,
      userName: await this.getUserName(userPhone),
      emoji,
      reactedAt: serverTimestamp(),
    });

    // Update FYI reaction count
    const fyiRef = doc(db, 'fyis', fyiId);
    batch.update(fyiRef, {
      reactionCount: increment(1),
    });

    await batch.commit();

    // Update timeline items
    await this.updateTimelineReaction(fyiId, userPhone, true);
  }

  async removeReaction(fyiId: string, userPhone: string): Promise<void> {
    const batch = writeBatch(db);

    // Remove reaction
    const reactionRef = doc(db, 'fyis', fyiId, 'reactions', userPhone);
    batch.delete(reactionRef);

    // Update FYI reaction count
    const fyiRef = doc(db, 'fyis', fyiId);
    batch.update(fyiRef, {
      reactionCount: increment(-1),
    });

    await batch.commit();

    // Update timeline items
    await this.updateTimelineReaction(fyiId, userPhone, false);
  }

  async markFYIAsSeen(fyiId: string, userPhone: string): Promise<void> {
    const batch = writeBatch(db);

    // Add seen status
    const seenRef = doc(db, 'fyis', fyiId, 'seenBy', userPhone);
    batch.set(seenRef, {
      userId: userPhone,
      seenAt: serverTimestamp(),
    });

    // Update FYI seen count
    const fyiRef = doc(db, 'fyis', fyiId);
    batch.update(fyiRef, {
      seenCount: increment(1),
    });

    // Update user's timeline item
    const timelineRef = doc(db, 'users', userPhone, 'timeline', fyiId);
    batch.update(timelineRef, {
      hasSeen: true,
    });

    await batch.commit();
  }

  async getFYIReactions(fyiId: string): Promise<Reaction[]> {
    const reactionsRef = collection(db, 'fyis', fyiId, 'reactions');
    const snapshot = await getDocs(reactionsRef);
    return snapshot.docs.map(doc => doc.data() as Reaction);
  }

  async getFYISeenBy(fyiId: string): Promise<SeenStatus[]> {
    const seenRef = collection(db, 'fyis', fyiId, 'seenBy');
    const snapshot = await getDocs(seenRef);
    return snapshot.docs.map(doc => doc.data() as SeenStatus);
  }

  // ============================================================================
  // REAL-TIME LISTENERS
  // ============================================================================

  subscribeToUserTimeline(
    userPhone: string,
    callback: (items: TimelineItem[]) => void
  ): () => void {
    const timelineRef = collection(db, 'users', userPhone, 'timeline');

    // Simplified query to avoid index requirements during development
    // TODO: Create composite index for expiresAt + createdAt
    const q = query(
      timelineRef,
      where('expiresAt', '>', new Date()),
      limit(50)
    );

    return onSnapshot(q, snapshot => {
      const items = snapshot.docs.map(doc => doc.data() as TimelineItem);

      // Sort in memory for now
      items.sort((a, b) => {
        // Sort by createdAt desc (newest first)
        return b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime() || 0;
      });

      callback(items);
    });
  }

  subscribeToFYIReactions(
    fyiId: string,
    callback: (reactions: Reaction[]) => void
  ): () => void {
    const reactionsRef = collection(db, 'fyis', fyiId, 'reactions');

    return onSnapshot(reactionsRef, snapshot => {
      const reactions = snapshot.docs.map(doc => doc.data() as Reaction);
      callback(reactions);
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async getUserName(phoneNumber: string): Promise<string | undefined> {
    const user = await this.getUser(phoneNumber);
    return user?.name;
  }

  private async updateTimelineReaction(
    fyiId: string,
    userPhone: string,
    hasReacted: boolean
  ): Promise<void> {
    const timelineRef = doc(db, 'users', userPhone, 'timeline', fyiId);
    await updateDoc(timelineRef, { hasReacted });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // New method: Create user with complete onboarding data
  async createUserWithContacts(
    phoneNumber: string,
    name: string,
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ): Promise<ContactSyncResponse> {
    try {
      console.log('Creating user with contacts:', phoneNumber, name, `${deviceContacts.length} contacts`);

      // 1. Create user with name first
      await this.createUser(phoneNumber, name);

      // 2. If no contacts provided, return early
      if (deviceContacts.length === 0) {
        return {
          success: true,
          newMutualContacts: 0,
          totalMutualContacts: 0,
        };
      }

      // 3. Sync contacts and find mutual contacts
      const result = await this.syncContacts(phoneNumber, deviceContacts);

      console.log('User onboarding complete:', result);
      return result;

    } catch (error) {
      console.error('Error creating user with contacts:', error);
      return {
        success: false,
        newMutualContacts: 0,
        totalMutualContacts: 0,
        error: 'Failed to complete user setup',
      };
    }
  }

  // New method: Background contact sync (for when user adds new contacts)
  async backgroundContactSync(userPhone: string, deviceContacts?: Array<{ phoneNumber: string, savedName: string }>): Promise<ContactSyncResponse> {
    try {
      console.log('Running background contact sync for:', userPhone);

      // If no device contacts provided, we can't sync
      // This method expects to be called from the UI layer where contacts can be accessed
      if (!deviceContacts || deviceContacts.length === 0) {
        console.log('No device contacts provided for background sync');
        return {
          success: true,
          newMutualContacts: 0,
          totalMutualContacts: 0,
        };
      }

      // Get current mutual contacts count
      const currentMutualContacts = await this.getMutualContacts(userPhone);
      const currentMutualCount = currentMutualContacts.length;

      // Sync contacts normally
      const result = await this.syncContacts(userPhone, deviceContacts);

      // Log background sync activity
      if (result.success && result.newMutualContacts > 0) {
        console.log(`Background sync found ${result.newMutualContacts} new mutual contacts`);
      }

      return result;
    } catch (error) {
      console.error('Background contact sync error:', error);
      return {
        success: false,
        newMutualContacts: 0,
        totalMutualContacts: 0,
        error: 'Background sync failed',
      };
    }
  }

  // New method: Check if contacts need syncing
  async shouldSyncContacts(userPhone: string): Promise<boolean> {
    try {
      const user = await this.getUser(userPhone);
      if (!user?.contactsLastSynced) return true;

      // Check if it's been more than 24 hours since last sync
      const lastSync = user.contactsLastSynced.toDate();
      const now = new Date();
      const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

      return hoursSinceSync > 24;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return true; // Default to sync if unsure
    }
  }
}

export default new FYIService();