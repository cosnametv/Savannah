import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

const COUNTIES = ["Samburu", "Turkana", "Isiolo", "Marsabit", "Kajiado", "Narok"];

export default function Settings() {
  const { theme, toggleTheme } = useAppTheme();
  const [showSheet, setShowSheet] = useState(false);
  const [showCountySheet, setShowCountySheet] = useState(false);
  const [showSubcountySheet, setShowSubcountySheet] = useState(false);
  const [showLocalPasswordSheet, setShowLocalPasswordSheet] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedSubcounty, setSelectedSubcounty] = useState("");
  const [tempSubcounty, setTempSubcounty] = useState("");
  const [farmersPending, setFarmersPending] = useState(0);
  const [offtakePending, setOfftakePending] = useState(0);
  
  // Local PIN states
  const [hasLocalPin, setHasLocalPin] = useState(false);
  const [localPin, setLocalPin] = useState("");
  const [confirmLocalPin, setConfirmLocalPin] = useState("");
  const [showLocalPin, setShowLocalPin] = useState(false);

  // Load saved settings when Settings mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedCounty");
        if (saved) setSelectedCounty(saved);
        const savedSub = await AsyncStorage.getItem("selectedSubcounty");
        if (savedSub) {
          setSelectedSubcounty(savedSub);
          setTempSubcounty(savedSub);
        }
        
        // Check for existing local PIN
        const savedLocalPin = await AsyncStorage.getItem("localPin");
        setHasLocalPin(!!savedLocalPin);
      } catch (e) {
        console.log("Failed to load settings:", e);
      }
    };
    loadSettings();
  }, []);

  // Load sync status whenever the screen focuses
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadSyncStatus = async () => {
        try {
          const [farmersStr, offtakeStr] = await Promise.all([
            AsyncStorage.getItem("localSyncFarmers"),
            AsyncStorage.getItem("localSync"),
          ]);
          const farmersArr = farmersStr ? JSON.parse(farmersStr) : [];
          const offtakeArr = offtakeStr ? JSON.parse(offtakeStr) : [];
          if (!isActive) return;
          setFarmersPending(Array.isArray(farmersArr) ? farmersArr.length : 0);
          setOfftakePending(Array.isArray(offtakeArr) ? offtakeArr.length : 0);
        } catch (e) {
          if (!isActive) return;
          setFarmersPending(0);
          setOfftakePending(0);
        }
      };
      loadSyncStatus();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Save selected county
  const saveCounty = async (county) => {
    try {
      await AsyncStorage.setItem("selectedCounty", county);
      setSelectedCounty(county);
      setShowCountySheet(false);
    } catch (e) {
      console.log("Failed to save county:", e);
    }
  };

  const saveSubcounty = async () => {
    try {
      const clean = (tempSubcounty || "").trim();
      await AsyncStorage.setItem("selectedSubcounty", clean);
      setSelectedSubcounty(clean);
      setShowSubcountySheet(false);
    } catch (e) {
      console.log("Failed to save subcounty:", e);
    }
  };

  // Local PIN setup functions
  const saveLocalPin = async () => {
    if (localPin.length !== 4 || confirmLocalPin.length !== 4) {
      Alert.alert("⚠️ PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (localPin !== confirmLocalPin) {
      Alert.alert("⚠️ PIN", "PINs do not match.");
      return;
    }
    try {
      await AsyncStorage.setItem("localPin", localPin);
      const now = Date.now().toString();
      await AsyncStorage.setItem("lastActiveAt", now);
      setHasLocalPin(true);
      setShowLocalPasswordSheet(false);
      setLocalPin("");
      setConfirmLocalPin("");
      Alert.alert("✅ PIN Set", "Your 4-digit PIN has been saved.");
    } catch (e) {
      Alert.alert("❌ Error", "Failed to save PIN. Try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, theme === "dark" && styles.dark]}>
      <AppHeader />

      <View style={styles.list}>
        {/* Change Theme Option */}
        <TouchableOpacity style={styles.item} onPress={() => setShowSheet(true)}>
          <View style={styles.itemTextWrapper}>
            <Text
              style={[styles.itemTitle, theme === "dark" && styles.darkText]}
            >
              Change Theme
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                theme === "dark" && styles.darkSubtitle,
              ]}
            >
              This helps you to switch between Light and Dark mode
            </Text>
          </View>
        </TouchableOpacity>

        {/* Select County Option */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowCountySheet(true)}
        >
          <View style={styles.itemTextWrapper}>
            <Text
              style={[styles.itemTitle, theme === "dark" && styles.darkText]}
            >
              Select County
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                theme === "dark" && styles.darkSubtitle,
              ]}
            >
              {selectedCounty
                ? `Currently: ${selectedCounty}`
                : "Choose your county"}
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                theme === "dark" && styles.darkSubtitle,
              ]}
            >
              {selectedSubcounty ? `Subcounty: ${selectedSubcounty}` : "Subcounty: Not set"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Set Subcounty Option */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowSubcountySheet(true)}
        >
          <View style={styles.itemTextWrapper}>
            <Text
              style={[styles.itemTitle, theme === "dark" && styles.darkText]}
            >
              Set Subcounty
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                theme === "dark" && styles.darkSubtitle,
              ]}
            >
              {selectedSubcounty ? `Currently: ${selectedSubcounty}` : "Enter your subcounty"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Local PIN Setup Option */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowLocalPasswordSheet(true)}
        >
          <View style={styles.itemTextWrapper}>
            <Text
              style={[styles.itemTitle, theme === "dark" && styles.darkText]}
            >
              Set 4-Digit PIN
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                theme === "dark" && styles.darkSubtitle,
              ]}
            >
              {hasLocalPin ? "PIN is set" : "Set a 4-digit PIN for quick access"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Sync Status (read-only) */}
        <View style={styles.item}>
          <View style={styles.itemTextWrapper}>
            <Text
              style={[styles.itemTitle, theme === "dark" && styles.darkText]}
            >
              Sync Status
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                theme === "dark" && styles.darkSubtitle,
              ]}
            >
              Farmers: {farmersPending > 0 ? `Pending (${farmersPending})` : "Synced"}
            </Text>
            <Text
              style={[
                styles.itemSubtitle,
                theme === "dark" && styles.darkSubtitle,
              ]}
            >
              Offtake: {offtakePending > 0 ? `Pending (${offtakePending})` : "Synced"}
            </Text>
          </View>
        </View>
      </View>

      {/* Modal Bottom Sheet for Theme Switching */}
      <Modal
        visible={showSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSheet(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSheet(false)}
        >
          <Pressable style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Choose theme</Text>
            <Pressable
              style={styles.sheetButton}
              onPress={() => {
                toggleTheme("light");
                setShowSheet(false);
              }}
            >
              <Text style={styles.sheetButtonText}>🌞 Light Theme</Text>
            </Pressable>
            <Pressable
              style={styles.sheetButton}
              onPress={() => {
                toggleTheme("dark");
                setShowSheet(false);
              }}
            >
              <Text style={styles.sheetButtonText}>🌙 Dark Theme</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetButton, styles.sheetCancel]}
              onPress={() => setShowSheet(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Bottom Sheet for County Selection */}
      <Modal
        visible={showCountySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountySheet(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCountySheet(false)}
        >
          <Pressable style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Select County</Text>
            {COUNTIES.map((county) => (
              <Pressable
                key={county}
                style={styles.sheetButton}
                onPress={() => saveCounty(county)}
              >
                <Text style={styles.sheetButtonText}>{county}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.sheetButton, styles.sheetCancel]}
              onPress={() => setShowCountySheet(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Bottom Sheet for Subcounty Input */}
      <Modal
        visible={showSubcountySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubcountySheet(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSubcountySheet(false)}>
          <Pressable style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Enter Subcounty</Text>
            <View style={styles.subcountyInputWrapper}>
              <TextInput
                style={styles.subcountyInput}
                placeholder="Type subcounty name"
                placeholderTextColor="#9ca3af"
                value={tempSubcounty}
                onChangeText={setTempSubcounty}
              />
            </View>
            <Pressable style={[styles.sheetButton, styles.saveButton]} onPress={saveSubcounty}>
              <Text style={[styles.sheetButtonText, styles.saveButtonText]}>Save</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetButton, styles.sheetCancel]}
              onPress={() => setShowSubcountySheet(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Bottom Sheet for Local PIN Setup */}
      <Modal
        visible={showLocalPasswordSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocalPasswordSheet(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLocalPasswordSheet(false)}>
          <Pressable style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Set 4-Digit PIN</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter PIN"
                placeholderTextColor="#9ca3af"
                value={localPin}
                onChangeText={(text) => setLocalPin(text.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry={!showLocalPin}
                maxLength={4}
              />
              <TouchableOpacity onPress={() => setShowLocalPin(!showLocalPin)} style={styles.eyeButton}>
                <Ionicons
                  name={showLocalPin ? "eye-off" : "eye"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm PIN"
                placeholderTextColor="#9ca3af"
                value={confirmLocalPin}
                onChangeText={(text) => setConfirmLocalPin(text.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry={!showLocalPin}
                maxLength={4}
              />
            </View>
            <Pressable style={[styles.sheetButton, styles.saveButton]} onPress={saveLocalPin}>
              <Text style={[styles.sheetButtonText, styles.saveButtonText]}>Save PIN</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetButton, styles.sheetCancel]}
              onPress={() => setShowLocalPasswordSheet(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  dark: { backgroundColor: "#1a1a1a" },

  list: { marginTop: 16 },

  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  itemTextWrapper: { flexDirection: "column" },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  itemSubtitle: { fontSize: 13, color: "#666", marginTop: 4 },

  darkText: { color: "#fff" },
  darkSubtitle: { color: "#aaa" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetTitle: { fontWeight: "700", fontSize: 16, marginBottom: 8 },
  sheetButton: { paddingVertical: 12 },
  sheetButtonText: { fontSize: 16 },
  saveButton: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  sheetCancel: { marginTop: 4, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  sheetCancelText: { color: "#ef4444", fontWeight: "600" },
  
  // Input wrapper styles
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#000",
  },
  eyeButton: {
    padding: 8,
  },
});
