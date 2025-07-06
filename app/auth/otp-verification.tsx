import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import AuthService from "@/services/authService";


export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams();
  const { refreshUser } = useAuth();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const success = await AuthService.verifyOTP(
        phoneNumber as string,
        otpCode
      );

      if (success) {
        // Refresh the auth context
        await refreshUser();
        // Navigate to main app
        router.replace("/(tabs)" as any);
      } else {
        Alert.alert("Verification Failed", "Invalid OTP. Please try again.");
        // Clear OTP inputs
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Alert.alert("Verification Failed", "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const success = await AuthService.resendOTP(phoneNumber as string);
      if (success) {
        setCountdown(60);
        Alert.alert("OTP Sent", "A new OTP has been sent to your phone number");
      } else {
        Alert.alert("Error", "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-white px-6 py-12">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Verifying your number
        </Text>
        <Text className="text-gray-600">
          We sent you a 6-digit code to {phoneNumber}. Enter it below.
        </Text>
        <Text className="text-sm text-gray-500 mt-2">
          This won't happen again unless you delete and reinstall FYI.
        </Text>
      </View>

      {/* OTP Input */}
      <View className="flex-row justify-between mb-6">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            keyboardType="numeric"
            maxLength={1}
            className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-xl font-semibold focus:border-blue-500"
            autoFocus={index === 0}
          />
        ))}
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        onPress={handleVerifyOTP}
        disabled={isLoading || otp.join("").length !== 6}
        className={`py-4 rounded-lg mb-4 ${
          isLoading || otp.join("").length !== 6 ? "bg-gray-300" : "bg-blue-500"
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-semibold text-center">
            Verify OTP
          </Text>
        )}
      </TouchableOpacity>

      {/* Resend OTP */}
      <View className="items-center">
        {countdown > 0 ? (
          <Text className="text-gray-500">
            Resend OTP in {countdown} seconds
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOTP}>
            <Text className="text-blue-500 font-semibold">Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Back to phone input */}
      <TouchableOpacity onPress={() => router.back()} className="mt-8">
        <Text className="text-blue-500 text-center">Change phone number</Text>
      </TouchableOpacity>
    </View>
  );
}