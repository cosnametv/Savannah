import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  AppState,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function PinLock() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const isDark = theme === "dark";

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false); // 👈 loading state

  const onUnlock = async () => {
    try {
      setError("");
      if (pin.length !== 4) {
        setError("Enter 4 digits");
        return;
      }

      setLoading(true); // 👈 show spinner

      const saved = await AsyncStorage.getItem("localPin");

      if (!saved) {
        const { auth } = await import("../Config/firebaseConfig");
        if (!auth.currentUser) {
          setLoading(false);
          router.replace("/login");
          return;
        }
        setLoading(false);
        router.replace("/pinSetup");
        return;
      }

      if (pin !== saved) {
        setError("Incorrect PIN");
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem("lastActiveAt", Date.now().toString());
      setLoading(false); 
      router.replace("/"); 
    } catch (e) {
      setLoading(false);
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
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Enter PIN
        </Text>

        {/* PIN Input with eye icon */}
        <View
          style={[
            styles.inputContainer,
            isDark && styles.inputContainerDark,
          ]}
        >
          <TextInput
            style={[styles.textInput, isDark && styles.textInputDark]}
            value={pin}
            onChangeText={(t) => {
              setError("");
              setPin(t.replace(/\D/g, "").slice(0, 4));
            }}
            keyboardType="number-pad"
            secureTextEntry={secure}
            placeholder="4-digit PIN"
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? "eye-off" : "eye"}
              size={22}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={onUnlock}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Unlock</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  containerDark: { backgroundColor: "#111827" },
  content: { flex: 1, padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  titleDark: { color: "#f9fafb" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  inputContainerDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
  },
  textInput: {
    flex: 1,
    height: 50,
    color: "#000",
  },
  textInputDark: {
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
