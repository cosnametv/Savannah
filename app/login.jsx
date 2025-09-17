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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../Config/firebaseConfig";
import { useRouter } from "expo-router";

const Login = () => {
  const router = useRouter();
  const [step, setStep] = useState("loading");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [pin, setPin] = useState("");
  const [enteredPin, setEnteredPin] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem("isLoggedIn");
        const storedPin = await AsyncStorage.getItem("userPIN");

        if (loggedIn === "true") {
          setStep("pinLogin");
        } else {
          setStep("login");
        }
      } catch {
        setStep("login");
      }
    };
    checkLogin();
  }, []);

  // Step 1: Email/Password login
  const handleLogin = async () => {
    setError(""); setSuccess("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      await AsyncStorage.setItem("isLoggedIn", "true");

      const storedPin = await AsyncStorage.getItem("userPIN");
      if (storedPin) {
        setStep("pinLogin");
      } else {
        setStep("createPin");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Create PIN (if none exists)
  const handleCreatePin = async () => {
    setError(""); setSuccess("");
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem("userPIN", pin);
      setPin("");
      setStep("pinLogin");
      setSuccess("PIN created! Please login with it.");
    } catch (err) {
      setError("Failed to save PIN");
    } finally {
      setLoading(false);
    }
  };

  // Step 2b: PIN login
  const handlePinLogin = async () => {
    setError(""); setSuccess("");
    if (!/^\d{4}$/.test(enteredPin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setLoading(true);
    try {
      const storedPin = await AsyncStorage.getItem("userPIN");
      if (enteredPin === storedPin) {
        router.replace("/");
        await AsyncStorage.setItem("isLoggedIn", "true");
        setEnteredPin("");
        
      } else {
        setError("Invalid PIN");
        setEnteredPin("");
      }
    } catch (err) {
      setError("Error verifying PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem("isLoggedIn");
    await AsyncStorage.removeItem("userPIN");
    setStep("login");
    setEmail(""); setPassword(""); setEnteredPin(""); setError(""); setSuccess("");
  };

  if (step === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1f8b2c" />
        <Text style={styles.title}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%" }}
      >
        <View style={styles.center}>
          <Image source={require("../assets/icon.png")} style={styles.logo} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          {/* Step 1: Email/Password */}
          {step === "login" && (
            <>
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
            </>
          )}

          {/* Step 2: PIN login / Create PIN */}
          {step === "pinLogin" && (
            <>
              <Text style={styles.title}>Enter PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="****"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={enteredPin}
                onChangeText={setEnteredPin}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handlePinLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.clickableText}>Use Different Account</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "createPin" && (
            <>
              <Text style={styles.title}>Create a 4-Digit PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter PIN"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={pin}
                onChangeText={setPin}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleCreatePin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save PIN</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.clickableText}>Use Different Account</Text>
              </TouchableOpacity>
            </>
          )}

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
  success: { color: "green", marginBottom: 10, textAlign: "center" },
  clickableText: { color: "#1f8b2c", fontWeight: "600", fontSize: 16, textDecorationLine: "underline", textAlign: "center", marginTop: 10 },
});
