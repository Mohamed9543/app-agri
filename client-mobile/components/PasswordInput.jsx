import { useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";

export default function PasswordInput({ className = "", ...props }) {
  const [show, setShow] = useState(false);

  return (
    <View className="relative justify-center">
      <TextInput
        {...props}
        secureTextEntry={!show}
        className={
          "w-full rounded-md border border-slate-300 px-3 py-2.5 pe-12 text-base " + className
        }
        placeholderTextColor="#94a3b8"
      />
      <Pressable
        onPress={() => setShow((s) => !s)}
        hitSlop={8}
        className="absolute end-0 h-full items-center justify-center px-3"
      >
        <Text className="text-slate-400">{show ? "🙈" : "👁"}</Text>
      </Pressable>
    </View>
  );
}
