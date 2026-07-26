import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import GoogleButton from "../../components/GoogleButton";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import PasswordInput from "../../components/PasswordInput";

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const router = useRouter();

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      await loginWithToken(data.token, data.user);
      router.replace("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(idToken) {
    setError("");
    try {
      const { data } = await api.post("/auth/google", { idToken });
      await loginWithToken(data.token, data.user);
      router.replace("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-4" keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
          <View className="mb-4 flex-row justify-end">
            <LanguageSwitcher />
          </View>
          <Text className="mb-1 text-center text-2xl font-bold text-brand-800">
            🌱 {t("app.name")}
          </Text>
          <Text className="mb-6 text-center text-sm text-slate-500">{t("auth.registerTitle")}</Text>

          <View className="space-y-3">
            <TextInput
              placeholder={t("auth.fullName")}
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-base"
            />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t("auth.email")}
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-base"
            />
            <PasswordInput
              placeholder={t("auth.passwordMin")}
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
            />
            {!!error && <Text className="text-sm text-red-600">{error}</Text>}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !name || !email || password.length < 6}
              className="w-full rounded-md bg-brand-700 px-3 py-2.5 disabled:opacity-60"
            >
              <Text className="text-center font-medium text-white">
                {loading ? t("auth.registering") : t("auth.registerButton")}
              </Text>
            </Pressable>
          </View>

          <View className="my-4 flex-row items-center gap-2">
            <View className="h-px flex-1 bg-slate-200" />
            <Text className="text-xs text-slate-400">{t("auth.or")}</Text>
            <View className="h-px flex-1 bg-slate-200" />
          </View>

          <GoogleButton onCredential={handleGoogle} />

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-slate-500">{t("auth.hasAccount")} </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-sm font-medium text-brand-700">{t("auth.loginButton")}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
