import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import { ref, push } from "firebase/database";
import { database } from "../Config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useAutoSync } from "../hooks/useAutoSyncOfftake";

const OfftakeForm = () => {
  useAutoSync();
  const { theme } = useAppTheme();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState(null);
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [weights, setWeights] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // ------------------ HELPERS ------------------
  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

const getPriceBasedOnWeight = (w) => {
  if (w >= 14 && w < 15) return 3300;
  if (w >= 15 && w < 16) return 3600;
  if (w >= 16 && w < 17) return 3800;
  if (w >= 17 && w < 18) return 4000;
  if (w >= 18 && w < 19) return 4300;
  if (w >= 19 && w < 20) return 4500;
  if (w >= 20 && w < 21) return 4700;
  if (w >= 21 && w < 22) return 5000;
  if (w >= 22 && w < 23) return 5200;
  if (w >= 23 && w < 24) return 5500;
  if (w >= 24 && w < 25) return 5700;
  if (w >= 25 && w < 26) return 5900;
  if (w >= 26 && w < 27) return 6200;
  if (w >= 27 && w < 28) return 6400;
  if (w >= 28 && w < 29) return 6700;
  if (w >= 29 && w < 30) return 6900;
  if (w >= 30 && w < 31) return 7100;
  if (w >= 31 && w < 32) return 7400;
  if (w >= 32 && w < 33) return 7600;
  if (w >= 33 && w < 34) return 7900;
  if (w >= 34 && w < 35) return 8100;
  if (w >= 35 && w < 36) return 8300;
  if (w >= 36 && w < 37) return 8600;
  if (w >= 37 && w < 38) return 8800;
  if (w >= 38 && w < 39) return 9000;
  if (w >= 39 && w < 40) return 9300;
  if (w >= 40 && w < 41) return 9500;
  
  return null; 
};

  const weightRefs = useRef([]);

  const addWeight = () => {
    const hasInvalid = weights.some((w) => {
      if (w.live === "") return false; 
      const liveNum = parseFloat(w.live);
      return isNaN(liveNum) || liveNum < 14 || liveNum > 40.9;
    });

    if (hasInvalid) {
      Alert.alert(
        "⚠️ Invalid Weight",
        "Live weight must be between 14.0 kg and 40.9 kg."
      );
      return;
    }

    setWeights((prev) => [...prev, { live: "", carcass: "", price: "" }]);
    setTimeout(() => {
      const lastIndex = weightRefs.current.length - 1;
      if (weightRefs.current[lastIndex]) {
        weightRefs.current[lastIndex].focus();
      }
    }, 100);
  };
  const updateWeight = (index, liveVal) => {
    // Allow clearing the field
    if (liveVal === "") {
      const cleared = [...weights];
      cleared[index] = { live: "", carcass: "", price: "" };
      setWeights(cleared);
      const totalCleared = cleared.reduce((sum, w) => sum + (w.price ? parseFloat(w.price) : 0), 0);
      setTotalPrice(totalCleared);
      return;
    }

    const live = parseFloat(liveVal);
    const updated = [...weights];

    if (!isNaN(live) && live >= 14 && live <= 40.9) {
      const carcass = (live * 0.42).toFixed(2);
      const priceNum = getPriceBasedOnWeight(live);
      const price = priceNum != null ? priceNum.toFixed(2) : "";
      updated[index] = { live: liveVal, carcass, price };
    } else {

      updated[index] = { live: liveVal, carcass: "", price: "" };
    }

    setWeights(updated);
    const total = updated.reduce((sum, w) => sum + (w.price ? parseFloat(w.price) : 0), 0);
    setTotalPrice(total);
  };

  // ------------------ SUBMIT ------------------

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    if (!name.trim() || 
    !idNumber.trim() || 
    !location.trim() ||
    !phone.trim()) {
      Alert.alert("⚠️ Missing Fields", "Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    if (gender !== "male" && gender !== "female") {
      Alert.alert("⚠️ Missing Gender", "Please select gender before continuing.");
      setSubmitting(false);
      return;
    }

    // Build list of valid goats only (ignore empty/invalid rows). Require at least one valid.
    const validGoats = weights.filter((w) => {
      const val = parseFloat(w.live);
      return !isNaN(val) && val >= 14 && val <= 40.9 && w.price;
    });

    if (validGoats.length === 0) {
      Alert.alert("⚠️ Missing Weights", "Please enter at least one valid goat weight (14.0–40.9 kg).");
      setSubmitting(false);
      return;
    }

    try {
      const county = await AsyncStorage.getItem("selectedCounty");
      if (!county) {
        Alert.alert("⚠️ Missing County", "Please select your county in Settings.");
        setSubmitting(false);
        return;
      }

      const subcounty = await AsyncStorage.getItem("selectedSubcounty");
      if (!subcounty) {
        Alert.alert("⚠️ Missing Subcounty", "Please select your subcounty in Settings.");
        setSubmitting(false);
        return;
      }

      // Generate unique user ID for offtake
      const prefix = county.slice(0, 3).toUpperCase();
      const counterKey = `offtakeCodeCounter_${prefix}`;
      const lastCounter = await AsyncStorage.getItem(counterKey);
      const nextCounter = lastCounter ? parseInt(lastCounter, 10) + 1 : 1;
      await AsyncStorage.setItem(counterKey, String(nextCounter));
      const offtakeUserId = `${prefix}${String(nextCounter).padStart(4, "0")}`;

      const recomputedTotal = validGoats.reduce((sum, w) => sum + (w.price ? parseFloat(w.price) : 0), 0);

      const offtakeData = {
        name,
        location,
        gender,
        idNumber,
        phone,
        date: formatDate(date),
        county,
        subcounty,
        goats: validGoats,
        totalGoats: validGoats.length,
        totalPrice: recomputedTotal,
        offtakeUserId, // Add the generated user ID
      };

      const state = await NetInfo.fetch();

      if (state.isConnected) {
        // Online: push only the current submission
        const offtakeRef = ref(database, "offtakes");
        await push(offtakeRef, offtakeData);

        // Save locally for offline viewing (optional)
        const existing = await AsyncStorage.getItem("offtakes");
        let offtakes = existing ? JSON.parse(existing) : [];
        offtakes.push(offtakeData);
        await AsyncStorage.setItem("offtakes", JSON.stringify(offtakes));

        Alert.alert("✅ Success", `Offtake recorded successfully!\nUser ID: ${offtakeUserId}`);
      } else {
        // Offline: save locally + pending
        const existing = await AsyncStorage.getItem("offtakes");
        let offtakes = existing ? JSON.parse(existing) : [];
        offtakes.push(offtakeData);
        await AsyncStorage.setItem("offtakes", JSON.stringify(offtakes));

        const pending = await AsyncStorage.getItem("localSync");
        let localSync = pending ? JSON.parse(pending) : [];
        localSync.push(offtakeData);
        await AsyncStorage.setItem("localSync", JSON.stringify(localSync));

        Alert.alert("⚠️ Offline", `Saved locally. Will sync when online.\nUser ID: ${offtakeUserId}`);
      }

      // Reset
      setName("");
      setGender(null);
      setIdNumber("");
      setPhone("");
      setDate(new Date());
      setWeights([]);
      setTotalPrice(0);

    } catch (error) {
      console.error("Error saving offtake:", error);
      Alert.alert("❌ Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------ RENDER ------------------
return (
  <SafeAreaView style={[styles.container, theme === "dark" && styles.containerDark]}>
    <AppHeader />

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={10}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.form}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text style={[styles.title, theme === "dark" && styles.titleDark]}>
            📝 Offtake Form
          </Text>
          {/* Location's Name */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Location
          </Text>
          <TextInput
            style={[styles.input, theme === "dark" && styles.inputDark]}
            placeholder="Enter Location"
            placeholderTextColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
            value={location}
            onChangeText={setLocation}
          />
          {/* Farmer's Name */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Full Name
          </Text>
          <TextInput
            style={[styles.input, theme === "dark" && styles.inputDark]}
            placeholder="Enter full name"
            placeholderTextColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
            value={name}
            onChangeText={(text) => {
              // Replace multiple spaces with a single space
              const cleanText = text.replace(/\s+/g, " ");
              setName(cleanText);
            }}
          />

          {/* Gender */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Gender
          </Text>
          <View style={[styles.pickerWrapper, theme === "dark" && styles.pickerWrapperDark]}>
            <Picker
              selectedValue={gender}
              onValueChange={(val) => setGender(val)}
              style={{ color: theme === "dark" ? "#fff" : "#000" }}
              dropdownIconColor={theme === "dark" ? "#fff" : "#000"}
            >
              <Picker.Item label="Select Gender" value={null} enabled={false}/> 
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>
          </View>

          {/* ID Number */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            ID Number
          </Text>
          <TextInput
            style={[styles.input, theme === "dark" && styles.inputDark]}
            placeholder="Enter ID number"
            placeholderTextColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
            value={idNumber}
            onChangeText={setIdNumber} 
            autoCapitalize="characters" 
            keyboardType="default" 
          />

          {/* Phone Number */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Phone Number
          </Text>
          <TextInput
            style={[styles.input, theme === "dark" && styles.inputDark]}
            placeholder="Enter phone number"
            placeholderTextColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
            maxLength={10}
            value={phone}
            autoCapitalize="characters"
            onChangeText={setPhone}
            keyboardType="default" 
          />


          {/* Date */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Date
          </Text>
          <TouchableOpacity
            style={[styles.input, theme === "dark" && styles.inputDark]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme === "dark" ? "#f9fafb" : "#111827" }}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Weights */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Goat Weights
          </Text>
          {weights.map((w, idx) => (
            <View key={idx} style={styles.weightRow}>
              <TextInput
                ref={(el) => (weightRefs.current[idx] = el)}
                style={[styles.input, theme === "dark" && styles.inputDark, { flex: 1 }]}
                placeholder="Live Weight (kg)"
                placeholderTextColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
                keyboardType="numeric"
                value={w.live}
                onChangeText={(val) => updateWeight(idx, val)}
              />
              <TextInput
                style={[styles.input, theme === "dark" && styles.inputDark, { flex: 1 }]}
                placeholder="Carcass (kg)"
                placeholderTextColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
                value={w.carcass}
                editable={false}
              />
              <TextInput
                style={[styles.input, theme === "dark" && styles.inputDark, { flex: 1 }]}
                placeholder="Price (KES)"
                placeholderTextColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
                value={w.price}
                editable={false}
              />
            </View>
          ))}


          <TouchableOpacity style={styles.addBtn} onPress={addWeight}>
            <Text style={styles.addBtnText}>+ Add Goat</Text>
          </TouchableOpacity>

          {/* Totals */}
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Total Goats: {weights.filter((w) => w.price).length}
          </Text>
          <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
            Total Price: KES {totalPrice}
          </Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { backgroundColor: "#6b7280" }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>

          {/* Spacer for bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

};

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  containerDark: { backgroundColor: "#111827" },

  form: { flex: 1, padding: 16 },

  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#111827" },
  titleDark: { color: "#f9fafb" },

  label: { fontSize: 14, fontWeight: "500", marginBottom: 4, color: "#374151" },
  labelDark: { color: "#d1d5db" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#000",
  },
  inputDark: {
    backgroundColor: "#1f2937", 
    borderColor: "#374151",
    color: "#f9fafb",
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  pickerWrapperDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
  },

  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },

  addBtn: {
    backgroundColor: "#1f8b2c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addBtnText: { color: "#fff", fontWeight: "600" },

  submitButton: {
    backgroundColor: "#1f8b2c",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 18 },

  scene: { flex: 1, padding: 10, paddingBottom: 40 },
});


export default OfftakeForm;
