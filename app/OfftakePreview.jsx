import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const OfftakePreview = () => {
  const { theme } = useAppTheme();
  const [offtakes, setOfftakes] = useState([]);

  // Reload every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const saved = await AsyncStorage.getItem("offtakes");
          if (saved) {
            setOfftakes(JSON.parse(saved));
          } else {
            setOfftakes([]);
          }
        } catch (err) {
          console.error("Error loading offtakes", err);
        }
      };
      loadData();
    }, [])
  );

  const clearAllOfftakes = async () => {
    Alert.alert(
      "Confirm",
      "Clear all saved offtakes on this device? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("offtakes");
              await AsyncStorage.removeItem("localSync");
              setOfftakes([]);
              Alert.alert("Done", "All local offtake data cleared.");
            } catch (e) {
              console.error("Failed to clear offtakes:", e);
              Alert.alert("Error", "Could not clear data. Try again.");
            }
          },
        },
      ]
    );
  };

  if (offtakes.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, theme === "dark" && styles.containerDark]}
      >
        <AppHeader />
        <View style={styles.scene}>
          <Text
            style={[styles.empty, theme === "dark" && styles.emptyDark]}
          >
            No offtakes saved yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalOfftakes = offtakes.length;
  const maleCount = offtakes.filter((o) => o.gender === "male").length;
  const femaleCount = offtakes.filter((o) => o.gender === "female").length;
  const totalAmount = offtakes.reduce(
    (sum, o) => sum + (o.totalPrice || 0),
    0
  );

  const getWeightFromPrice = (price) => {
  if (!price) return "-";

  if (price === 3500) return "14 - 14.99";
  if (price === 3700) return "15 - 15.99";
  if (price === 4000) return "16 - 16.99";
  if (price === 4300) return "17 - 17.99";
  if (price === 4500) return "18 - 18.99";
  if (price === 4800) return "19 - 19.99";
  if (price === 5000) return "20 - 20.99";
  if (price === 5300) return "21 - 21.99";
  if (price === 5500) return "22 - 22.99";
  if (price === 5800) return "23 - 24.99";
  if (price === 6000) return "25 - 25.99";
  if (price === 6300) return "26 - 26.99";
  if (price === 6500) return "27 - 27.99";
  if (price === 7000) return "28 - 29.99";
  return "-";
};


return (
  <SafeAreaView
    style={[styles.container, theme === "dark" && styles.containerDark]}
  >
    <AppHeader />
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearAllOfftakes}>
          <Text style={styles.clearBtnText}>Clear Offtakes</Text>
        </TouchableOpacity>
      </View>
    <ScrollView style={styles.scene}>
      {/* Summary */}
      <View
        style={[styles.reportCard, theme === "dark" && styles.reportCardDark]}
      >
        <View style={styles.summaryRow}>
          {/* Left: Total Offtakes */}
          <View
            style={[styles.summaryBox, theme === "dark" && styles.summaryBoxDark]}
          >
            <View
              style={[
                styles.summaryBoxAccent,
                { backgroundColor: theme === "dark" ? "#10B981" : "#4CAF50" },
              ]}
            />
            <Icon
              name="account-group"
              size={28}
              color={theme === "dark" ? "#34D399" : "#00796B"}
            />
            <Text
              style={[styles.summaryValue, theme === "dark" && styles.valueDark]}
            >
              Total: {totalOfftakes}
            </Text>
            <Text
              style={[styles.subValue, theme === "dark" && styles.labelDark]}
            >
              Male: {maleCount}, Female: {femaleCount}
            </Text>
          </View>

          {/* Right: Total Revenue */}
          <View
            style={[styles.summaryBox, theme === "dark" && styles.summaryBoxDark]}
          >
            <View
              style={[
                styles.summaryBoxAccent,
                { backgroundColor: theme === "dark" ? "#F59E0B" : "#E65100" },
              ]}
            />
            <Icon
              name="cash-multiple"
              size={28}
              color={theme === "dark" ? "#FBBF24" : "#E65100"}
            />
            <Text
              style={[styles.summaryLabel, theme === "dark" && styles.labelDark]}
            >
              Total Revenue
            </Text>
            <Text
              style={[styles.summaryValue, theme === "dark" && styles.valueDark]}
            >
              KES {totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Individual Offtakes */}
      {offtakes.map((item, index) => (
        <View
          key={index}
          style={[styles.card, theme === "dark" && styles.cardDark]}
        >
          <View
            style={[
              styles.cardAccent,
              { backgroundColor: theme === "dark" ? "#10B981" : "#4CAF50" },
            ]}
          />
          <Text style={[styles.item, theme === "dark" && styles.itemDark]}>Name: {item.name}</Text>
          <Text style={[styles.item, theme === "dark" && styles.itemDark]}>ID: {item.idNumber}</Text>
          <Text style={[styles.item, theme === "dark" && styles.itemDark]}>Location: {item.location}</Text>
          <Text style={[styles.item, theme === "dark" && styles.itemDark]}>Date: {item.date}</Text>
          <Text style={[styles.item, theme === "dark" && styles.itemDark]}>Total Price: KES {item.totalPrice?.toLocaleString() || 0}</Text>

          {/* Goat Breakdown */}
          {item.goats && item.goats.length > 0 && (
            <View style={styles.goatList}>
              <Text
                style={[styles.subTitle, theme === "dark" && styles.itemDark]}
              >
                Goat Details:
              </Text>
              {item.goats.map((g, i) => (
                <Text
                  key={i}
                  style={[styles.itemSmall, theme === "dark" && styles.itemDark]}
                >
                  Goats {i + 1}: Weight {g.live || "-"} kg – Price KES {(
                    typeof g.price === "number"
                      ? g.price.toLocaleString()
                      : (parseFloat(g.price) || 0).toLocaleString()
                  )}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  </SafeAreaView>
);

};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scene: { flex: 1, padding: 16 },
  containerDark: { backgroundColor: "#000" },

  empty: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    color: "#333",
  },
  emptyDark: { color: "#fff" },

  // Summary container
  reportCard: {
    backgroundColor: "#f9f9f9",
    padding: 0,
    borderRadius: 12,
    marginBottom: 16,
  },
  reportCardDark: { backgroundColor: "#1f2937" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  clearBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // Summary Boxes
  summaryBox: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    marginHorizontal: 6,
    marginVertical: 0,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
  },
  summaryBoxDark: {
    backgroundColor: "#111827",
    shadowColor: "#10B981",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryBoxAccent: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginTop: 4,
  },
  subValue: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    textAlign: "center",
  },

  // Offtake Cards
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#1f2937",
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  item: { fontSize: 14, marginBottom: 4, color: "#000" },
  itemDark: { color: "#f3f4f6" },
  goatList: { marginTop: 8 },
  subTitle: { fontWeight: "bold", marginBottom: 4 },
  itemSmall: { fontSize: 12, marginLeft: 10, color: "#444" },
  labelDark: { color: "#9ca3af" },
  valueDark: { color: "#fff" },
  cardAccent: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});


export default OfftakePreview;
