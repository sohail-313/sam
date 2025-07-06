import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/phone-input" as any);
  };

  return (
    <View className="flex-1 bg-white px-6 py-12 justify-center items-center">
      {/* Logo/Icon */}
      <View className="mb-8">
        <Image
          source={require("@/assets/images/icon.png")}
          className="w-24 h-24 mb-4"
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
        Welcome to FYI
      </Text>

      {/* Subtitle */}
      <Text className="text-lg text-gray-600 text-center mb-8 px-4">
        Stay connected with your groups and never miss important updates
      </Text>

      {/* Features */}
      <View className="mb-12 space-y-4">
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
          <Text className="text-gray-700">Send FYIs to groups or everyone</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
          <Text className="text-gray-700">React with emojis</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
          <Text className="text-gray-700">Track who's seen your messages</Text>
        </View>
      </View>

      {/* Get Started Button */}
      <TouchableOpacity
        onPress={handleGetStarted}
        className="bg-blue-500 px-8 py-4 rounded-lg w-full"
      >
        <Text className="text-white text-lg font-semibold text-center">
          Get Started
        </Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text className="text-sm text-gray-500 text-center mt-6 px-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}
