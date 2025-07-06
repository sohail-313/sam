import { Stack } from "expo-router";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { loadFonts } from "@/utils/fonts";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/auth/AuthProvider";
import { FYIProvider } from "@/contexts/FYIProvider";

export default function RootLayout() {
  useEffect(() => {
    const loadApp = async () => {
      await loadFonts();
    };
    loadApp();
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <GluestackUIProvider mode="light">
        <AuthProvider>
          <FYIProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </FYIProvider>
        </AuthProvider>
      </GluestackUIProvider>
    </SafeAreaView>
  );
}
