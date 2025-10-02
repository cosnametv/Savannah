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
  const [selectedSubcounty, setSelectedSubcounty] = useState(null)

  const drawerStatus = useDrawerStatus() 
  const [username, setUsername] = useState(null)

  // Load stored username on component mount
  useEffect(() => {
    const loadInitialUsername = async () => {
      try {
        const stored = await AsyncStorage.getItem('storedUsername')
        if (stored) {
          setUsername(stored)
        } else {
          // Check if user is using local auth
          const localAuth = await AsyncStorage.getItem('localAuth')
          if (localAuth && !auth.currentUser) {
            setUsername('Local User')
          }
        }
      } catch (e) {
        console.log('Failed to load initial username:', e)
      }
    }
    
    loadInitialUsername()
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUserEmail(user?.email || '')
      
      // If Firebase user exists, store their email as username
      if (user?.email) {
        await AsyncStorage.setItem('storedUsername', user.email)
        setUsername(user.email)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const loadCounty = async () => {
      try {
        const saved = await AsyncStorage.getItem('selectedCounty')
        if (saved) setSelectedCounty(saved)
      } catch (e) {
        console.log('Failed to load county:', e)
      }
    }

    const loadSubcounty = async () => {
      try {
        const saved = await AsyncStorage.getItem('selectedSubcounty')
        if (saved) setSelectedSubcounty(saved)
      } catch (e) {
        console.log('Failed to load subcounty:', e)
      }
    }

    const loadStoredUsername = async () => {
      try {
        const stored = await AsyncStorage.getItem('storedUsername')
        if (stored) {
          setUsername(stored)
        } else if (!auth.currentUser) {
          // If no stored username and no Firebase user, check for local auth
          const localAuth = await AsyncStorage.getItem('localAuth')
          if (localAuth) {
            setUsername('Local User')
          }
        }
      } catch (e) {
        console.log('Failed to load stored username:', e)
      }
    }

    if (drawerStatus === 'open') {
      loadCounty()
      loadSubcounty()
      loadStoredUsername()
    }
  }, [drawerStatus])



  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0b1220' : '#ffffff' }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ backgroundColor: isDark ? '#0b1220' : '#ffffff' }}
      >
    
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.name, isDark && styles.nameDark]}>
            Savanna Herds Lmtd
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons 
            name="account-circle" 
            size={40} 
            color={isDark ? '#e5e7eb' : '#111827'} 
            style={{ marginRight: 15 }} 
          />

          <View style={{ flex: 1 }}>
            <Text style={[styles.sub, isDark && styles.subDark]}>
              {username || 'Loading...'}
            </Text>

            <Text style={[styles.sub, isDark && styles.subDark]}>
              Selected County: {selectedCounty || 'Not selected'}
            </Text>
            <Text style={[styles.sub, isDark && styles.subDark]}>
              Selected SubCounty: {selectedSubcounty || 'Not selected'}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ height: 20 }} />


        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      

      <View style={[styles.footer, isDark && styles.footerDark]}>
      <DrawerItem
        label="Logout"
        labelStyle={{ color: isDark ? '#e5e7eb' : '#111827', fontWeight: '600' }}
        icon={({ size, color }) => (
          <MaterialCommunityIcons
            name="logout"
            size={size}
            color={isDark ? '#e5e7eb' : '#111827'}
          />
        )}
        onPress={async () => {
          try {
            // Clear local auth flag and stored username
            await AsyncStorage.removeItem('localAuth');
            await AsyncStorage.removeItem('storedUsername');
            
            // Sign out from Firebase (if logged in)
            await auth.signOut();
            
            router.replace('/login');
          } catch (error) {
            console.error('Logout failed:', error);
          }
        }}
      />

        <View style={{ height: 10 }} />
        <DrawerItem
          label="Settings"
          labelStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
          icon={({ size }) => (
            <MaterialCommunityIcons
              name="cog"
              size={size}
              color={isDark ? '#e5e7eb' : '#111827'}
            />
          )}
          onPress={() => router.push('/settings')}
        />
          <View style={{ height: 70 }} />
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
