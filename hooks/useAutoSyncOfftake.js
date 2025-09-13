import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
              const offtakeRef = ref(database, "offtakes");
              for (let item of localSync) {
                try {
                  await push(offtakeRef, item);
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
