import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../Config/firebaseConfig";
import { ref, push } from "firebase/database";

export const useAutoSync = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        try {
          const pending = await AsyncStorage.getItem("localSyncFarmers");
          if (!pending) return;

          const localSync = JSON.parse(pending);
          if (localSync.length === 0) return;

          const farmersRef = ref(database, "farmers");

          for (let farmer of localSync) {
            try {
              await push(farmersRef, farmer);
            } catch (err) {
              console.error("Failed to sync farmer:", farmer, err);
            }
          }

          await AsyncStorage.removeItem("localSyncFarmers");
          console.log("✅ Local farmers synced automatically");
        } catch (err) {
          console.error("Auto sync failed:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);
};
