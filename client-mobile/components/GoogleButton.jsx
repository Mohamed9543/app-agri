import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { useTranslation } from "react-i18next";

// This is the "Web application" OAuth client — the same one the backend
// verifies id_token audiences against. GoogleSignin needs it as webClientId
// (not an Android client id) to receive an id_token with that audience; the
// Android OAuth client (package name + SHA-1) registered in Google Cloud
// Console is only used by Play Services to authorize this signed app, it's
// never referenced directly in code.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

if (WEB_CLIENT_ID) {
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: false });
}

export default function GoogleButton({ onCredential }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        onCredential(response.data.idToken);
      }
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.warn("Google sign-in error", err);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!WEB_CLIENT_ID) {
    return (
      <View className="rounded-md bg-amber-50 px-3 py-2">
        <Text className="text-xs text-amber-700">{t("auth.googleNotConfigured")}</Text>
      </View>
    );
  }

  return (
    <Pressable
      disabled={busy}
      onPress={handlePress}
      className="flex-row items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 disabled:opacity-60"
    >
      <Text className="font-medium text-slate-700">{t("auth.googleContinue")}</Text>
    </Pressable>
  );
}
