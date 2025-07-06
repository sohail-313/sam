import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Contacts from "expo-contacts";
import { useAuth } from "@/auth/AuthProvider";
import { useFYI } from "@/contexts/FYIProvider";


export default function ContactSyncScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [contactsGranted, setContactsGranted] = useState<boolean | null>(null);
  const router = useRouter();
  const { phoneNumber, userName } = useLocalSearchParams();
  const { refreshUser } = useAuth();
  const { createUserWithContacts } = useFYI();

  // Check contacts permission on mount
  useEffect(() => {
    checkContactsPermission();
  }, []);

  const checkContactsPermission = async () => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      setContactsGranted(status === "granted");
    } catch (error) {
      console.error("Error checking contacts permission:", error);
      setContactsGranted(false);
    }
  };

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsGranted(status === "granted");
      return status === "granted";
    } catch (error) {
      console.error("Error requesting contacts permission:", error);
      return false;
    }
  };

  const handleSyncContacts = async () => {
    setIsLoading(true);
    try {
      // Request permission if not granted
      let hasPermission = contactsGranted;
      if (!hasPermission) {
        hasPermission = await requestContactsPermission();
      }

      if (!hasPermission) {
        Alert.alert(
          "Contacts Permission Required",
          "FYI needs access to your contacts to help you share updates with friends. Without this permission, you won't be able to send FYIs to your contacts.",
          [
            { text: "Try Again", onPress: () => handleSyncContacts() },
            {
              text: "Continue Without",
              style: "destructive",
              onPress: () => handleContinueWithoutContacts(),
            },
          ]
        );
        return;
      }

      // Get device contacts
      console.log("Fetching device contacts...");
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      // Process contacts to extract phone numbers
      const deviceContacts: { phoneNumber: string; savedName: string }[] = [];

      data.forEach((contact) => {
        if (contact.phoneNumbers) {
          contact.phoneNumbers.forEach((phone) => {
            if (phone.number) {
              // Clean phone number (remove spaces, dashes, etc.)
              const cleanNumber = phone.number.replace(/[^\d+]/g, "");
              if (cleanNumber.length >= 10) {
                // Valid phone number
                deviceContacts.push({
                  phoneNumber: cleanNumber,
                  savedName: contact.name || "Unknown",
                });
              }
            }
          });
        }
      });

      console.log(`Found ${deviceContacts.length} contacts`);

      // Now create user with complete profile and sync contacts
      await completeOnboardingWithContacts(deviceContacts);
    } catch (error) {
      console.error("Error syncing contacts:", error);
      Alert.alert(
        "Contact Sync Failed",
        "There was an error syncing your contacts. You can try again later in settings.",
        [{ text: "Continue", onPress: () => completeOnboarding(false) }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboardingWithContacts = async (
    deviceContacts: { phoneNumber: string; savedName: string }[]
  ) => {
    try {
      // Create user with name (or empty string) and sync contacts in one operation
      const result = await createUserWithContacts(
        phoneNumber as string,
        (userName as string) || "", // Handle empty name
        deviceContacts
      );

      if (result.success) {
        console.log(
          `User created with ${result.totalMutualContacts} mutual contacts`
        );

        // Refresh auth context
        await refreshUser();

        // Show success message if mutual contacts found
        if (result.newMutualContacts > 0) {
          Alert.alert(
            "Welcome to FYI!",
            `Found ${result.newMutualContacts} friends already using FYI!`,
            [
              {
                text: "Let's Go!",
                onPress: () => router.replace("/(tabs)" as any),
              },
            ]
          );
        } else {
          router.replace("/(tabs)" as any);
        }
      } else {
        throw new Error(result.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      Alert.alert("Setup Error", "Failed to complete setup. Please try again.");
    }
  };

  const completeOnboarding = async (withContacts: boolean) => {
    // Fallback: create user without contact sync
    try {
      await createUserWithContacts(
        phoneNumber as string,
        (userName as string) || "", // Handle empty name
        []
      );
      await refreshUser();
      router.replace("/(tabs)" as any);
    } catch (error) {
      console.error("Error creating user:", error);
      Alert.alert("Setup Error", "Failed to complete setup. Please try again.");
    }
  };

  const handleContinueWithoutContacts = () => {
    Alert.alert(
      "Continue Without Contacts?",
      "You won't be able to send FYIs to your friends or see who's using FYI. You can enable contacts later in settings.",
      [
        { text: "Go Back", style: "cancel" },
        {
          text: "Continue Anyway",
          style: "destructive",
          onPress: () => completeOnboarding(false),
        },
      ]
    );
  };

  const handleSkip = () => {
    handleContinueWithoutContacts();
  };

  return (
    <View className="flex-1 bg-white px-6 py-12">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          Connect with Friends
        </Text>
        <Text className="text-lg text-gray-600 text-center">
          FYI needs access to your contacts to help you share updates with
          friends
        </Text>
      </View>

      {/* User Info */}
      <View className="mb-8 bg-gray-50 rounded-lg p-4">
        <Text className="text-sm text-gray-500">Setting up profile for:</Text>
        <Text className="text-lg font-semibold text-gray-900">
          {userName || "Anonymous User"}
        </Text>
        <Text className="text-sm text-gray-500">{phoneNumber}</Text>
        {!userName && (
          <Text className="text-xs text-orange-600 mt-1">
            You can add your name later in settings
          </Text>
        )}
      </View>

      {/* Benefits */}
      <View className="mb-8">
        <Text className="text-base font-medium text-gray-700 mb-4">
          Why do we need contacts?
        </Text>
        <View className="space-y-3">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">📢</Text>
            <Text className="text-gray-600 flex-1">
              Send FYIs (quick updates) to your friends
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">👥</Text>
            <Text className="text-gray-600 flex-1">
              See which friends are already using FYI
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">�</Text>
            <Text className="text-gray-600 flex-1">
              Get notified when friends share updates
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🔒</Text>
            <Text className="text-gray-600 flex-1">
              Your contacts are stored securely and never shared
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-4 mt-auto">
        <Pressable
          onPress={handleSyncContacts}
          disabled={isLoading}
          className={`p-4 rounded-lg ${
            isLoading ? "bg-gray-300" : "bg-blue-500"
          }`}
        >
          <View className="flex-row items-center justify-center">
            {isLoading && (
              <ActivityIndicator size="small" color="white" className="mr-2" />
            )}
            <Text
              className={`text-lg font-semibold ${
                isLoading ? "text-gray-500" : "text-white"
              }`}
            >
              {isLoading ? "Setting Up..." : "Allow Contacts & Continue"}
            </Text>
          </View>
        </Pressable>

        <Pressable onPress={handleSkip} disabled={isLoading} className="p-4">
          <Text className="text-gray-500 text-center font-medium">
            Continue without contacts
          </Text>
        </Pressable>
      </View>

      {/* Privacy Note */}
      <View className="mt-4">
        <Text className="text-xs text-gray-500 text-center">
          Your contacts are encrypted and stored securely. We only use them to
          help you connect and share FYIs with friends.
        </Text>
      </View>
    </View>
  );
}