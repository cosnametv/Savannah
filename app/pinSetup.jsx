import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";

export default function PinSetup() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (saving) return;
    if (pin.length !== 4 || confirm.length !== 4) {
      Alert.alert("⚠️ PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== confirm) {
      Alert.alert("⚠️ PIN", "PINs do not match.");
      return;
    }
    setSaving(true);
    try {
      await AsyncStorage.setItem("localPin", pin);
      const now = Date.now().toString();
      await AsyncStorage.setItem("lastActiveAt", now);
      Alert.alert("✅ PIN Set", "Your PIN has been saved.");
      router.replace("/");
    } catch (e) {
      Alert.alert("❌ Error", "Failed to save PIN. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Set 4-digit PIN</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={pin}
          onChangeText={(t) => setPin(t.replace(/\D/g, "").slice(0, 4))}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="Enter PIN"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
        />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={confirm}
          onChangeText={(t) => setConfirm(t.replace(/\D/g, "").slice(0, 4))}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="Confirm PIN"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
        />
        <TouchableOpacity style={styles.button} onPress={onSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Saving..." : "Save PIN"}</Text>
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
    marginBottom: 12,
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
});


