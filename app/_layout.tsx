import { ThemeProvider } from "@/hooks/useTheme";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
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
