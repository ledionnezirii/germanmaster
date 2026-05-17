import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: "#f8f5f0" }} />;
  }
  return user ? <MainNavigator /> : <AuthNavigator />;
}
