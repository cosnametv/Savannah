import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";

const COUNTIES = ["Samburu", "Turkana", "Isiolo", "Marsabit", "Kajiado", "Narok"];

export default function Settings() {
  const { theme, toggleTheme } = useAppTheme();
  const [showSheet, setShowSheet] = useState(false);
  const [showCountySheet, setShowCountySheet] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState(null);

  // Load saved county when Settings mounts
  useEffect(() => {
    const loadCounty = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedCounty");
        if (saved) setSelectedCounty(saved);
      } catch (e) {
        console.log("Failed to load county:", e);
      }
    };
    loadCounty();
  }, []);

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
          </View>
        </TouchableOpacity>
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
  sheetCancel: { marginTop: 4, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  sheetCancelText: { color: "#ef4444", fontWeight: "600" },
});
