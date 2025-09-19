import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Config/firebaseConfig";
import { useRouter } from "expo-router";

const Login = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/"); 
      } else {
        setLoading(false); 
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      router.replace("/"); 
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setEmail("");
    setPassword("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%" }}
      >
        <View style={styles.center}>
          <Image source={require("../assets/icon.png")} style={styles.logo} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.title}>Welcome to Savannah Herds</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  logo: { width: 100, height: 100, marginBottom: 20, borderRadius: 50 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20, color: "#111827" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 14, marginBottom: 16, backgroundColor: "#fff", width: "100%", maxWidth: 360 },
  button: { backgroundColor: "#1f8b2c", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 10, width: "100%", maxWidth: 360 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "red", marginBottom: 10, textAlign: "center" },
  clickableText: { color: "#1f8b2c", fontWeight: "600", fontSize: 16, textDecorationLine: "underline", textAlign: "center", marginTop: 10 },
});
