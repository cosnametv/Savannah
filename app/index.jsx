import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import { ref, push } from "firebase/database";
import { database } from "../Config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAutoSync } from "../hooks/useAutoSyncFarmers";

const FarmersAsHome = () => {
  useAutoSync();
  const { theme } = useAppTheme();
  const [step, setStep] = useState(1);

  // Farmer state
  const [name, setName] = useState("");
  const [gender, setGender] = useState("male");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date());

  // Livestock state
  const [goats, setGoats] = useState("");
  const [ageGroup, setAgeGroup] = useState("0-6");
  const [vaccinationDate, setVaccinationDate] = useState(null);
  const [vaccineType, setVaccineType] = useState("");
  const [traceability, setTraceability] = useState(false);

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (activeDateField === "registration") {
        setDate(selectedDate);
      } else if (activeDateField === "vaccination") {
        setVaccinationDate(selectedDate);
      }
    }
  };


const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  // ------------------ Validation ------------------
  if (
    !name.trim() ||
    !gender ||
    !idNumber.trim() ||
    !phone.trim() ||
    !goats.trim() ||
    !ageGroup ||
    !vaccineType.trim()
  ) {
    Alert.alert("⚠️ Validation", "Please fill in all required fields.");
    setIsSubmitting(false);
    return;
  }

  try {
    const savedCounty = await AsyncStorage.getItem("selectedCounty");
    if (!savedCounty) {
      Alert.alert("⚠️ Missing County", "Please select your county in Settings before submitting.");
      setIsSubmitting(false);
      return;
    }

    // ------------------ Farmer Data ------------------
    const farmerData = {
      name,
      gender,
      idNumber,
      phone,
      registrationDate: formatDate(date),
      goats,
      ageGroup,
      vaccinationDate: vaccinationDate ? formatDate(vaccinationDate) : "N/A",
      vaccineType,
      traceability,
      county: savedCounty,
    };

    // ------------------ Save Locally ------------------
    const existing = await AsyncStorage.getItem("farmers");
    const farmers = existing ? JSON.parse(existing) : [];
    farmers.push(farmerData);
    await AsyncStorage.setItem("farmers", JSON.stringify(farmers));

    // ------------------ Check Network ------------------
    const state = await NetInfo.fetch();

    if (state.isConnected) {
      // Online: save to Firebase immediately
      const farmersRef = ref(database, "farmers");
      await push(farmersRef, farmerData);

      // ------------------ Sync Pending Offline Data ------------------
      const pending = await AsyncStorage.getItem("localSyncFarmers");
      if (pending) {
        const localSync = JSON.parse(pending);
        for (let item of localSync) {
          try {
            await push(farmersRef, item);
          } catch (err) {
            console.error("Failed to sync farmer item:", item, err);
          }
        }
        await AsyncStorage.removeItem("localSyncFarmers");
        console.log("✅ Local pending farmers data synced to Firebase!");
      }

      Alert.alert("✅ Success", "Farmer recorded successfully!");
    } else {
      // Offline: save to localSyncFarmers for future sync
      const pending = await AsyncStorage.getItem("localSyncFarmers");
      const localSync = pending ? JSON.parse(pending) : [];
      localSync.push(farmerData);
      await AsyncStorage.setItem("localSyncFarmers", JSON.stringify(localSync));

      Alert.alert("⚠️ Offline", "Saved locally. Will sync when online.");
    }

    // ------------------ Reset Form ------------------
    setName("");
    setGender("male");
    setIdNumber("");
    setPhone("");
    setDate(new Date());
    setGoats("");
    setAgeGroup("0-6");
    setVaccinationDate(null);
    setVaccineType("");
    setTraceability(false);
    setStep(1);

  } catch (error) {
    console.log("Failed to save farmer:", error);
    Alert.alert("❌ Error", "Something went wrong while saving.");
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <SafeAreaView style={[styles.container, theme === "dark" && styles.containerDark]}>
      <AppHeader />

      <View style={styles.form}>
        <Text style={[styles.title, theme === "dark" && styles.titleDark]}>
          Farmers Registration
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= 1 && styles.activeStep]}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={[styles.stepLabel, step === 1 && styles.activeLabel]}>
              Farmer Details
            </Text>
          </View>

          <View style={[styles.connector, step > 1 && styles.connectorActive]} />

          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= 2 && styles.activeStep]}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={[styles.stepLabel, step === 2 && styles.activeLabel]}>
              Livestock & Health
            </Text>
          </View>
        </View>

        {/* STEP 1 */}
        {step === 1 && (
          <View>
            <Text style={[styles.sectionTitle, theme === "dark" && styles.titleDark]}>
              👤 Farmer Details
            </Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />

            <Text style={styles.label}>Gender</Text>
            <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker}>
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>

            <Text style={styles.label}>ID Number</Text>
            <TextInput style={styles.input} placeholder="ID Number" keyboardType="numeric" value={idNumber} onChangeText={setIdNumber} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <Text style={styles.label}>Date of Registration</Text>
            <TouchableOpacity style={styles.input} onPress={() => { setActiveDateField("registration"); setShowDatePicker(true); }}>
              <Text>{formatDate(date)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bigButton} onPress={() => setStep(2)}>
              <Text style={styles.bigButtonText}>Next Page</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View>
            <Text style={[styles.sectionTitle, theme === "dark" && styles.titleDark]}>
              🐐 Livestock & Health
            </Text>

            <Text style={styles.label}>Total Number of Goats</Text>
            <TextInput style={styles.input} placeholder="Enter number of goats" keyboardType="numeric" value={goats} onChangeText={setGoats} />

            <Text style={styles.label}>Goat Age Group</Text>
            <Picker selectedValue={ageGroup} onValueChange={setAgeGroup} style={styles.picker}>
              <Picker.Item label="0 - 6 months" value="0-6" />
              <Picker.Item label="7 - 12 months" value="7-12" />
            </Picker>

            <Text style={styles.label}>Vaccination Date</Text>
            <TouchableOpacity style={styles.input} onPress={() => { setActiveDateField("vaccination"); setShowDatePicker(true); }}>
              <Text>{vaccinationDate ? formatDate(vaccinationDate) : "Select Vaccination Date (or N/A)"}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Vaccine Type</Text>
            <TextInput style={styles.input} placeholder="Vaccine Type (if any)" value={vaccineType} onChangeText={setVaccineType} />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Traceability</Text>
              <Switch value={traceability} onValueChange={setTraceability} />
            </View>

            <View style={styles.navButtons}>
              <TouchableOpacity style={[styles.smallButton, styles.secondaryButton]} onPress={() => setStep(1)} disabled={isSubmitting}>
                <Text style={styles.smallButtonText}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bigSubmitButton, isSubmitting && { backgroundColor: "#6b7280" }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bigSubmitText}>Submit Form</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={activeDateField === "registration" ? date : vaccinationDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default FarmersAsHome;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  containerDark: { backgroundColor: "#111827" },
  form: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#000" },
  titleDark: { color: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#111" },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4, color: "#374151" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: "#fff" },
  picker: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 16, backgroundColor: "#fff" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12 },
  bigButton: { backgroundColor: "#1f8b2c", paddingVertical: 16, borderRadius: 10, alignItems: "center", marginTop: 12 },
  bigButtonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  navButtons: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  smallButton: { backgroundColor: "#6b7280", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  smallButtonText: { color: "#fff", fontWeight: "500", fontSize: 14 },
  bigSubmitButton: { backgroundColor: "#16a34a", paddingVertical: 13, paddingHorizontal: 50, borderRadius: 10 },
  bigSubmitText: { color: "#fff", fontWeight: "700", fontSize: 20 },
  progressContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  stepItem: { alignItems: "center", flex: 1 },
  stepCircle: { width: 25, height: 25, borderRadius: 20, borderWidth: 2, borderColor: "#9ca3af", backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  activeStep: { borderColor: "#1f8b2c", backgroundColor: "#1f8b2c" },
  stepText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  stepLabel: { marginTop: 6, fontSize: 12, color: "#6b7280", fontWeight: "500", textAlign: "center" },
  activeLabel: { color: "#1f8b2c", fontWeight: "700" },
  connector: { height: 2, flex: 1, backgroundColor: "#d1d5db", marginHorizontal: 5 },
  connectorActive: { backgroundColor: "#1f8b2c" },
});
