import { Platform, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

interface SquareAdProps {
  style?: any;
}

export const SquareAd = ({ style }: SquareAdProps) => {
  // Use your real AdMob ID - no test IDs in production
  const adUnitId =
    Platform.select({
      android: "ca-app-pub-5795546778743097/2416989044",
      ios: "ca-app-pub-5795546778743097/2416989044",
    }) || "";

  if (!adUnitId) return null;

  return (
    <View
      style={[
        {
          width: "100%",
          minHeight: 250,
          backgroundColor: "#0a1333",
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        onAdLoaded={() => console.log("✅ Square Ad loaded")}
        onAdFailedToLoad={(error) => console.log("❌ Square Ad failed:", error)}
      />
    </View>
  );
};
