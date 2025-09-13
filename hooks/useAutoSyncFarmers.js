import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { ref, push } from "firebase/database";
import { database } from "../Config/firebaseConfig";

export const useAutoSync = () => {
  const syncingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && !syncingRef.current) {
        syncingRef.current = true;
        try {
          const pending = await AsyncStorage.getItem("localSync");
          if (pending) {
            const localSync = JSON.parse(pending);
            if (localSync.length > 0) {
              const dbRef = ref(database, "farmers");
              for (let item of localSync) {
                try {
                  await push(dbRef, item);
                } catch (err) {
                  console.error("Failed to sync item:", item, err);
                }
              }
              await AsyncStorage.removeItem("localSync");
              console.log("Local pending data synced to Firebase!");
            }
          }
        } finally {
          syncingRef.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, []);
};
