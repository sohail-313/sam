import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Contacts from 'expo-contacts';
// @ts-ignore
import fyiServiceInstance from "../services/fyiService";
import AuthService from "@/services/authService";

// Types
interface User {
  phone: string;
  name?: string;
  profilePicture?: string;
  createdAt: any;
  updatedAt: any;
  lastSeen: any;
  contactsLastSynced?: any;
  isTemporaryUser?: boolean; // Flag for temporary users not yet in Firestore
  settings: {
    notifications: boolean;
    readReceipts: boolean;
  };
}

interface Contact {
  phoneNumber: string;
  savedName: string;
  isMutual: boolean;
  addedAt: any;
  updatedAt: any;
}

interface Group {
  groupId: string;
  name: string;
  emoji?: string;
  members: string[];
  createdAt: any;
  updatedAt: any;
  memberCount: number;
  lastUsed?: any;
}

interface FYI {
  fyiId: string;
  senderId: string;
  senderName?: string;
  text: string;
  targetType: "all" | "group";
  targetGroupId?: string;
  createdAt: any;
  expiresAt: any;
  reactionCount: number;
  seenCount: number;
  isActive: boolean;
}

interface TimelineItem {
  fyiId: string;
  senderId: string;
  senderName?: string;
  text: string;
  targetType: "all" | "group";
  createdAt: any;
  expiresAt: any;
  reactionCount: number;
  seenCount: number;
  hasReacted: boolean;
  hasSeen: boolean;
  isFromGroup?: string;
}

interface CreateFYIRequest {
  text: string;
  targetType: "all" | "group";
  targetGroupId?: string;
}

interface FYIContextType {
  // Auth state
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Core data
  contacts: Contact[];
  groups: Group[];
  timeline: TimelineItem[];
  activeFYI: FYI | null;

  // Loading states
  contactsLoading: boolean;
  groupsLoading: boolean;
  timelineLoading: boolean;

  // Actions
  syncContacts: (
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ) => Promise<any>;
  backgroundSyncContacts: (
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ) => Promise<any>;
  createUserWithContacts: (
    phoneNumber: string,
    name: string,
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ) => Promise<any>;
  createGroup: (groupData: {
    name: string;
    emoji?: string;
    members: string[];
  }) => Promise<string>;
  createFYI: (fyiData: CreateFYIRequest) => Promise<any>;
  addReaction: (fyiId: string, emoji: string) => Promise<void>;
  removeReaction: (fyiId: string) => Promise<void>;
  markFYIAsSeen: (fyiId: string) => Promise<void>;

  // Utility
  refreshData: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const FYIContext = createContext<FYIContextType | undefined>(undefined);

interface FYIProviderProps {
  children: ReactNode;
}

export const FYIProvider: React.FC<FYIProviderProps> = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Core data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [activeFYI, setActiveFYI] = useState<FYI | null>(null);

  // Loading states
  const [contactsLoading, setContactsLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Check authentication status and load user data
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // AppState listener for background contact sync
  useEffect(() => {
    let appStateSubscription: any;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && currentUser && isAuthenticated) {
        console.log('App became active - checking for contact sync');
        await checkAndSyncContactsIfNeeded();
      }
    };

    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, [currentUser, isAuthenticated]);

  const checkAndSyncContactsIfNeeded = async () => {
    if (!currentUser) return;

    try {
      // Check if we have contacts permission first
      const { status } = await Contacts.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('Background sync skipped - no contacts permission');
        return;
      }

      // Check if contacts need syncing
      const shouldSync = await fyiServiceInstance.shouldSyncContacts(currentUser.phone);
      if (!shouldSync) {
        console.log('Background sync not needed - synced recently');
        return;
      }

      console.log('Starting background contact sync...');
      
      // Get device contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      const deviceContacts: { phoneNumber: string; savedName: string }[] = [];
      data.forEach((contact) => {
        if (contact.phoneNumbers) {
          contact.phoneNumbers.forEach((phone) => {
            if (phone.number) {
              const cleanNumber = phone.number.replace(/[^\d+]/g, "");
              if (cleanNumber.length >= 10) {
                deviceContacts.push({
                  phoneNumber: cleanNumber,
                  savedName: contact.name || "Unknown",
                });
              }
            }
          });
        }
      });

      // Run background sync
      const result = await backgroundSyncContacts(deviceContacts);
      
      if (result.success && 'newMutualContacts' in result && result.newMutualContacts > 0) {
        console.log(`Background sync found ${result.newMutualContacts} new mutual contacts`);
        // Could show a subtle notification here if desired
      }
    } catch (error) {
      console.error('Error in background contact sync check:', error);
    }
  };

  const checkAuthAndLoadData = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated via SimpleAuthService
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const authUser = await AuthService.getCurrentUser();
        if (authUser?.phoneNumber) {
          // Get or create FYI user profile (but don't force creation without name)
          let fyiUser = await fyiServiceInstance.getUser(authUser.phoneNumber);

          if (!fyiUser) {
            // Don't create user immediately - let the name input screen handle creation
            // This ensures we don't create incomplete user records
            console.log(
              "User not found in Firestore, will be created after name collection"
            );
            fyiUser = {
              phone: authUser.phoneNumber,
              createdAt: new Date() as any,
              updatedAt: new Date() as any,
              lastSeen: new Date() as any,
              settings: {
                notifications: true,
                readReceipts: true,
              },
              isTemporaryUser: true, // Flag to identify temporary users
            } as any; // Temporary user object for UI state
          }

          setCurrentUser(fyiUser);

          // Only load user data if user exists in Firestore (not temporary)
          if (fyiUser && !(fyiUser as any).isTemporaryUser) {
            await loadUserData(authUser.phoneNumber, false);
          }
        }
      }
    } catch (error) {
      console.error("Error checking auth and loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (
    phoneNumber: string,
    isNewUser: boolean = false
  ) => {
    try {
      console.log(
        "Loading user data for:",
        phoneNumber,
        isNewUser ? "(new user)" : "(existing user)"
      );

      // Always load groups and active FYI (these should work for new users)
      const [groupsResult, activeFYIResult] = await Promise.allSettled([
        fyiServiceInstance.getUserGroups(phoneNumber),
        fyiServiceInstance.getUserActiveFYI(phoneNumber),
      ]);

      // Set groups
      if (groupsResult.status === "fulfilled") {
        setGroups(groupsResult.value as Group[]);
      } else {
        console.log("No groups found for user, setting empty array");
        setGroups([]);
      }

      // Set active FYI
      if (activeFYIResult.status === "fulfilled") {
        setActiveFYI(activeFYIResult.value as FYI | null);
      } else {
        setActiveFYI(null);
      }

      // For new users, set empty arrays and skip loading contacts/timeline
      if (isNewUser) {
        console.log("New user - setting empty contacts and timeline");
        setContacts([]);
        setTimeline([]);
        return;
      }

      // For existing users, load contacts and timeline
      const [contactsResult, timelineResult] = await Promise.allSettled([
        fyiServiceInstance.getMutualContacts(phoneNumber),
        fyiServiceInstance.getUserTimeline(phoneNumber, 20),
      ]);

      // Set contacts
      if (contactsResult.status === "fulfilled") {
        setContacts(contactsResult.value as Contact[]);
      } else {
        console.log("Failed to load contacts, setting empty array");
        setContacts([]);
      }

      // Set timeline
      if (timelineResult.status === "fulfilled") {
        const timelineData = timelineResult.value as {
          items: TimelineItem[];
          lastVisible?: any;
        };
        setTimeline(timelineData.items);
      } else {
        console.log("Failed to load timeline, setting empty array");
        setTimeline([]);
      }

      // Set up real-time timeline listener for existing users
      const unsubscribe = fyiServiceInstance.subscribeToUserTimeline(
        phoneNumber,
        (items: any) => {
          setTimeline(items);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error("Error loading user data:", error);
      // Set default empty states on error
      setContacts([]);
      setGroups([]);
      setTimeline([]);
      setActiveFYI(null);
    }
  };

  // Actions
  const syncContacts = async (
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ) => {
    if (!currentUser) return { success: false, error: "Not authenticated" };

    try {
      setContactsLoading(true);
      const result = await fyiServiceInstance.syncContacts(
        currentUser.phone,
        deviceContacts
      );

      if (result.success) {
        // Reload contacts
        const updatedContacts = await fyiServiceInstance.getMutualContacts(
          currentUser.phone
        );
        setContacts(updatedContacts);

        // Reload timeline if new mutual contacts were found
        if (result.newMutualContacts > 0) {
          const updatedTimeline = await fyiServiceInstance.getUserTimeline(
            currentUser.phone,
            20
          );
          setTimeline(updatedTimeline.items);
        }
      }

      return result;
    } catch (error) {
      console.error("Error syncing contacts:", error);
      return { success: false, error: "Failed to sync contacts" };
    } finally {
      setContactsLoading(false);
    }
  };

  const backgroundSyncContacts = async (
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ) => {
    if (!currentUser) return { success: false, error: "Not authenticated" };

    try {
      console.log('Running background contact sync...');
      
      // Check if we should sync (avoid too frequent syncing)
      const shouldSync = await fyiServiceInstance.shouldSyncContacts(currentUser.phone);
      if (!shouldSync) {
        console.log('Skipping background sync - too soon since last sync');
        return { success: true, newMutualContacts: 0, totalMutualContacts: 0 };
      }

      const result = await fyiServiceInstance.backgroundContactSync(
        currentUser.phone,
        deviceContacts
      );

      if (result.success && result.newMutualContacts > 0) {
        console.log(`Background sync found ${result.newMutualContacts} new mutual contacts`);
        
        // Silently update contacts and timeline without showing loading states
        const updatedContacts = await fyiServiceInstance.getMutualContacts(
          currentUser.phone
        );
        setContacts(updatedContacts);

        const updatedTimeline = await fyiServiceInstance.getUserTimeline(
          currentUser.phone,
          20
        );
        setTimeline(updatedTimeline.items);
      }

      return result;
    } catch (error) {
      console.error("Error in background contact sync:", error);
      return { success: false, error: "Background sync failed" };
    }
  };

  const createUserWithContacts = async (
    phoneNumber: string,
    name: string,
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ) => {
    try {
      setIsLoading(true);

      // Create user with complete onboarding data
      const result = await fyiServiceInstance.createUserWithContacts(
        phoneNumber,
        name,
        deviceContacts
      );

      if (result.success) {
        // Load the created user into context
        const createdUser = await fyiServiceInstance.getUser(phoneNumber);
        if (createdUser) {
          setCurrentUser(createdUser);
          await loadUserData(phoneNumber, true);
        }
      }

      return result;
    } catch (error) {
      console.error("Error creating user with contacts:", error);
      return { success: false, error: "Failed to create user" };
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async (groupData: {
    name: string;
    emoji?: string;
    members: string[];
  }): Promise<string> => {
    if (!currentUser) throw new Error("Not authenticated");

    try {
      setGroupsLoading(true);
      const groupId = await fyiServiceInstance.createGroup(
        currentUser.phone,
        groupData
      );

      // Reload groups
      const updatedGroups = await fyiServiceInstance.getUserGroups(
        currentUser.phone
      );
      setGroups(updatedGroups);

      return groupId;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    } finally {
      setGroupsLoading(false);
    }
  };

  const createFYI = async (fyiData: CreateFYIRequest) => {
    if (!currentUser) return { success: false, error: "Not authenticated" };

    try {
      const result = await fyiServiceInstance.createFYI(
        currentUser.phone,
        fyiData
      );

      if (result.success) {
        // Reload active FYI
        const activeFYI = await fyiServiceInstance.getUserActiveFYI(
          currentUser.phone
        );
        setActiveFYI(activeFYI);

        // Reload timeline
        const updatedTimeline = await fyiServiceInstance.getUserTimeline(
          currentUser.phone,
          20
        );
        setTimeline(updatedTimeline.items);
      }

      return result;
    } catch (error) {
      console.error("Error creating FYI:", error);
      return { success: false, error: "Failed to create FYI" };
    }
  };

  const addReaction = async (fyiId: string, emoji: string) => {
    if (!currentUser) return;

    try {
      await fyiServiceInstance.addReaction(fyiId, currentUser.phone, emoji as any);

      // Update timeline state
      setTimeline((prev) =>
        prev.map((item) =>
          item.fyiId === fyiId
            ? { ...item, hasReacted: true, reactionCount: item.reactionCount + 1 }
            : item
        )
      );
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const removeReaction = async (fyiId: string) => {
    if (!currentUser) return;

    try {
      await fyiServiceInstance.removeReaction(fyiId, currentUser.phone);

      // Update timeline state
      setTimeline((prev) =>
        prev.map((item) =>
          item.fyiId === fyiId
            ? { ...item, hasReacted: false, reactionCount: Math.max(0, item.reactionCount - 1) }
            : item
        )
      );
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  };

  const markFYIAsSeen = async (fyiId: string) => {
    if (!currentUser) return;

    try {
      await fyiServiceInstance.markFYIAsSeen(fyiId, currentUser.phone);

      // Update timeline state
      setTimeline((prev) =>
        prev.map((item) =>
          item.fyiId === fyiId
            ? { ...item, hasSeen: true, seenCount: item.seenCount + 1 }
            : item
        )
      );
    } catch (error) {
      console.error("Error marking FYI as seen:", error);
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;

    try {
      await loadUserData(currentUser.phone, false);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error("Not authenticated");

    try {
      await fyiServiceInstance.updateUser(currentUser.phone, updates);

      // Update local state
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));

      // If user data significantly changed, reload everything
      if (updates.name) {
        await loadUserData(currentUser.phone, true);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const value: FYIContextType = {
    // Auth state
    currentUser,
    isAuthenticated,
    isLoading,

    // Core data
    contacts,
    groups,
    timeline,
    activeFYI,

    // Loading states
    contactsLoading,
    groupsLoading,
    timelineLoading,

    // Actions
    syncContacts,
    backgroundSyncContacts,
    createUserWithContacts,
    createGroup,
    createFYI,
    addReaction,
    removeReaction,
    markFYIAsSeen,

    // Utility
    refreshData,
    updateProfile,
  };

  return <FYIContext.Provider value={value}>{children}</FYIContext.Provider>;
};

export const useFYI = (): FYIContextType => {
  const context = useContext(FYIContext);
  if (context === undefined) {
    throw new Error("useFYI must be used within a FYIProvider");
  }
  return context;
};