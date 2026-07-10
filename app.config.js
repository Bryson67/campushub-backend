export default {
    expo: {
        name: "campushub",
        slug: "campushub",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/logo.png",
        scheme: "campushub",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.campushub.app",
        },
        android: {
            package: "com.campushub.app",
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png",
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png",
        },
        plugins: [
            "expo-router", [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                },
            ],
            "expo-font", [
                "expo-image-picker",
                {
                    photosPermission: "The app accesses your photos to let you share them with your friends.",
                },
            ],
            // ✅ ADDED: AdMob plugin configuration
            [
                "react-native-google-mobile-ads",
                {
                    androidAppId: "ca-app-pub-5795546778743097~6732466553",
                    // Uncomment if you need iOS
                    // iosAppId: "ca-app-pub-5795546778743097~6732466553"
                },
            ],
            [
                "expo-build-properties",
                {
                    android: {
                        enableProguardInReleaseBuilds: true,
                    },
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
        extra: {
            eas: {
                projectId: "10e2bcec-d20c-4933-8c95-fa06dd1d4300",
            },
        },
    },
};