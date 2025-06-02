import EmojiPlaceholderIcon from "@/components/icons/EmojiPlaceholderIcon";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { FlatList, ImageBackground, Pressable, Text, View, Alert } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import BottomSheet from "@gorhom/bottom-sheet";
import { db } from "@/FirebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp 
} from "firebase/firestore";

const Tab = createMaterialTopTabNavigator();

// Updated Types based on your data model
type User = {
  uid: string;
  name: string;
  phone: string;
  profilePicture?: string;
  createdAt: Timestamp;
};

type Group = {
  groupId: string;
  groupName: string;
  ownerId: string;
  members: string[];
  createdAt: Timestamp;
};

type FYI = {
  fyiId: string;
  senderUserId: string;
  targetType: "group" | "all";
  targetId?: string; // groupId if targetType == "group"
  message: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deleted: boolean;
  // Derived fields for UI
  senderName?: string;
  senderProfilePic?: string;
  groupName?: string;
  seenCount?: number;
  reactions?: Reaction[];
  isSeenByCurrentUser?: boolean;
};

type SeenBy = {
  seenBy: string;
  seenAt: Timestamp;
};

type Reaction = {
  reactedBy: string;
  emoji: string;
  reactedAt: Timestamp;
  reactionId?: string;
};

type MessageItemProps = {
  fyi: FYI;
  currentUserId: string;
  onReact: (fyiId: string, emoji: string) => void;
  onMarkAsSeen: (fyiId: string) => void;
  selectedMessageId: string | null;
  setSelectedMessageId: (id: string | null) => void;
};

type MessagesScreenProps = {
  groupName: string;
  fyis: FYI[];
  currentUserId: string;
  onReact: (fyiId: string, emoji: string) => void;
  onMarkAsSeen: (fyiId: string) => void;
  selectedMessageId: string | null;
  setSelectedMessageId: (id: string | null) => void;
};

// Emoji Bar Component
const EmojiReactionBar: React.FC<{
  onReact: (emoji: string) => void;
}> = ({ onReact }) => {
  const emojis = ["👍", "😂", "❤️", "😮", "😢"];
  return (
    <View className="flex-row mt-2 space-x-2">
      {emojis.map((emoji) => (
        <Pressable key={emoji} onPress={() => onReact(emoji)}>
          <Text className="text-xl px-2 py-1">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
};

// Message Item Component
const MessageItem: React.FC<MessageItemProps> = ({
  fyi,
  currentUserId,
  onReact,
  onMarkAsSeen,
  selectedMessageId,
  setSelectedMessageId,
}) => {
  const isSelected = selectedMessageId === fyi.fyiId;

  const handleReactionToggle = () => {
    if (isSelected) {
      setSelectedMessageId(null);
    } else {
      setSelectedMessageId(fyi.fyiId);
    }
  };

  const handlePress = () => {
    if (!fyi.isSeenByCurrentUser) {
      onMarkAsSeen(fyi.fyiId);
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getUserReaction = () => {
    return fyi.reactions?.find(r => r.reactedBy === currentUserId);
  };

  const userReaction = getUserReaction();

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleReactionToggle}
      className={`py-3 px-4 border-b border-gray-200 ${!fyi.isSeenByCurrentUser ? 'bg-blue-50' : 'bg-white'}`}
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
          {fyi.senderProfilePic ? (
            <ImageBackground
              source={{ uri: fyi.senderProfilePic }}
              className="w-full h-full rounded-full"
              imageStyle={{ borderRadius: 24 }}
            />
          ) : (
            <Text className="font-bold text-lg">
              {fyi.senderName?.substring(0, 1).toUpperCase() || 'U'}
            </Text>
          )}
        </View>
        
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="font-bold text-base">{fyi.senderName || 'Unknown'}</Text>
            {fyi.targetType === 'group' && fyi.groupName && (
              <Text className="text-gray-500 text-sm ml-2">→ {fyi.groupName}</Text>
            )}
            {fyi.targetType === 'all' && (
              <Text className="text-gray-500 text-sm ml-2">→ Everyone</Text>
            )}
          </View>
          <Text className="text-gray-800 mt-1">{fyi.message}</Text>
          
          <View className="flex-row items-center mt-2">
            <Text className="text-xs text-gray-500">
              {formatTime(fyi.createdAt)}
            </Text>
            {fyi.seenCount !== undefined && fyi.seenCount > 0 && (
              <Text className="text-xs text-gray-500 ml-3">
                👀 {fyi.seenCount} seen
              </Text>
            )}
            {!fyi.isSeenByCurrentUser && (
              <View className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
            )}
          </View>
        </View>
      </View>

      {/* Reactions Display */}
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          {userReaction ? (
            <Pressable onPress={() => onReact(fyi.fyiId, userReaction.emoji)}>
              <Text className="text-xl bg-blue-100 px-2 py-1 rounded-full">
                {userReaction.emoji}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleReactionToggle}>
              <EmojiPlaceholderIcon />
            </Pressable>
          )}
          
          {/* Other reactions */}
          {fyi.reactions && fyi.reactions.length > 0 && (
            <View className="flex-row ml-2">
              {fyi.reactions
                .filter(r => r.reactedBy !== currentUserId)
                .slice(0, 3)
                .map((reaction, index) => (
                  <Text key={index} className="text-lg ml-1">
                    {reaction.emoji}
                  </Text>
                ))}
              {fyi.reactions.filter(r => r.reactedBy !== currentUserId).length > 3 && (
                <Text className="text-sm text-gray-500 ml-1">
                  +{fyi.reactions.filter(r => r.reactedBy !== currentUserId).length - 3}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Emoji Picker */}
      {isSelected && (
        <EmojiReactionBar
          onReact={(emoji) => {
            onReact(fyi.fyiId, emoji);
            setSelectedMessageId(null);
          }}
        />
      )}
    </Pressable>
  );
};

// Messages Screen for each tab
const MessagesScreen: React.FC<MessagesScreenProps> = ({
  groupName,
  fyis,
  currentUserId,
  onReact,
  onMarkAsSeen,
  selectedMessageId,
  setSelectedMessageId,
}) => {
  const filteredFyis = groupName === "All" 
    ? fyis 
    : fyis.filter((fyi) => 
        fyi.targetType === 'all' || 
        (fyi.targetType === 'group' && fyi.groupName === groupName)
      );

  return (
    <FlatList
      data={filteredFyis}
      keyExtractor={(item) => item.fyiId}
      renderItem={({ item }) => (
        <MessageItem
          fyi={item}
          currentUserId={currentUserId}
          onReact={onReact}
          onMarkAsSeen={onMarkAsSeen}
          selectedMessageId={selectedMessageId}
          setSelectedMessageId={setSelectedMessageId}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

// Firebase Service Functions
class FYIService {
  static currentUserId = "user123"; // Replace with actual auth user ID

  // Create a new FYI
  static async createFYI(message: string, targetType: "group" | "all", targetId?: string) {
    try {
      const fyiData = {
        senderUserId: this.currentUserId,
        targetType,
        targetId: targetId || null,
        message,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        deleted: false
      };

      const docRef = await addDoc(collection(db, "fyis"), fyiData);
      console.log("FYI created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating FYI:", error);
      throw error;
    }
  }

  // Mark FYI as seen
  static async markAsSeen(fyiId: string, userId: string = this.currentUserId) {
    try {
      const seenByRef = collection(db, "fyis", fyiId, "seenBy");
      await addDoc(seenByRef, {
        seenBy: userId,
        seenAt: Timestamp.now()
      });
      console.log("FYI marked as seen");
    } catch (error) {
      console.error("Error marking FYI as seen:", error);
    }
  }

  // Add or remove reaction
  static async toggleReaction(fyiId: string, emoji: string, userId: string = this.currentUserId) {
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
        console.log("Reaction added");
      } else {
        // Remove reaction
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        console.log("Reaction removed");
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  }

  // Create a sample user (for testing)
  static async createSampleUser() {
    try {
      const userData = {
        uid: this.currentUserId,
        name: "Sohail",
        phone: "+911234567890",
        profilePicture: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbfZ70XlFBRq_Qd2pzMgq0iw0OdEH2YSGqsgp9eKaI8NPX1qYu7pSc3NX8cSd_F50cfP8myD9-tvD36H1HmHiBVHAYnzi8dcfGDBB_DxgLKpICTO-wzVW7En9pmMNhAIEU8a0zNLah7tfjDXw_o5fkynv9JDpUCaf6dWpJdDz9g25S1S50gMR_NyyIVNy-VbeFC69qDCUrwuJF_KUXZyGqmvBvGNglcC9bmJnc8rMpT7Muh5qb0mOhzWjBdz7wSFOA4MtO9fekL-7c",
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, "users", this.currentUserId), userData);
      console.log("Sample user created");
    } catch (error) {
      console.error("Error creating sample user:", error);
    }
  }
}

// Main FYI Screen
const FYIScreen: React.FC = () => {
  const [fyis, setFyis] = useState<FYI[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = FYIService.currentUserId;

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadUsers();
        await loadGroups();
        await loadFYIs();
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersMap = new Map<string, User>();
    usersSnapshot.forEach((doc) => {
      usersMap.set(doc.id, { ...doc.data() as User, uid: doc.id });
    });
    setUsers(usersMap);
  };

  const loadGroups = async () => {
    const groupsSnapshot = await getDocs(collection(db, "groups"));
    const groupsData: Group[] = [];
    groupsSnapshot.forEach((doc) => {
      groupsData.push({ ...doc.data() as Group, groupId: doc.id });
    });
    setGroups(groupsData);
  };

  const loadFYIs = async () => {
    const fyisQuery = query(
      collection(db, "fyis"),
      where("deleted", "==", false),
      orderBy("createdAt", "desc")
    );

    const fyisSnapshot = await getDocs(fyisQuery);
    const fyisData: FYI[] = [];

    for (const fyiDoc of fyisSnapshot.docs) {
      const fyiData = fyiDoc.data();
      const fyi: FYI = {
        ...fyiData as FYI,
        fyiId: fyiDoc.id,
      };

      // Load additional data for each FYI
      await enrichFYIData(fyi);
      fyisData.push(fyi);
    }

    setFyis(fyisData);
  };

  const enrichFYIData = async (fyi: FYI) => {
    // Get sender info
    const sender = users.get(fyi.senderUserId);
    fyi.senderName = sender?.name || 'Unknown User';
    fyi.senderProfilePic = sender?.profilePicture;

    // Get group info if applicable
    if (fyi.targetType === 'group' && fyi.targetId) {
      const group = groups.find(g => g.groupId === fyi.targetId);
      fyi.groupName = group?.groupName;
    }

    // Load seen count
    const seenBySnapshot = await getDocs(collection(db, "fyis", fyi.fyiId, "seenBy"));
    fyi.seenCount = seenBySnapshot.size;
    fyi.isSeenByCurrentUser = seenBySnapshot.docs.some(doc => doc.data().seenBy === currentUserId);

    // Load reactions
    const reactionsSnapshot = await getDocs(collection(db, "fyis", fyi.fyiId, "reactions"));
    fyi.reactions = reactionsSnapshot.docs.map(doc => ({
      ...doc.data() as Reaction,
      reactionId: doc.id
    }));
  };

  const handleReaction = async (fyiId: string, emoji: string) => {
    try {
      await FYIService.toggleReaction(fyiId, emoji);
      // Reload FYIs to reflect changes
      await loadFYIs();
    } catch (error) {
      Alert.alert("Error", "Failed to update reaction");
    }
  };

  const handleMarkAsSeen = async (fyiId: string) => {
    try {
      await FYIService.markAsSeen(fyiId);
      // Reload FYIs to reflect changes
      await loadFYIs();
    } catch (error) {
      console.error("Error marking as seen:", error);
    }
  };

  const unreadCount = fyis.filter(fyi => !fyi.isSeenByCurrentUser).length;
  const allGroups = ["All", ...groups.map(g => g.groupName)];

  const currentUser = users.get(currentUserId);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%"], []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 pt-12">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-jakartaBold">FYI ({unreadCount})</Text>
          <Pressable onPress={() => FYIService.createSampleUser()}>
            <AntDesign name="plus" size={24} color="#000" />
          </Pressable>
        </View>
      </View>

      {/* My FYI */}
      <View className="flex-row gap-4 px-4 py-3 items-center border-b border-gray-100">
        <ImageBackground
          source={{
            uri: currentUser?.profilePicture || "https://via.placeholder.com/70"
          }}
          className="h-[70px] w-[70px] rounded-full bg-cover bg-center"
          imageStyle={{ borderRadius: 9999 }}
        />
        <View className="flex-1 justify-center">
          <Text className="text-[#121416] font-jakartaMedium text-base">
            {currentUser?.name || 'Me'}
          </Text>
          <Text className="text-[#6a7681] font-jakarta text-sm">
            Just finished a great workout at the gym. Feeling energized!
          </Text>
          <Text className="text-[#6a7681] font-jakarta text-sm">10m ago</Text>
        </View>

        <Pressable onPress={() => FYIService.createFYI("Test message", "all")}>
          <AntDesign name="ellipsis1" size={24} color="#6a7681" />
        </Pressable>
      </View>

      {/* Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#000",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: { backgroundColor: "#f8f9fa" },
          tabBarIndicatorStyle: { backgroundColor: "#000" },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: "auto", minWidth: 80 },
          tabBarLabelStyle: { textTransform: "none", fontSize: 14 },
        }}
      >
        {allGroups.map((groupName) => (
          <Tab.Screen
            key={groupName}
            name={groupName}
            children={() => (
              <MessagesScreen
                groupName={groupName}
                fyis={fyis}
                currentUserId={currentUserId}
                onReact={handleReaction}
                onMarkAsSeen={handleMarkAsSeen}
                selectedMessageId={selectedMessageId}
                setSelectedMessageId={setSelectedMessageId}
              />
            )}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
};

export default FYIScreen;