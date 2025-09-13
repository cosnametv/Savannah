import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { DrawerContentScrollView, DrawerItemList, DrawerItem, useDrawerStatus } from '@react-navigation/drawer'
import { useRouter } from 'expo-router'
import { useAppTheme } from '../contexts/ThemeContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { auth } from '../Config/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function CustomDrawerContent(props) {
  const router = useRouter()
  const { theme } = useAppTheme()
  const isDark = theme === 'dark'

  const [userEmail, setUserEmail] = useState(() => auth.currentUser?.email || '')
  const [selectedCounty, setSelectedCounty] = useState(null)

  const drawerStatus = useDrawerStatus() // 👈 tells if drawer is open/closed

  // Listen for auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || '')
    })
    return () => unsub()
  }, [])

  // Refresh county whenever drawer opens
  useEffect(() => {
    const loadCounty = async () => {
      try {
        const saved = await AsyncStorage.getItem('selectedCounty')
        if (saved) setSelectedCounty(saved)
      } catch (e) {
        console.log('Failed to load county:', e)
      }
    }

    if (drawerStatus === 'open') {
      loadCounty()
    }
  }, [drawerStatus])

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0b1220' : '#ffffff' }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ backgroundColor: isDark ? '#0b1220' : '#ffffff' }}
      >
        <View style={[styles.header, isDark && styles.headerDark]}>
          <Text style={[styles.name, isDark && styles.nameDark]}>Savannah Herds</Text>
          <Text style={[styles.sub, isDark && styles.subDark]}>
            Email: {userEmail || 'Not signed in'}
          </Text>
          <Text style={[styles.sub, isDark && styles.subDark]}>
            County: {selectedCounty || 'Not selected'}
          </Text>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={[styles.footer, isDark && styles.footerDark]}>
        <DrawerItem
          label="Logout"
          labelStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
          icon={({ size }) => (
            <MaterialCommunityIcons name="logout" size={size} color={isDark ? '#e5e7eb' : '#111827'} />
          )}
          onPress={async () => {
            try {
              await auth.signOut()
              router.replace('/login')
            } catch (e) {
              console.log('Logout failed:', e)
            }
          }}
        />
        <DrawerItem
          label="Settings"
          labelStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
          icon={({ size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={isDark ? '#e5e7eb' : '#111827'} />
          )}
          onPress={() => router.push('/settings')}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerDark: { borderBottomColor: '#1f2937' },
  name: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  nameDark: { color: '#e5e7eb' },
  sub: {
    color: '#6b7280',
    fontSize: 12,
  },
  subDark: { color: '#9ca3af' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerDark: { borderTopColor: '#1f2937' },
})
