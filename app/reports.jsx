import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  FlatList,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

export default function Reports() {
  const { theme } = useAppTheme();
  const [farmers, setFarmers] = useState([]);
  const [offtakes, setOfftakes] = useState([]);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "farmers", title: "Farmers" },
    { key: "offtakes", title: "Offtakes" },
  ]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedFarmers = await AsyncStorage.getItem("farmers");
          setFarmers(storedFarmers ? JSON.parse(storedFarmers) : []);

          const storedOfftakes = await AsyncStorage.getItem("offtakes");
          setOfftakes(storedOfftakes ? JSON.parse(storedOfftakes) : []);
        } catch (e) {
          console.log("Failed to load data:", e);
        }
      };
      loadData();
    }, [])
  );

  const FarmersRoute = () => {
    if (farmers.length === 0) {
      return (
        <View style={[styles.scene, theme === "dark" && styles.containerDark]}>
          <Text style={[styles.empty, theme === "dark" && styles.emptyDark]}>
            No farmers saved yet.
          </Text>
        </View>
      );
    }

    const totalFarmers = farmers.length;
    const maleCount = farmers.filter((f) => f.gender === "male").length;
    const femaleCount = farmers.filter((f) => f.gender === "female").length;

    const countyMap = {};
    farmers.forEach((f) => {
      const county = f.county || "Unknown";
      if (!countyMap[county]) countyMap[county] = 0;
      countyMap[county] += 1;
    });

    const countyStats = Object.keys(countyMap).map((county) => ({
      county,
      count: countyMap[county],
      percentage: ((countyMap[county] / totalFarmers) * 100).toFixed(1),
    }));

    return (
      <View style={[styles.scene, theme === "dark" && styles.containerDark]}>
        <Text style={[styles.reportHeader, theme === "dark" && styles.itemDark]}>
          Total Farmers: {totalFarmers} (Male: {maleCount}, Female: {femaleCount})
        </Text>

        {countyStats.map((c, idx) => (
          <View
            key={idx}
            style={[styles.card, theme === "dark" && styles.cardDark]}
          >
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              County: {c.county}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Entries: {c.count} ({c.percentage}%)
            </Text>
          </View>
        ))}

        <FlatList
          data={farmers}
          keyExtractor={(item, index) => "farmer-" + index}
          renderItem={({ item }) => (
            <View style={[styles.card, theme === "dark" && styles.cardDark]}>
              <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
                Name: {item.name}
              </Text>
              <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
                Gender: {item.gender}
              </Text>
              <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
                ID: {item.idNumber}
              </Text>
              <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
                Phone: {item.phone}
              </Text>
              <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
                County: {item.county}
              </Text>
              <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
                Registered: {item.registrationDate}
              </Text>
            </View>
          )}
        />
      </View>
    );
  };

  const OfftakesRoute = () => {
    if (offtakes.length === 0) {
      return (
        <View style={[styles.scene, theme === "dark" && styles.containerDark]}>
          <Text style={[styles.empty, theme === "dark" && styles.emptyDark]}>
            No offtakes saved yet.
          </Text>
        </View>
      );
    }

    const totalFarmers = offtakes.length;
    const maleCount = offtakes.filter((o) => o.gender === "male").length;
    const femaleCount = offtakes.filter((o) => o.gender === "female").length;

    const countyMap = {};
    let totalAmount = 0;

    offtakes.forEach((o) => {
      const county = o.county || "Unknown";
      const price = o.totalPrice || 0;
      totalAmount += price;

      if (!countyMap[county]) countyMap[county] = { count: 0, amount: 0 };
      countyMap[county].count += 1;
      countyMap[county].amount += price;
    });

    const countyStats = Object.keys(countyMap).map((county) => ({
      county,
      entries: countyMap[county].count,
      percentage: ((countyMap[county].count / totalFarmers) * 100).toFixed(1),
      amount: countyMap[county].amount,
    }));

    return (
      <View style={[styles.scene, theme === "dark" && styles.containerDark]}>
        <View style={[styles.reportCard, theme === "dark" && styles.reportCardDark]}>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, theme === "dark" && styles.labelDark]}>
              Total Farmers:
            </Text>
            <Text style={[styles.reportValue, theme === "dark" && styles.valueDark]}>
              {totalFarmers} (Male: {maleCount}, Female: {femaleCount})
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, theme === "dark" && styles.labelDark]}>
              Total Amount:
            </Text>
            <Text style={[styles.reportValue, theme === "dark" && styles.valueDark]}>
              KES {totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>


        {countyStats.map((c, idx) => (
          <View
            key={idx}
            style={[styles.card, theme === "dark" && styles.cardDark]}
          >
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              County: {c.county}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Entries: {c.entries} ({c.percentage}%)
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Beneficiaries Amount: KES {c.amount.toLocaleString()}
            </Text>
          </View>
        ))}

        <FlatList
          data={offtakes}
          keyExtractor={(item, index) => "offtake-" + index}
          renderItem={({ item }) => (
           <View style={[styles.card, theme === "dark" && styles.cardDark]}>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Name: {item.name}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Gender: {item.gender}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              ID: {item.idNumber}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Phone: {item.phone}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              County: {item.county}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Date: {item.date}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Goats: {item.goats?.length || 0}
            </Text>
            <Text style={[styles.item, theme === "dark" && styles.itemDark]}>
              Total Price: KES {item.totalPrice?.toLocaleString() || 0}
            </Text>
          </View>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, theme === "dark" && styles.containerDark]}>
      <AppHeader />
      <TabView
        navigationState={{ index, routes }}
        renderScene={SceneMap({
          farmers: FarmersRoute,
          offtakes: OfftakesRoute,
        })}
        onIndexChange={setIndex}
        initialLayout={{ width: 400 }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: "#16a34a" }}
            style={{ backgroundColor: theme === "dark" ? "#111827" : "#fff" }}
            activeColor={theme === "dark" ? "#16a34a" : "#16a34a"}
            inactiveColor={theme === "dark" ? "#9ca3af" : "#6b7280"}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  containerDark: { backgroundColor: "#111827" },
  scene: { flex: 1, padding: 10 },
  empty: { textAlign: "center", marginTop: 10, marginBottom: 10, color: "#6b7280" },
  emptyDark: { color: "#9ca3af" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  cardDark: { backgroundColor: "#1f2937" },
  item: { fontSize: 14, color: "#111827" },
  itemDark: { color: "#e5e7eb" },
  reportHeader: { fontSize: 16, fontWeight: "bold", marginVertical: 6 },
  reportCard: {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 12,
  marginVertical: 10,
  marginHorizontal: 12,
  elevation: 3,
},
reportCardDark: {
  backgroundColor: "#1f2937",
},
reportRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 8,
},
reportLabel: {
  fontSize: 16,
  fontWeight: "600",
  color: "#374151",
},
reportValue: {
  fontSize: 16,
  fontWeight: "700",
  color: "#111827",
},
labelDark: {
  color: "#9ca3af",
},
valueDark: {
  color: "#e5e7eb",
},

});
