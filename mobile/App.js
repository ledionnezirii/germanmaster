import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import { useAppFonts } from "./src/styles/fonts";

export default function App() {
  const [fontsLoaded] = useAppFonts();

  // Hold the splash until Nunito is ready — usually < 200 ms after first download
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#f8f5f0" }} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="light" backgroundColor="#0f172a" />
            <AppNavigator />
          </NavigationContainer>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
