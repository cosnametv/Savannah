import React, { useEffect, useRef } from 'react';
import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../components/drawerContent';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import { useRouter, usePathname } from 'expo-router';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../Config/firebaseConfig';

function ThemedDrawer() {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';
  const drawerBg = isDark ? '#0b1220' : '#ffffff';
  const sceneBg = isDark ? '#111827' : '#ffffff';
  const activeTint = isDark ? '#22c55e' : '#166534';
  const inactiveTint = isDark ? '#cbd5e1' : '#374151';
  const router = useRouter();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        router.replace('/pinLock');
        return;
      }
      // If logged in, enforce PIN setup
      (async () => {
        const pin = await AsyncStorage.getItem('localPin');
        if (!pin) {
          router.replace('/pinSetup');
        }
      })();
    });
    return unsubscribe;
  }, [pathname, router]);


  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const now = Date.now();
      if (nextState === 'background' || nextState === 'inactive') {
        await AsyncStorage.setItem('lastActiveAt', String(now));
        return;
      }
      if (nextState === 'active') {
        try {
          const saved = await AsyncStorage.getItem('localPin');
          if (!saved) return;
          const lastStr = await AsyncStorage.getItem('lastActiveAt');
          const last = lastStr ? parseInt(lastStr, 10) : 0;
          const THIRTY_MIN = 30 * 60 * 1000;
          if (last && now - last > THIRTY_MIN) {
            router.replace('/pinLock');
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, [router]);

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: drawerBg },
        drawerContentStyle: { backgroundColor: drawerBg },
        drawerActiveTintColor: activeTint,
        drawerInactiveTintColor: inactiveTint,
        drawerActiveBackgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(22,101,52,0.08)',
        sceneContainerStyle: { backgroundColor: sceneBg },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* Hidden login route */}
      <Drawer.Screen
        name="login"
        options={{
          drawerLabel: 'Login',
          drawerItemStyle: { display: 'none' },
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="login" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="pinSetup"
        options={{
          drawerLabel: 'Set PIN',
          drawerItemStyle: { display: 'none' },
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lock-plus" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="pinLock"
        options={{
          drawerLabel: 'PIN Lock',
          drawerItemStyle: { display: 'none' },
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lock" size={size} color={color} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Farmers Registration',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple" size={size} color={color} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="offtake"
        options={{
          drawerLabel: 'Offtake',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="truck" size={size} color={color} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="reports"
        options={{
          drawerLabel: 'Reports',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-chart" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="OfftakePreview"
        options={{
          drawerLabel: 'Preview Offtakes',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden settings */}
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          drawerItemStyle: { display: 'none' },
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedDrawer />
    </AppThemeProvider>
  );
}
