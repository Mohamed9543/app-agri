import { Alert } from "react-native";

export function confirmAsync(message, { confirmLabel = "OK", cancelLabel = "Annuler" } = {}) {
  return new Promise((resolve) => {
    Alert.alert("", message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
