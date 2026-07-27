import { useEffect, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const discovery = { authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth" };

export default function GoogleButton({ onCredential }) {
  const { t } = useTranslation();

  // useAuthRequest tears down and rebuilds its request/listeners whenever
  // this config object's identity changes. It was previously inlined with a
  // fresh `nonce: Math.random()...` on every render, so it churned on every
  // keystroke elsewhere in the form (any re-render) and could crash the page.
  // useMemo keeps it stable for the component's lifetime.
  const authRequestConfig = useMemo(
    () => ({
      clientId: CLIENT_ID,
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
      redirectUri: AuthSession.makeRedirectUri(),
      usePKCE: false,
      extraParams: { nonce: Math.random().toString(36).slice(2) },
    }),
    []
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(authRequestConfig, discovery);

  useEffect(() => {
    if (response?.type === "success" && response.params?.id_token) {
      onCredential(response.params.id_token);
    }
  }, [response]);

  if (!CLIENT_ID) {
    return (
      <View className="rounded-md bg-amber-50 px-3 py-2">
        <Text className="text-xs text-amber-700">{t("auth.googleNotConfigured")}</Text>
      </View>
    );
  }

  return (
    <Pressable
      disabled={!request}
      onPress={() => promptAsync()}
      className="flex-row items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 disabled:opacity-60"
    >
      <Text className="font-medium text-slate-700">{t("auth.googleContinue")}</Text>
    </Pressable>
  );
}
