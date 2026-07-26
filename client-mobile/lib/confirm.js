import { Alert, Platform } from "react-native";

export function confirmAsync(message, { confirmLabel = "OK", cancelLabel = "Annuler" } = {}) {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert("", message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
