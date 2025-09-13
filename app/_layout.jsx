import React, { useEffect, useRef } from 'react'
import { Drawer } from 'expo-router/drawer'
import CustomDrawerContent from '../components/drawerContent'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { AppThemeProvider, useAppTheme } from '../contexts/ThemeContext' 
import { useRouter, usePathname } from 'expo-router'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth } from '../Config/firebaseConfig'

function ThemedDrawer() {
  const { theme } = useAppTheme()
  const isDark = theme === 'dark'
  const drawerBg = isDark ? '#0b1220' : '#ffffff'
  const sceneBg = isDark ? '#111827' : '#ffffff'
  const activeTint = isDark ? '#22c55e' : '#166534'
  const inactiveTint = isDark ? '#cbd5e1' : '#374151'
  const router = useRouter()
  const pathname = usePathname()
  const appState = useRef(AppState.currentState)

  // Redirect unauthenticated users to login as default
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace('/login')
      }
    })
    return unsubscribe
  }, [pathname, router])

  // App resume lock: require local PIN if still authenticated
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      const wasBackground = appState.current.match(/inactive|background/)
      appState.current = nextAppState

      if (nextAppState === 'background') {
        // mark as locked when app goes to background
        await AsyncStorage.setItem('locked', 'true')
      }

      if (wasBackground && nextAppState === 'active') {
        const user = auth.currentUser
        const locked = await AsyncStorage.getItem('locked')
        const hasPin = await AsyncStorage.getItem('userPIN')
        if (user && locked === 'true' && hasPin) {
          router.replace('/login')
        }
      }
    }

    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => sub.remove()
  }, [router])

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: drawerBg },
        drawerContentStyle: { backgroundColor: drawerBg },
        drawerActiveTintColor: activeTint,
        drawerInactiveTintColor: inactiveTint,
        drawerActiveBackgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(22,101,52,0.08)',
        sceneContainerStyle: { backgroundColor: sceneBg }
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* Hidden Login route - default entry for unauthenticated or PIN lock */}
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
        name="index"
        options={{
          drawerLabel: 'Farmers Registration',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-multiple"
              size={size}
              color={color}
            />
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
            <MaterialCommunityIcons
              name="file-chart"
              size={size}
              color={color}
            />
          ),
        }}
      />
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
  )
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedDrawer />
    </AppThemeProvider>
  )
}
