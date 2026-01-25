module.exports = {
  expo: {
    name: "FinSmart",
    slug: "finsmart-mobile-new",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: "finsmart",
    icon: "./assets/icon.png",
    splash: {
      backgroundColor: "#10B981"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#10B981"
      },
      package: "com.gass1717.finsmart"
    },
    ios: {
      bundleIdentifier: "com.gass1717.finsmart"
    },
    web: {
      bundler: "metro"
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "e61ceb31-ac3f-40dc-a055-077cd36058ac"
      }
    }
  }
};
