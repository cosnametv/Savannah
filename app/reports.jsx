import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { PieChart } from "react-native-chart-kit";

export default function Reports() {
  const { theme } = useAppTheme();
  const [farmers, setFarmers] = useState([]);
  const [offtakes, setOfftakes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // Fetch Farmers
          const storedFarmers = await AsyncStorage.getItem("farmers");
          const farmersData = storedFarmers ? JSON.parse(storedFarmers) : [];

          // Fetch Offtakes
          const storedOfftakes = await AsyncStorage.getItem("offtakes");
          const offtakesData = storedOfftakes ? JSON.parse(storedOfftakes) : [];

          setFarmers(farmersData);
          setOfftakes(offtakesData);

          // 🔥 Derive farmers from offtakes if missing
          if (farmersData.length === 0 && offtakesData.length > 0) {
            const derivedFarmers = offtakesData.map((o) => ({
              name: o.name,
              gender: o.gender,
              idNumber: o.idNumber,
              phone: o.phone,
              county: o.county,
              registrationDate: o.date,
            }));
            setFarmers(derivedFarmers);
          }
        } catch (e) {
          console.log("Failed to load data:", e);
        }
      };
      loadData();
    }, [])
  );

  // ================== COMPUTE STATS ==================
  const totalFarmers = farmers.length;
  const maleCount = farmers.filter((f) => f.gender === "male").length;
  const femaleCount = farmers.filter((f) => f.gender === "female").length;

  // Performance per Location
  const locationMap = {};
  farmers.forEach((f) => {
    const loc = f.county || "Unknown";
    if (!locationMap[loc]) locationMap[loc] = 0;
    locationMap[loc] += 1;
  });
  const locationStats = Object.keys(locationMap).map((loc) => ({
    location: loc,
    entries: locationMap[loc],
    percentage: ((locationMap[loc] / totalFarmers) * 100).toFixed(1),
  }));

  // Offtakes Revenue per Location
  let totalRevenue = 0;
  const revenueMap = {};
  offtakes.forEach((o) => {
    const loc = o.county || "Unknown";
    const price = o.totalPrice || 0;
    totalRevenue += price;
    if (!revenueMap[loc]) revenueMap[loc] = 0;
    revenueMap[loc] += price;
  });
  const revenueStats = Object.keys(revenueMap).map((loc) => ({
    location: loc,
    amount: revenueMap[loc],
    percentage: ((revenueMap[loc] / totalRevenue) * 100).toFixed(1),
  }));

  // Pie Chart Data
  const genderData = [
    {
      name: "Male",
      population: maleCount,
      color: "#64C2A6",
      legendFontColor: theme === "dark" ? "#e5e7eb" : "#111827",
      legendFontSize: 14,
    },
    {
      name: "Female",
      population: femaleCount,
      color: "#16a34a",
      legendFontColor: theme === "dark" ? "#e5e7eb" : "#111827",
      legendFontSize: 14,
    },
  ];

  // ================== UI ==================
  return (
    <SafeAreaView
      style={[styles.container, theme === "dark" && styles.containerDark]}
    >
      <AppHeader />
      <ScrollView style={styles.scene}>
        {/* Total Farmers */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Icon name="account-group" size={28} color="#16a34a" />
          <Text
            style={[
              styles.title,
              theme === "dark" && { color: "#e5e7eb" },
            ]}
          >
            Total Farmers: {totalFarmers}
          </Text>
        </View>

        {/* Performance per Location */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Icon name="map-marker" size={28} color="#f59e0b" />
          <Text
            style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}
          >
            Performance per County
          </Text>
          {locationStats.map((loc, idx) => (
            <Text
              key={idx}
              style={[styles.subText, theme === "dark" && { color: "#d1d5db" }]}
            >
              {loc.location}: {loc.entries} Farmers ({loc.percentage}%)
            </Text>
          ))}
        </View>

        {/* Pie Chart Gender */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Text
            style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}
          >
            Gender Distribution
          </Text>
          <PieChart
            data={genderData}
            width={Dimensions.get("window").width - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme === "dark" ? "#111827" : "#fff",
              backgroundGradientFrom: theme === "dark" ? "#1f2937" : "#fff",
              backgroundGradientTo: theme === "dark" ? "#111827" : "#fff",
              decimalPlaces: 1,
              color: (opacity = 1) =>
                theme === "dark"
                  ? `rgba(255, 255, 255, ${opacity})`
                  : `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Total Revenue */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Icon name="currency-usd" size={28} color="#10b981" />
          <Text
            style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}
          >
            Total Revenue: KES {totalRevenue.toLocaleString()}
          </Text>
        </View>

        {/* Beneficiaries per Location */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Icon name="city" size={28} color="#3b82f6" />
          <Text
            style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}
          >
            Beneficiaries per County
          </Text>
          {revenueStats.map((r, idx) => (
            <Text
              key={idx}
              style={[styles.subText, theme === "dark" && { color: "#d1d5db" }]}
            >
              {r.location}: KES {r.amount.toLocaleString()} ({r.percentage}%)
            </Text>
          ))}
        </View>
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  containerDark: { backgroundColor: "#111827" },
  scene: { flex: 1, padding: 10 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  cardDark: { backgroundColor: "#1f2937" },
  title: { fontSize: 16, fontWeight: "700", marginTop: 8, color: "#111827" },
  subText: { fontSize: 14, color: "#374151" },
  scene: { flex: 1, padding: 10, paddingBottom: 40,},

});
