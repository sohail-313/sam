import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { EmojiReactionBar } from "./EmojiReactionBar";

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

interface MessageItemProps {
  fyi: TimelineItem;
  onReact: (fyiId: string, emoji: string) => Promise<void>;
  onMarkAsSeen: (fyiId: string) => Promise<void>;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  fyi,
  onReact,
  onMarkAsSeen,
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString();
  };

  const handleReact = async (emoji: string) => {
    await onReact(fyi.fyiId, emoji);
    setShowReactions(false);
  };

  const handlePress = async () => {
    if (!fyi.hasSeen) {
      await onMarkAsSeen(fyi.fyiId);
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        className={`mx-4 my-2 p-4 rounded-lg border ${
          fyi.hasSeen
            ? "bg-gray-50 border-gray-200"
            : "bg-white border-blue-200"
        }`}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900">
              {fyi.senderName || "Unknown"}
            </Text>
            {fyi.isFromGroup && (
              <Text className="ml-2 text-sm text-gray-500">
                • {fyi.isFromGroup}
              </Text>
            )}
          </View>
          <Text className="text-xs text-gray-500">
            {formatTime(fyi.createdAt)}
          </Text>
        </View>

        {/* Message */}
        <Text className="text-gray-800 mb-3">{fyi.text}</Text>

        {/* Bottom Actions */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            <Pressable
              onPress={() => setShowReactions(!showReactions)}
              className="flex-row items-center"
            >
              <Text className="text-2xl mr-1">😊</Text>
              {fyi.reactionCount > 0 && (
                <Text className="text-sm text-gray-600">
                  {fyi.reactionCount}
                </Text>
              )}
            </Pressable>

            {fyi.seenCount > 0 && (
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-500">
                  👁 {fyi.seenCount} seen
                </Text>
              </View>
            )}
          </View>

          {!fyi.hasSeen && (
            <View className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </View>

        {/* Reaction Bar */}
        {showReactions && <EmojiReactionBar onReact={handleReact} />}
      </View>
    </Pressable>
  );
};