import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  Button,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { PieChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Reports() {
  const { theme } = useAppTheme();
  const [farmers, setFarmers] = useState([]);
  const [offtakes, setOfftakes] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ================== LOAD DATA ==================
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // Load farmers
          const storedFarmers = await AsyncStorage.getItem("farmers");
          const farmersData = storedFarmers ? JSON.parse(storedFarmers) : [];
          setFarmers(farmersData);

          // Load offtakes
          const storedOfftakes = await AsyncStorage.getItem("offtakes");
          const offtakesData = storedOfftakes ? JSON.parse(storedOfftakes) : [];
          setOfftakes(offtakesData);
        } catch (e) {
          console.log("Failed to load data:", e);
        }
      };
      loadData();
    }, [])
  );

  // ================== PARSE "DD MMM YYYY" STRING ==================
  const parseDate = (str) => {
    const [day, monthStr, year] = str.split(" ");
    const monthNames = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sept: 8, Oct: 9, Nov: 10, Dec: 11
    };
    return new Date(year, monthNames[monthStr], day);
  };

  const displayDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ================== FILTER BY DATE ==================
  const filteredFarmers = farmers.filter((f) => {
    const regDate = parseDate(f.registrationDate);
    return (!startDate || regDate >= startDate) && (!endDate || regDate <= endDate);
  });
  const totalFarmers = filteredFarmers.length;

  const filteredOfftakes = offtakes.filter((o) => {
    const oDate = parseDate(o.date);
    return (!startDate || oDate >= startDate) && (!endDate || oDate <= endDate);
  });

  // ================== COMPUTE STATS FROM OFFTAKES ==================
  const maleCount = filteredOfftakes.filter((o) => o.gender === "male").length;
  const femaleCount = filteredOfftakes.filter((o) => o.gender === "female").length;

  // Performance per Location
  const locationMap = {};
  filteredOfftakes.forEach((o) => {
    const loc = o.county || "Unknown";
    if (!locationMap[loc]) locationMap[loc] = 0;
    locationMap[loc] += 1;
  });
  const locationStats = Object.keys(locationMap).map((loc) => ({
    location: loc,
    entries: locationMap[loc],
    percentage: ((locationMap[loc] / filteredOfftakes.length) * 100).toFixed(1),
  }));

  // Offtakes Revenue per Location
  let totalRevenue = 0;
  const revenueMap = {};
  filteredOfftakes.forEach((o) => {
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

  return (
    <SafeAreaView style={[styles.container, theme === "dark" && styles.containerDark]}>
      <AppHeader />
      <ScrollView style={styles.scene}>
        {/* ================== DATE PICKERS ================== */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Text style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}>
            Filter by Date
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Button
              title={startDate ? displayDate(startDate) : "Start Date"}
              onPress={() => setShowStartPicker(true)}
            />
            <Button
              title={endDate ? displayDate(endDate) : "End Date"}
              onPress={() => setShowEndPicker(true)}
            />
          </View>
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>

        {/* ================== Offtakes & Farmers Side by Side ================== */}
        <View style={{ flexDirection: "row", marginHorizontal: 12, marginVertical: 6 }}>
          {/* Offtakes */}
          <View
            style={[
              styles.card,
              { flex: 1, marginRight: 6 },
              theme === "dark" && styles.cardDark,
            ]}
          >
            <Icon name="cart" size={28} color="#f59e0b" />
            <Text style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}>
              Total Offtakes: {filteredOfftakes.length}
            </Text>
          </View>

          {/* Farmers */}
          <View
            style={[
              styles.card,
              { flex: 1, marginLeft: 6 },
              theme === "dark" && styles.cardDark,
            ]}
          >
            <Icon name="account-group" size={28} color="#16a34a" />
            <Text style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}>
              Farmers Reg: {totalFarmers}
            </Text>
          </View>
        </View>

        {/* Performance per Location */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Icon name="map-marker" size={28} color="#f59e0b" />
          <Text style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}>
            Performance per County
          </Text>
          {locationStats.map((loc, idx) => (
            <Text key={idx} style={[styles.subText, theme === "dark" && { color: "#d1d5db" }]}>
              {loc.location}: {loc.entries} Offtakes ({loc.percentage}%)
            </Text>
          ))}
        </View>

        {/* Pie Chart Gender */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Text style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}>
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
          <Text style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}>
            Total Revenue: KES {totalRevenue.toLocaleString()}
          </Text>
        </View>

        {/* Beneficiaries per Location */}
        <View style={[styles.card, theme === "dark" && styles.cardDark]}>
          <Icon name="city" size={28} color="#3b82f6" />
          <Text style={[styles.title, theme === "dark" && { color: "#e5e7eb" }]}>
            Beneficiaries per County
          </Text>
          {revenueStats.map((r, idx) => (
            <Text key={idx} style={[styles.subText, theme === "dark" && { color: "#d1d5db" }]}>
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
  scene: { flex: 1, padding: 10, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 0,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  cardDark: { backgroundColor: "#1f2937" },
  title: { fontSize: 16, fontWeight: "700", marginTop: 8, color: "#111827" },
  subText: { fontSize: 14, color: "#374151" },
});
