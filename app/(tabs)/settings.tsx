import React from "react";
import { Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          // Navigate to onboarding screen after sign out
          router.replace("/onboarding" as any);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-6 pt-12 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>

      {/* Profile Section */}
      <View className="bg-white mt-4 mx-4 p-4 rounded-lg border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          Profile
        </Text>
        <Text className="text-gray-600">Phone: {user?.phoneNumber}</Text>
        <Text className="text-gray-600">
          Verified:{" "}
          {user?.verifiedAt
            ? new Date(user.verifiedAt).toLocaleDateString()
            : "N/A"}
        </Text>
      </View>

      {/* Settings Options */}
      <View className="bg-white mt-4 mx-4 rounded-lg border border-gray-200">
        <TouchableOpacity className="p-4 border-b border-gray-100">
          <Text className="text-gray-900">Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity className="p-4 border-b border-gray-100">
          <Text className="text-gray-900">Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity className="p-4 border-b border-gray-100">
          <Text className="text-gray-900">About</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignOut} className="p-4">
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}