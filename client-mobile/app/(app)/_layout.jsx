import { Redirect, Stack } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";

export default function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <View className="flex-1 bg-slate-50">
      <Header />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
