import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MessagesScreen } from "@/components/fyi/MessagesScreen";
import { useFYI } from "@/contexts/FYIProvider";

const Tab = createMaterialTopTabNavigator();

export default function FYIScreen() {
  const fyiContext = useFYI();

  useEffect(() => {
    if (fyiContext.currentUser) {
      // Load initial data
      fyiContext.refreshData().catch((err: Error) => {
        console.error("Failed to load data:", err);
      });
    }
  }, [fyiContext.currentUser]);

  if (fyiContext.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600">Loading FYIs...</Text>
      </View>
    );
  }

  if (!fyiContext.isAuthenticated || !fyiContext.currentUser) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-600">Please sign in to view FYIs</Text>
      </View>
    );
  }

  // Create tab screens for All + each group
  const AllFYIsScreen = () => (
    <MessagesScreen
      title="All FYIs"
      fyis={fyiContext.timeline}
      onReact={fyiContext.addReaction}
      onMarkAsSeen={fyiContext.markFYIAsSeen}
      isLoading={fyiContext.timelineLoading}
    />
  );

  const GroupScreen = ({
    groupId,
    groupName,
  }: {
    groupId: string;
    groupName: string;
  }) => {
    // Filter timeline for specific group
    const groupFYIs = fyiContext.timeline.filter(
      (fyi) => fyi.targetType === "group" && fyi.isFromGroup === groupId
    );

    return (
      <MessagesScreen
        title={groupName}
        fyis={groupFYIs}
        onReact={fyiContext.addReaction}
        onMarkAsSeen={fyiContext.markFYIAsSeen}
        isLoading={fyiContext.timelineLoading}
      />
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#F2F2F7",
        },
        tabBarIndicatorStyle: {
          backgroundColor: "#007AFF",
        },
      }}
    >
      <Tab.Screen
        name="All"
        component={AllFYIsScreen}
        options={{ title: "All FYIs" }}
      />
      {fyiContext.groups.map((group) => (
        <Tab.Screen
          key={group.groupId}
          name={group.groupId}
          options={{ title: group.name }}
        >
          {() => <GroupScreen groupId={group.groupId} groupName={group.name} />}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}