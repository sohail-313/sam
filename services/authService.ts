import * as SecureStore from "expo-secure-store";
import { OTPWidget } from "@msg91comm/sendotp-react-native";

// Simple user interface
interface User {
  phoneNumber: string;
  verifiedAt: Date;
}

class AuthService {
  private static USER_KEY = "fyi-user";
  private static isInitialized = false;

  // Initialize MSG91 - one time setup
  static async initialize() {
    if (!this.isInitialized) {
      const widgetId =
        process.env.EXPO_PUBLIC_MSG91_WIDGET_ID || "35666e6e4270373034343731";
      const tokenAuth =
        process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH ||
        "429356THQF8L4yKC684d8beeP1";

      try {
        await OTPWidget.initializeWidget(widgetId, tokenAuth);
        this.isInitialized = true;
        console.log("MSG91 initialized");
      } catch (error) {
        console.error("MSG91 init error:", error);
      }
    }
  }

  // Send OTP via MSG91
  static async sendOTP(
    phoneNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();

      const cleanPhone = phoneNumber.replace("+", "");
      const response = await OTPWidget.sendOTP({ identifier: cleanPhone });

      console.log("SMS sent:", response);

      if (response.type === "success" && response.message) {
        // Store the message (which contains the reqId) for verification
        await SecureStore.setItemAsync(`reqId-${cleanPhone}`, response.message);
        return { success: true };
      }

      // Handle specific error cases
      if (response.type === "error") {
        const errorCode = response.code;
        const errorMessage = response.message;

        console.error("MSG91 Error:", errorCode, errorMessage);

        switch (errorCode) {
          case "408":
            if (errorMessage === "IPBlocked") {
              return {
                success: false,
                error:
                  "Too many requests. Please wait a few minutes before trying again.",
              };
            }
            break;
          case "401":
            return {
              success: false,
              error: "Authentication failed. Please check your configuration.",
            };
          case "404":
            return {
              success: false,
              error: "Service not found. Please contact support.",
            };
          case "429":
            return {
              success: false,
              error:
                "Too many requests. Please wait a few minutes before trying again.",
            };
          default:
            return {
              success: false,
              error: `Unable to send OTP: ${errorMessage || "Unknown error"}`,
            };
        }
      }

      return { success: false, error: "Unable to send OTP. Please try again." };
    } catch (error) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  // Verify OTP and save user
  static async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      await this.initialize();

      const cleanPhone = phoneNumber.replace("+", "");

      // Get reqId from SecureStore
      const reqId = await SecureStore.getItemAsync(`reqId-${cleanPhone}`);
      console.log("reqId:", reqId, otp);

      if (!reqId) {
        console.error("reqId is required but not found");
        return false;
      }
      const response = await OTPWidget.verifyOTP({
        reqId: reqId,
        otp: otp,
      });

      console.log("OTP verified:", response);

      if (response.type === "success") {
        // Save user as verified
        const user: User = {
          phoneNumber,
          verifiedAt: new Date(),
        };

        await SecureStore.setItemAsync(this.USER_KEY, JSON.stringify(user));

        // Clean up the stored reqId
        await SecureStore.deleteItemAsync(`reqId-${cleanPhone}`);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Verify OTP error:", error);
      return false;
    }
  }

  // Check if user is logged in
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }

  // Check if authenticated
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.USER_KEY);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  // Resend OTP
  static async resendOTP(phoneNumber: string): Promise<boolean> {
    try {
      await this.initialize();

      const cleanPhone = phoneNumber.replace("+", "");

      // Try to get existing reqId first to clean it up
      const existingReqId = await SecureStore.getItemAsync(
        `reqId-${cleanPhone}`
      );

      // For MSG91, we use sendOTP with retryType parameter for resending
      // If no reqId exists, this will be treated as a new OTP request
      console.log("Resending OTP for phone:", cleanPhone);

      const requestParams: any = {
        identifier: cleanPhone,
      };

      // Add retryType if we have an existing reqId
      if (existingReqId) {
        console.log(
          "Adding retryType for resend with existing reqId:",
          existingReqId
        );
        requestParams.retryType = "voice"; // Try voice as backup channel
      }

      const response = await OTPWidget.sendOTP(requestParams);

      console.log("OTP resent:", response);

      if (response.type === "success" && response.message) {
        // Store the new message (reqId) for verification
        await SecureStore.setItemAsync(`reqId-${cleanPhone}`, response.message);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Resend OTP error:", error);

      // If retryType approach fails, try a simple new OTP request
      try {
        console.log("Retry approach failed, sending new OTP");
        const cleanPhone = phoneNumber.replace("+", "");
        const response = await OTPWidget.sendOTP({ identifier: cleanPhone });

        if (response.type === "success" && response.message) {
          await SecureStore.setItemAsync(
            `reqId-${cleanPhone}`,
            response.message
          );
          return true;
        }
      } catch (fallbackError) {
        console.error("Fallback OTP send also failed:", fallbackError);
      }

      return false;
    }
  }
}

export default AuthService;
