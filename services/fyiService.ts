import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  updateDoc,
  deleteDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { User, Group, FYI, Contact, SeenBy, Reaction } from "@/types/fyi";

export class FYIService {
  // Replace with actual auth user ID
  static currentUserId = "user123";

  // ==================== USER OPERATIONS ====================
  
  /**
   * Create or update a user in Firestore
   */
  static async createUser(userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const userDoc = {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(doc(db, "users", this.currentUserId), userDoc);
      console.log("✅ User created/updated successfully");
    } catch (error) {
      console.error("❌ Error creating user:", error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return { uid: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting user:", error);
      throw error;
    }
  }

  /**
   * Get user by phone number
   */
  static async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const q = query(collection(db, "users"), where("phoneNumber", "==", phoneNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { uid: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting user by phone:", error);
      throw error;
    }
  }

  /**
   * Get multiple users by IDs
   */
  static async getUsers(userIds: string[]): Promise<Map<string, User>> {
    try {
      const usersMap = new Map<string, User>();
      
      // Firestore 'in' query limit is 10, so batch if needed
      const batches = [];
      for (let i = 0; i < userIds.length; i += 10) {
        batches.push(userIds.slice(i, i + 10));
      }

      for (const batch of batches) {
        const q = query(collection(db, "users"), where("__name__", "in", batch.map(id => doc(db, "users", id))));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as User);
        });
      }

      return usersMap;
    } catch (error) {
      console.error("❌ Error getting users:", error);
      throw error;
    }
  }

  // ==================== MUTUAL CONTACTS ====================

  /**
   * Sync mutual contacts for current user
   * This should be called when app starts or contacts change
   */
  static async syncMutualContacts(userId: string = this.currentUserId): Promise<void> {
    try {
      console.log("🔄 Syncing mutual contacts...");
      
      const currentUser = await this.getUser(userId);
      if (!currentUser || !currentUser.contacts) {
        console.log("⚠️ No user or contacts found");
        return;
      }

      const myPhoneNumbers = currentUser.contacts.map(c => c.phoneNumber);
      const mutualUserIds: string[] = [];

      // Find users who have my number in their contacts AND I have their number
      for (const contact of currentUser.contacts) {
        const contactUser = await this.getUserByPhone(contact.phoneNumber);
        
        if (contactUser && contactUser.contacts) {
          // Check if they have my number in their contacts
          const hasMyNumber = contactUser.contacts.some(c => c.phoneNumber === currentUser.phoneNumber);
          if (hasMyNumber) {
            mutualUserIds.push(contactUser.uid);
          }
        }
      }

      // Update user's mutualContacts field
      await updateDoc(doc(db, "users", userId), {
        mutualContacts: mutualUserIds,
        contactsLastSynced: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Synced ${mutualUserIds.length} mutual contacts`);
    } catch (error) {
      console.error("❌ Error syncing mutual contacts:", error);
      throw error;
    }
  }

  // ==================== GROUP OPERATIONS ====================

  /**
   * Create a new group (private to user)
   */
  static async createGroup(groupName: string, memberIds: string[]): Promise<string> {
    try {
      const groupData = {
        groupName,
        ownerId: this.currentUserId,
        members: memberIds,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, "groups"), groupData);
      console.log("✅ Group created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating group:", error);
      throw error;
    }
  }

  /**
   * Get groups owned by user
   */
  static async getUserGroups(userId: string = this.currentUserId): Promise<Group[]> {
    try {
      const q = query(
        collection(db, "groups"), 
        where("ownerId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const groups: Group[] = [];
      
      querySnapshot.forEach((doc) => {
        groups.push({ groupId: doc.id, ...doc.data() } as Group);
      });

      return groups;
    } catch (error) {
      console.error("❌ Error getting user groups:", error);
      throw error;
    }
  }

  // ==================== FYI OPERATIONS ====================

  /**
   * Create a new FYI
   */
  static async createFYI(message: string, targetType: "group" | "all", targetId?: string): Promise<string> {
    try {
      const fyiData = {
        senderUserId: this.currentUserId,
        targetType,
        targetId: targetId || null,
        message: message.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        deleted: false
      };

      const docRef = await addDoc(collection(db, "fyis"), fyiData);
      console.log("✅ FYI created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating FYI:", error);
      throw error;
    }
  }

  /**
   * Get FYIs for current user (from mutual contacts only)
   */
  static async getFYIs(userId: string = this.currentUserId): Promise<FYI[]> {
    try {
      const currentUser = await this.getUser(userId);
      if (!currentUser) {
        throw new Error("User not found");
      }

      // Include current user + mutual contacts
      const allowedSenders = [userId, ...currentUser.mutualContacts];
      
      if (allowedSenders.length === 0) {
        return [];
      }

      // Firestore 'in' query limit is 10, so batch if needed
      const fyis: FYI[] = [];
      const batches = [];
      
      for (let i = 0; i < allowedSenders.length; i += 10) {
        batches.push(allowedSenders.slice(i, i + 10));
      }

      for (const batch of batches) {
        const q = query(
          collection(db, "fyis"),
          where("senderUserId", "in", batch),
          where("deleted", "==", false),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          fyis.push({ fyiId: doc.id, ...doc.data() } as FYI);
        });
      }

      // Sort all results by createdAt desc
      fyis.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      console.log(`✅ Loaded ${fyis.length} FYIs`);
      return fyis;
    } catch (error) {
      console.error("❌ Error getting FYIs:", error);
      throw error;
    }
  }

  /**
   * Get FYIs for a specific group (for group owner)
   */
  static async getGroupFYIs(groupId: string, userId: string = this.currentUserId): Promise<FYI[]> {
    try {
      // Verify user owns the group
      const group = await this.getGroup(groupId);
      if (!group || group.ownerId !== userId) {
        throw new Error("Unauthorized: User doesn't own this group");
      }

      // Get FYIs from group members
      const groupMemberIds = group.members;
      const fyis: FYI[] = [];

      // Batch query for group members' FYIs
      const batches = [];
      for (let i = 0; i < groupMemberIds.length; i += 10) {
        batches.push(groupMemberIds.slice(i, i + 10));
      }

      for (const batch of batches) {
        const q = query(
          collection(db, "fyis"),
          where("senderUserId", "in", batch),
          where("deleted", "==", false),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          fyis.push({ fyiId: doc.id, ...doc.data() } as FYI);
        });
      }

      // Sort by createdAt desc
      fyis.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      return fyis;
    } catch (error) {
      console.error("❌ Error getting group FYIs:", error);
      throw error;
    }
  }

  /**
   * Get a single group by ID
   */
  static async getGroup(groupId: string): Promise<Group | null> {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (groupDoc.exists()) {
        return { groupId: groupDoc.id, ...groupDoc.data() } as Group;
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting group:", error);
      throw error;
    }
  }

  // ==================== SEEN/REACTIONS ====================

  /**
   * Mark FYI as seen by user
   */
  static async markAsSeen(fyiId: string, userId: string = this.currentUserId): Promise<void> {
    try {
      const seenByRef = collection(db, "fyis", fyiId, "seenBy");
      
      // Check if already seen
      const q = query(seenByRef, where("seenBy", "==", userId));
      const existingDoc = await getDocs(q);
      
      if (existingDoc.empty) {
        await addDoc(seenByRef, {
          seenBy: userId,
          seenAt: Timestamp.now()
        });
        console.log("✅ FYI marked as seen");
      }
    } catch (error) {
      console.error("❌ Error marking FYI as seen:", error);
      throw error;
    }
  }

  /**
   * Toggle reaction on FYI
   */
  static async toggleReaction(fyiId: string, emoji: string, userId: string = this.currentUserId): Promise<void> {
    try {
      const reactionsRef = collection(db, "fyis", fyiId, "reactions");
      const q = query(reactionsRef, where("reactedBy", "==", userId), where("emoji", "==", emoji));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Add reaction
        await addDoc(reactionsRef, {
          reactedBy: userId,
          emoji,
          reactedAt: Timestamp.now()
        });
        console.log("✅ Reaction added");
      } else {
        // Remove reaction
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        console.log("✅ Reaction removed");
      }
    } catch (error) {
      console.error("❌ Error toggling reaction:", error);
      throw error;
    }
  }

  /**
   * Get seen count and reactions for an FYI
   */
  static async getFYIEngagement(fyiId: string, currentUserId: string): Promise<{
    seenCount: number;
    isSeenByCurrentUser: boolean;
    reactions: Reaction[];
  }> {
    try {
      // Get seen count
      const seenBySnapshot = await getDocs(collection(db, "fyis", fyiId, "seenBy"));
      const seenCount = seenBySnapshot.size;
      const isSeenByCurrentUser = seenBySnapshot.docs.some(doc => doc.data().seenBy === currentUserId);

      // Get reactions
      const reactionsSnapshot = await getDocs(collection(db, "fyis", fyiId, "reactions"));
      const reactions: Reaction[] = reactionsSnapshot.docs.map(doc => ({
        reactionId: doc.id,
        ...doc.data()
      } as Reaction));

      return { seenCount, isSeenByCurrentUser, reactions };
    } catch (error) {
      console.error("❌ Error getting FYI engagement:", error);
      throw error;
    }
  }
}