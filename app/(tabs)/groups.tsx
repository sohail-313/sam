import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";


interface Group {
  id: string;
  name: string;
  memberCount: number;
  lastActivity: string;
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    // Load user's groups
    loadGroups();
  }, []);

  const loadGroups = () => {
    // Mock data for now
    const mockGroups: Group[] = [
      {
        id: "1",
        name: "Family",
        memberCount: 5,
        lastActivity: "2 hours ago",
      },
      {
        id: "2",
        name: "Work Team",
        memberCount: 12,
        lastActivity: "1 hour ago",
      },
      {
        id: "3",
        name: "Friends",
        memberCount: 8,
        lastActivity: "30 minutes ago",
      },
    ];
    setGroups(mockGroups);
  };

  const handleCreateGroup = () => {
    Alert.alert("Create Group", "Group creation functionality coming soon!");
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity className="bg-white p-4 mb-3 rounded-lg border border-gray-200">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {item.name}
          </Text>
          <Text className="text-sm text-gray-600">
            {item.memberCount} members
          </Text>
        </View>
        <Text className="text-xs text-gray-500">{item.lastActivity}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-6 pt-12 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Groups</Text>
            <Text className="text-sm text-gray-600">
              Welcome
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreateGroup}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Groups List */}
      <View className="flex-1 px-4 py-4">
        {groups.length > 0 ? (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-center mb-4">
              No groups yet
            </Text>
            <TouchableOpacity
              onPress={handleCreateGroup}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">
                Create Your First Group
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
