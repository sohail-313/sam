import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AuthService from "@/services/authService";

export default function PhoneInputScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "");

    // Add country code if not present
    if (digits.length > 0 && !digits.startsWith("91")) {
      return `+91${digits}`;
    } else if (digits.length > 0) {
      return `+${digits}`;
    }
    return input;
  };

  const handleSendOTP = async () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (formattedPhone.length < 13) {
      // +91 + 10 digits
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.sendOTP(formattedPhone);

      if (result.success) {
        // Navigate to OTP verification screen
        router.push({
          pathname: "/auth/otp-verification",
          params: { phoneNumber: formattedPhone },
        } as any);
      } else {
        Alert.alert("Error", result.error || "Please try again later");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 py-12">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Enter your phone number
        </Text>
        <Text className="text-gray-600">
          We'll send you a verification code to confirm your number
        </Text>
      </View>

      {/* Phone Input */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </Text>
        <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-4">
          <Text className="text-lg text-gray-700 mr-2">🇮🇳 +91</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            keyboardType="numeric"
            className="flex-1 text-lg"
            maxLength={10}
            autoFocus
          />
        </View>
      </View>

      {/* Send OTP Button */}
      <TouchableOpacity
        onPress={handleSendOTP}
        disabled={isLoading || phoneNumber.length !== 10}
        className={`py-4 rounded-lg ${
          isLoading || phoneNumber.length !== 10 ? "bg-gray-300" : "bg-blue-500"
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-semibold text-center">
            Send OTP
          </Text>
        )}
      </TouchableOpacity>

      {/* Terms */}
      <Text className="text-sm text-gray-500 text-center mt-8">
        By continuing, you agree to receive SMS messages from FYI App
      </Text>
    </View>
  );
}
