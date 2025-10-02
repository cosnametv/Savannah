import React, { useState, useEffect, useRef } from "react";
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
  ScrollView,
} from "react-native";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Config/firebaseConfig";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";

const Login = () => {
  const router = useRouter();
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("local");
  
  // Email/Password states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Local PIN states
  const [localPin, setLocalPin] = useState("");
  const [localSecureText, setLocalSecureText] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  
  const [error, setError] = useState("");
  const emailLoadingRef = useRef(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Firebase user is logged in - redirect to home
        setEmailLoading(false);
        emailLoadingRef.current = false;
        router.replace('/');
      } else {
        // Check for local auth if no Firebase user
        try {
          const localAuth = await AsyncStorage.getItem('localAuth');
          if (localAuth) {
            router.replace('/');
            return;
          }
        } catch (error) {
          console.log('Local auth check error:', error);
        }
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleEmailLogin = async () => {
    setError("");
    setLocalLoading(false); // Stop local loading if active
    
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    setEmailLoading(true);
    emailLoadingRef.current = true;
    try {
      console.log("Attempting Firebase login...");
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      console.log("Firebase login successful:", userCredential.user?.email);
      
      // Store the username (email) in AsyncStorage for drawer display
      await AsyncStorage.setItem('storedUsername', userCredential.user?.email || '');
      
      setEmail("");
      setPassword("");
      // The redirect will be handled by the auth state change listener
    } catch (err) {
      console.log("Firebase login error:", err);
      setError(err.message);
      setEmailLoading(false);
      emailLoadingRef.current = false;
    }
  };

  const handleLocalLogin = async () => {
    setError("");
    setEmailLoading(false); 
    
    if (!localPin.trim()) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    if (localPin.length !== 4) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setLocalLoading(true);
      try {
        const savedPin = await AsyncStorage.getItem('localPin');
      if (!savedPin) {
        setError("No PIN Available. Please use email login first and set up PIN in settings.");
        setLocalLoading(false);
        return;
      }

      if (localPin !== savedPin) {
        setError("Incorrect PIN");
        setLocalLoading(false);
        return;
      }
      
      try {
        await AsyncStorage.setItem('localAuth', 'true');
        setLocalPin("");
        
        setLocalLoading(false);
        
        // Redirect to home
        router.replace('/');
      } catch (storageError) {
        console.log("Storage error:", storageError);
        setError("Failed to save authentication state");
        setLocalLoading(false);
      }
    } catch (err) {
      console.log("Local login error:", err);
      setError("Failed to verify PIN");
      setLocalLoading(false);
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError("");
    setEmailLoading(false);
    setLocalLoading(false);
    emailLoadingRef.current = false;
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <AppHeader showMenu={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.center}>
            {/* Tab Navigation */}
            <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "local" && styles.activeTab]}
                onPress={() => handleTabSwitch("local")}
              >
                <Text style={[styles.tabText, activeTab === "local" && styles.activeTabText]}>
                  4-Digit PIN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "email" && styles.activeTab]}
                onPress={() => handleTabSwitch("email")}
              >
                <Text style={[styles.tabText, activeTab === "email" && styles.activeTabText]}>
                  Email & Password
                </Text>
              </TouchableOpacity>
            </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Local PIN Tab */}
            {activeTab === "local" && (
              <View style={styles.tabContent}>
                <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                  Enter your 4-digit PIN
                </Text>
                
                <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
                  <TextInput
                    style={[styles.textInput, isDark && styles.textInputDark]}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                    placeholder="4-digit PIN"
                    keyboardType="number-pad"
                    secureTextEntry={localSecureText}
                    value={localPin}
                    onChangeText={(text) => setLocalPin(text.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                  />
                  <TouchableOpacity onPress={() => setLocalSecureText(!localSecureText)}>
                    <Ionicons
                      name={localSecureText ? "eye-off" : "eye"}
                      size={22}
                      color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, localLoading && styles.buttonDisabled]}
                  onPress={handleLocalLogin}
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Login with PIN</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Email & Password Tab */}
            {activeTab === "email" && (
              <View style={styles.tabContent}>
                <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                  Enter your email and password
                </Text>

          <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

                <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <TextInput
                    style={[styles.textInput, isDark && styles.textInputDark]}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              placeholder="Password"
              secureTextEntry={secureText}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons
                name={secureText ? "eye-off" : "eye"}
                size={22}
                      color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
                  style={[styles.button, emailLoading && styles.buttonDisabled]}
                  onPress={handleEmailLogin}
                  disabled={emailLoading}
                >
                  {emailLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
                    <Text style={styles.buttonText}>Login with Email</Text>
            )}
          </TouchableOpacity>
        </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  containerDark: { backgroundColor: "#111827" },
  scrollContent: { flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  logo: { width: 100, height: 100, marginBottom: 20, borderRadius: 50 },
  
  // Title container and styling
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "400",
    textAlign: "center",
    color: "#6b7280",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  welcomeTextDark: {
    color: "#9ca3af",
  },
  companyName: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#1f8b2c",
    letterSpacing: 1,
    textShadowColor: "rgba(31, 139, 44, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  companyNameDark: {
    color: "#22c55e",
    textShadowColor: "rgba(34, 197, 94, 0.4)",
  },
  subtitle: { fontSize: 16, fontWeight: "500", textAlign: "center", marginBottom: 20, color: "#6b7280" },
  subtitleDark: { color: "#9ca3af" },
  
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    width: "100%",
    maxWidth: 360,
  },
  tabContainerDark: {
    backgroundColor: "#374151",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#1f8b2c",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#fff",
  },
  
  // Tab content
  tabContent: {
    width: "100%",
    maxWidth: 360,
  },
  
  // Input styles
  input: { 
    borderWidth: 1, 
    borderColor: "#d1d5db", 
    borderRadius: 10, 
    padding: 14, 
    marginBottom: 16, 
    backgroundColor: "#fff", 
    width: "100%", 
    color: "#000",
  },
  inputDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
    color: "#f9fafb",
  },
  inputContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
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
  
  // Button styles
  button: { 
    backgroundColor: "#1f8b2c", 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: "center", 
    marginTop: 10, 
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#ef4444", marginBottom: 10, textAlign: "center" },
});
