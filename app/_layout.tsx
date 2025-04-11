import { Stack } from "expo-router";

import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaView className="flex-1">
      <GluestackUIProvider mode="light">
        <Stack screenOptions={{ headerShown: false }}  />
      </GluestackUIProvider>
    </SafeAreaView>
  );
}
