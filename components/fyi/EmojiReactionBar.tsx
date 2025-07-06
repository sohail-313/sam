import React from "react";
import { View, Pressable, Text } from "react-native";

interface EmojiReactionBarProps {
  onReact: (emoji: string) => void;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export const EmojiReactionBar: React.FC<EmojiReactionBarProps> = ({
  onReact,
}) => {
  return (
    <View className="flex-row items-center justify-center mt-3 p-2 bg-gray-100 rounded-lg">
      {REACTION_EMOJIS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onReact(emoji)}
          className="mx-2 p-2 rounded-full active:bg-gray-200"
        >
          <Text className="text-2xl">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
};