import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, AppState } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";

export default function PinLock() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const onUnlock = async () => {
    try {
      const saved = await AsyncStorage.getItem("localPin");
      if (!saved) {
        router.replace("/pinSetup");
        return;
      }
      if (pin.length !== 4) {
        setError("Enter 4 digits");
        return;
      }
      if (pin !== saved) {
        setError("Incorrect PIN");
        return;
      }
      await AsyncStorage.setItem("lastActiveAt", Date.now().toString());
      router.replace("/index");
    } catch (e) {
      Alert.alert("❌ Error", "Failed to verify PIN");
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        await AsyncStorage.setItem("lastActiveAt", Date.now().toString());
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Enter PIN</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={pin}
          onChangeText={(t) => {
            setError("");
            setPin(t.replace(/\D/g, "").slice(0, 4));
          }}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="4-digit PIN"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={onUnlock}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  containerDark: { backgroundColor: "#111827" },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16, color: "#111827" },
  titleDark: { color: "#f9fafb" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    color: "#000",
  },
  inputDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
    color: "#f9fafb",
  },
  button: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#ef4444", marginBottom: 8 },
});


