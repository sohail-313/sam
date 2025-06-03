import { Timestamp } from "firebase/firestore";

// User data model
export type User = {
  uid: string;
  phoneNumber: string;
  name: string;
  profilePictureUrl?: string;
  contacts: Contact[];
  mutualContacts: string[];
  contactsLastSynced?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// Contact stored in user's contacts array
export type Contact = {
  phoneNumber: string;
  savedName: string;
};

// Group data model
export type Group = {
  groupId: string;
  groupName: string;
  ownerId: string;
  members: string[];
  createdAt: Timestamp;
};

// FYI message data model
export type FYI = {
  fyiId: string;
  senderUserId: string;
  targetType: "group" | "all";
  targetId?: string;
  message: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deleted: boolean;
  
  // Computed fields for UI (not stored in DB)
  senderName?: string;
  senderProfilePic?: string;
  groupName?: string;
  seenCount?: number;
  reactions?: Reaction[];
  isSeenByCurrentUser?: boolean;
};

// SeenBy subcollection document
export type SeenBy = {
  seenBy: string; // userId
  seenAt: Timestamp;
};

// Reaction subcollection document
export type Reaction = {
  reactedBy: string;
  emoji: string;
  reactedAt: Timestamp;
  reactionId?: string; // document ID
};

// Component Props
export type MessageItemProps = {
  fyi: FYI;
  currentUserId: string;
  onReact: (fyiId: string, emoji: string) => void;
  onMarkAsSeen: (fyiId: string) => void;
  selectedMessageId: string | null;
  setSelectedMessageId: (id: string | null) => void;
};

export type MessagesScreenProps = {
  groupName: string;
  fyis: FYI[];
  currentUserId: string;
  onReact: (fyiId: string, emoji: string) => void;
  onMarkAsSeen: (fyiId: string) => void;
  selectedMessageId: string | null;
  setSelectedMessageId: (id: string | null) => void;
};

export type EmojiReactionBarProps = {
  onReact: (emoji: string) => void;
};

export type FYIHeaderProps = {
  unreadCount: number;
  currentUser: User | null;
  onCreateUser: () => void;
  onCreateFYI: () => void;
};