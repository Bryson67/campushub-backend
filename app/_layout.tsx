import { ThemeProvider } from "@/hooks/useTheme";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { useEffect } from "react";
import mobileAds from "react-native-google-mobile-ads";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize AdMob
    const initializeAds = async () => {
      try {
        await mobileAds().initialize();
        console.log("✅ AdMob initialized");
      } catch (error) {
        console.log("⚠️ AdMob initialization failed:", error);
      }
    };

    initializeAds();
  }, []);

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        {/*hiding the header for the root stack */}
        <Stack
          screenOptions={{ headerShown: false, animation: "slide_from_right" }}
        />
      </ThemeProvider>
    </ConvexProvider>
  );
}
