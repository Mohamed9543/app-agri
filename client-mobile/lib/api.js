import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "token";

// expo-secure-store backs onto Android Keystore / iOS Keychain, so the JWT
// isn't left as plaintext in app-sandbox storage on native. SecureStore has
// no web implementation, so web keeps using AsyncStorage (-> localStorage),
// matching how the previous web-only client stored its token.
const tokenStore =
  Platform.OS === "web"
    ? AsyncStorage
    : { getItem: SecureStore.getItemAsync, setItem: SecureStore.setItemAsync, removeItem: SecureStore.deleteItemAsync };

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api",
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStore.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || "Erreur réseau, réessayez.";
    return Promise.reject(new Error(message));
  }
);

export async function storeToken(token) {
  await tokenStore.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await tokenStore.removeItem(TOKEN_KEY);
}

export async function getToken() {
  return tokenStore.getItem(TOKEN_KEY);
}
