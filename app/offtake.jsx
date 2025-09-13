import React, { useState, useEffect } from "react";
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
  const [gender, setGender] = useState("male");
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
    if (w >= 14 && w <= 14.99) return 3500;
    if (w >= 15 && w <= 15.99) return 3700;
    if (w >= 16 && w <= 16.99) return 4000;
    if (w >= 17 && w <= 17.99) return 4300;
    if (w >= 18 && w <= 18.99) return 4500;
    if (w >= 19 && w <= 19.99) return 4800;
    if (w >= 20 && w <= 20.99) return 5000;
    if (w >= 21 && w <= 21.99) return 5300;
    if (w >= 22 && w <= 22.99) return 5500;
    if (w >= 23 && w <= 24.99) return 5800;
    if (w >= 25 && w <= 25.99) return 6000;
    if (w >= 26 && w <= 26.99) return 6300;
    if (w >= 27 && w <= 27.99) return 6500;
    if (w >= 28 && w <= 29.99) return 7000;
    return 7000;
  };

  const addWeight = () => setWeights([...weights, { live: "", carcass: "", price: "" }]);

  const updateWeight = (index, liveVal) => {
    let updated = [...weights];
    let live = parseFloat(liveVal);
    if (!isNaN(live) && live >= 14 && live <= 40) {
      let carcass = (live * 0.42).toFixed(2);
      let price = getPriceBasedOnWeight(live).toFixed(2);
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

    if (!name.trim() || !idNumber.trim() || !phone.trim()) {
      Alert.alert("⚠️ Missing Fields", "Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    if (phone.length !== 10 && phone.length !== 11) {
      Alert.alert("⚠️ Invalid Phone", "Phone number must be 10 or 11 digits.");
      setSubmitting(false);
      return;
    }

    if (weights.length === 0 || weights.every((w) => !w.live || !w.price)) {
      Alert.alert("⚠️ Missing Weights", "Please enter at least one valid goat weight.");
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

      const offtakeData = {
        name,
        gender,
        idNumber,
        phone,
        date: formatDate(date),
        county,
        goats: weights,
        totalGoats: weights.filter((w) => w.price).length,
        totalPrice,
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

        Alert.alert("✅ Success", "Offtake recorded successfully!");
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

        Alert.alert("⚠️ Offline", "Saved locally. Will sync when online.");
      }

      // Reset
      setName("");
      setGender("male");
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
          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, theme === "dark" && styles.titleDark]}>
              📝 Offtake Form
            </Text>

            <Text style={styles.label}>Farmer's Name</Text>
            <TextInput style={styles.input} placeholder="Enter full name" value={name} onChangeText={setName} />

            <Text style={styles.label}>Gender</Text>
            <Picker selectedValue={gender} onValueChange={(val) => setGender(val)} style={styles.picker}>
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>

            <Text style={styles.label}>ID Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ID number"
              keyboardType="numeric"
              value={idNumber}
              onChangeText={(text) => setIdNumber(text.replace(/[^0-9]/g, ""))}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              keyboardType="numeric"
              maxLength={11}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
            />

            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text>{formatDate(date)}</Text>
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

            <Text style={styles.label}>Goat Weights</Text>
            {weights.map((w, idx) => (
              <View key={idx} style={styles.weightRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Live Weight (kg)"
                  keyboardType="numeric"
                  value={w.live}
                  onChangeText={(val) => updateWeight(idx, val)}
                />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Carcass (kg)" value={w.carcass} editable={false} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Price (KES)" value={w.price} editable={false} />
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addWeight}>
              <Text style={styles.addBtnText}>+ Add Goat</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Total Goats: {weights.filter((w) => w.price).length}</Text>
            <Text style={styles.label}>Total Price: KES {totalPrice}</Text>

            <TouchableOpacity
              style={[styles.submitButton, submitting && { backgroundColor: "#6b7280" }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
            </TouchableOpacity>
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
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#000" },
  titleDark: { color: "#fff" },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4, color: "#374151" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: "#fff" },
  picker: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 16, backgroundColor: "#fff" },
  weightRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, gap: 8 },
  addBtn: { backgroundColor: "#1f8b2c", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 16 },
  addBtnText: { color: "#fff", fontWeight: "600" },
  submitButton: { backgroundColor: "#1f8b2c", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 20 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});

export default OfftakeForm;
