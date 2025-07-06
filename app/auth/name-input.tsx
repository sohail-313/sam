import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { useFYI } from "@/contexts/FYIProvider";


export default function NameInputScreen() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams();
  const { refreshUser } = useAuth();
  const { updateProfile, currentUser, isAuthenticated } = useFYI();

  // Check if user already has a name
  useEffect(() => {
    const checkExistingUser = async () => {
      console.log("Checking user state:", { isAuthenticated, currentUser });

      if (isAuthenticated) {
        if (currentUser && currentUser.name && currentUser.name.trim()) {
          // User already has a name, go to main app
          console.log("User already has name:", currentUser.name);
          router.replace("/(tabs)" as any);
          return;
        }

        // User is authenticated but either:
        // 1. currentUser is null (new user, doesn't exist in Firestore yet)
        // 2. currentUser exists but has no name
        // In both cases, stay on this screen to collect name
        console.log("User authenticated but needs name input");
        setIsCheckingUser(false);
      }
    };

    // Wait a bit for FYI provider to load user data, then check
    const timer = setTimeout(checkExistingUser, 1500);

    // Fallback: if still checking after 5 seconds, proceed anyway
    const fallbackTimer = setTimeout(() => {
      console.log("Fallback: proceeding to name input after timeout");
      setIsCheckingUser(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [isAuthenticated, currentUser, router]);

  if (isCheckingUser) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600">Setting up your profile...</Text>
      </View>
    );
  }

  const handleContinue = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert(
        "Invalid Name",
        "Please enter your full name (at least 2 characters)"
      );
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert(
        "Name Too Long",
        "Please enter a name with less than 50 characters"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Don't create user yet - pass name to contact sync screen
      // The contact sync screen will create the user with complete data

      // Navigate to contact sync screen with user data
      router.replace({
        pathname: "/auth/contact-sync",
        params: {
          phoneNumber: phoneNumber as string,
          userName: trimmedName,
        },
      } as any);
    } catch (error) {
      console.error("Error proceeding to contact sync:", error);
      Alert.alert("Error", "Failed to proceed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Name is now required - no skip option
    Alert.alert(
      "Name Required",
      "Your name is required to use FYI so your friends can recognize you.",
      [{ text: "OK" }]
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 px-6 py-12 justify-center">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            What's your name?
          </Text>
          <Text className="text-lg text-gray-600 text-center">
            This is how your friends will see you on FYI
          </Text>
        </View>

        {/* Phone Number Display */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 text-center">
            Phone number: {phoneNumber}
          </Text>
        </View>

        {/* Name Input */}
        <View className="mb-8">
          <Text className="text-base font-medium text-gray-700 mb-3">
            Full Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            className="border border-gray-300 rounded-lg p-4 text-lg text-gray-900"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={50}
            autoFocus
          />
          <Text className="text-sm text-gray-500 mt-2">
            {name.length}/50 characters
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4">
          <Pressable
            onPress={handleContinue}
            disabled={isLoading || !name.trim()}
            className={`p-4 rounded-lg ${
              name.trim() && !isLoading ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <View className="flex-row items-center justify-center">
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color="white"
                  className="mr-2"
                />
              )}
              <Text
                className={`text-lg font-semibold ${
                  name.trim() && !isLoading ? "text-white" : "text-gray-500"
                }`}
              >
                {isLoading ? "Saving..." : "Continue"}
              </Text>
            </View>
          </Pressable>

          {/* Remove skip button - name is now required */}
        </View>

        {/* Privacy Note */}
        <View className="mt-8">
          <Text className="text-xs text-gray-500 text-center">
            Your name helps friends recognize you on FYI. You can change this
            anytime in settings.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}