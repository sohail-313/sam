import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

type Message = {
  id: string;
  sender: string;
  text: string;
  time: string;
  isRead: boolean;
  hasAttachment?: boolean;
  group: string;
  reaction?: string;
};

type MessageItemProps = {
  message: Message;
  onReact: (id: string, emoji: string) => void;
  selectedMessageId: string | null;
  setSelectedMessageId: (id: string | null) => void;
};

type MessagesScreenProps = {
  groupName: string;
  messages: Message[];
  onReact: (id: string, emoji: string) => void;
  selectedMessageId: string | null;
  setSelectedMessageId: (id: string | null) => void;
};

// Emoji Bar Component
const EmojiReactionBar: React.FC<{
  onReact: (emoji: string) => void;
}> = ({ onReact }) => {
  const emojis = ['👍', '😂', '❤️', '😮', '😢'];
  return (
    <View className="flex-row mt-2 space-x-2">
      {emojis.map((emoji) => (
        <Text
          key={emoji}
          onPress={() => onReact(emoji)}
          className="text-xl"
        >
          {emoji}
        </Text>
      ))}
    </View>
  );
};

// Message Item
const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onReact,
  selectedMessageId,
  setSelectedMessageId,
}) => {
  const isSelected = selectedMessageId === message.id;

  const handleReactionToggle = () => {
    if (isSelected) {
      setSelectedMessageId(null);
    } else {
      setSelectedMessageId(message.id);
    }
  };

  return (
    <Pressable
      onLongPress={handleReactionToggle}
      className="py-2 px-3 border-b border-gray-200"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center">
          <Text className="font-bold">
            {message.sender.substring(0, 1).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-bold">{message.sender}</Text>
          <Text numberOfLines={1}>{message.text}</Text>
        </View>
        <View className="items-end ml-2">
          <Text className="text-xs">{message.time}</Text>
          {message.hasAttachment && <Text>📎</Text>}
        </View>
      </View>

      {/* Reaction or Toggle Icon */}
      <View className="flex-row items-center justify-between mt-2">
        <View />
        {message.reaction ? (
          <Text
            className="text-xl"
            onPress={() => onReact(message.id, message.reaction!)} // toggle off
          >
            {message.reaction}
          </Text>
        ) : (
          <Text className="text-2xs" onPress={handleReactionToggle}>
            {isSelected ? '➖' : '➕'}
          </Text>
        )}
      </View>

      {/* Emoji Picker (if selected) */}
      {isSelected && (
        <EmojiReactionBar
          onReact={(emoji) => {
            onReact(message.id, emoji);
            setSelectedMessageId(null);
          }}
        />
      )}
    </Pressable>
  );
};

// Messages List per Tab
const MessagesScreen: React.FC<MessagesScreenProps> = ({
  groupName,
  messages,
  onReact,
  selectedMessageId,
  setSelectedMessageId,
}) => {
  const filteredMessages =
    groupName === 'All'
      ? messages
      : messages.filter((msg) => msg.group === groupName);

  return (
    <FlatList
      data={filteredMessages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MessageItem
          message={item}
          onReact={onReact}
          selectedMessageId={selectedMessageId}
          setSelectedMessageId={setSelectedMessageId}
        />
      )}
    />
  );
};

// Main FYI Screen
const FYIScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Me',
      text: 'Building FYI',
      time: '4:00',
      isRead: true,
      group: 'Office',
    },
    {
      id: '2',
      sender: 'Nome',
      text: 'Shayari session at 10:00 PM in lounge',
      time: '9:41',
      isRead: false,
      group: 'Family',
    },
    {
      id: '3',
      sender: 'BD',
      text: 'Will be in office tomorrow',
      time: '10:15',
      isRead: false,
      group: 'Office',
    },
    {
      id: '4',
      sender: 'Mom',
      text: 'Sunday Special Biryani',
      time: '2:30',
      isRead: true,
      group: 'Family',
    },
    {
      id: '5',
      sender: 'Jaf',
      text: 'Bike trip planned this Sunday',
      time: '7:22',
      isRead: false,
      group: 'BFF',
    },
  ]);

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );

  const unreadCount = messages.filter((msg) => !msg.isRead).length;
  const groups = ['All', ...new Set(messages.map((msg) => msg.group))];

  // Reaction toggle handler
  const handleReaction = (id: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              reaction: msg.reaction === emoji ? undefined : emoji,
            }
          : msg
      )
    );
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold">FYI ({unreadCount})</Text>
        </View>
      </View>

      {/* Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: { backgroundColor: '#f0f0f0' },
          tabBarIndicatorStyle: { backgroundColor: '#000' },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: 'auto' },
          tabBarLabelStyle: { textTransform: 'none' },
        }}
      >
        {groups.map((group) => (
          <Tab.Screen
            key={group}
            name={group}
            children={() => (
              <MessagesScreen
                groupName={group}
                messages={messages}
                onReact={handleReaction}
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
