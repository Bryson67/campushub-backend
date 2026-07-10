import { Platform, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

interface AdBannerProps {
  style?: any;
}

export const AdBanner = ({ style }: AdBannerProps) => {
  // Use your real AdMob ID - no test IDs in production
  const adUnitId =
    Platform.select({
      android: "ca-app-pub-5795546778743097/9801013832",
      ios: "ca-app-pub-5795546778743097/9801013832",
    }) || "";

  if (!adUnitId) return null;

  return (
    <View
      style={[
        {
          width: "100%",
          height: 60,
          backgroundColor: "#0a1333",
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        onAdLoaded={() => console.log("✅ Ad loaded")}
        onAdFailedToLoad={(error) => console.log("❌ Ad failed:", error)}
      />
    </View>
  );
};
