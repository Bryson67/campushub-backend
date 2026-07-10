import { AdBanner } from "@/components/AdBanner";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#00ffff",
          tabBarInactiveTintColor: "#888888",
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.OS === "ios" ? "transparent" : "#0a1333",
            borderTopWidth: 0,
            elevation: 0,
            height: 150,
            paddingBottom: 10,
            paddingTop: 5,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: "#00ffff",
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                }
              : {}),
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={50}
                tint="dark"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 25,
                  borderTopRightRadius: 25,
                }}
              />
            ) : null,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: -3,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="gamertag"
          options={{
            title: "PROFILE",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tournaments"
          options={{
            title: "TOURNAMENTS",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "trophy" : "trophy-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="lobby"
          options={{
            title: "LOBBY",
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  backgroundColor: focused ? "#00ffff" : "#0a1333",
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: -30,
                  borderWidth: 2,
                  borderColor: focused ? "#fff" : "#00ffff",
                  shadowColor: "#00ffff",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Ionicons
                  name="game-controller"
                  size={30}
                  color={focused ? "#0a1333" : "#00ffff"}
                />
              </View>
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tabs.Screen
          name="withdraw"
          options={{
            title: "WITHDRAW",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "cash" : "cash-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="winners"
          options={{
            title: "WINNERS",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "ribbon" : "ribbon-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* Ad Banner at the bottom */}
      <AdBanner style={styles.adBanner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050b1f",
  },
  adBanner: {
    backgroundColor: "#0a1333",
    borderTopWidth: 2,
    borderTopColor: "#00ffff",
    height: 60,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
});
