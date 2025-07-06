import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { MessageItem } from "./MessageItem";

interface TimelineItem {
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
  hasReacted: boolean;
  hasSeen: boolean;
  isFromGroup?: string;
}

interface MessagesScreenProps {
  title: string;
  fyis: TimelineItem[];
  onReact: (fyiId: string, emoji: string) => Promise<void>;
  onMarkAsSeen: (fyiId: string) => Promise<void>;
  loadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  title,
  fyis,
  onReact,
  onMarkAsSeen,
  loadMore,
  isLoading = false,
  hasMore = false,
}) => {
  const renderItem = ({ item }: { item: TimelineItem }) => (
    <MessageItem fyi={item} onReact={onReact} onMarkAsSeen={onMarkAsSeen} />
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-lg text-gray-500">No FYIs yet</Text>
      <Text className="text-sm text-gray-400 text-center mt-2">
        {title === "All FYIs"
          ? "Share your first FYI to get started!"
          : "This group doesn't have any FYIs yet"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={fyis}
        renderItem={renderItem}
        keyExtractor={(item) => item.fyiId}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: 8,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};