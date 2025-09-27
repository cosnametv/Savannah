import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import { useNavigation } from 'expo-router';
import { useAppTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

export default function AppHeader({ showMenu = true }) {
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    // Fetch initial state in case listener fires late
    NetInfo.fetch().then(state => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <View style={[
      styles.headerContainer,
      { paddingTop: insets.top + 8 },
      isDark ? styles.headerDark : styles.headerLight,
    ]}>
      {/* Gradient overlay effect */}
      <View style={[
        styles.gradientOverlay,
        isDark ? styles.gradientOverlayDark : styles.gradientOverlayLight
      ]} />
      
      {/* Left: Menu Button or Placeholder */}
      {showMenu ? (
        <TouchableOpacity
          style={[
            styles.menuButton,
            isDark ? styles.menuButtonDark : styles.menuButtonLight
          ]}
          activeOpacity={0.7}
          onPress={() => {
            // @ts-ignore - expo-router exposes openDrawer when inside a Drawer
            if (typeof navigation?.openDrawer === 'function') {
              navigation.openDrawer();
            }
          }}
          accessibilityLabel="Open navigation menu"
          accessibilityRole="button"
          accessibilityHint="Opens the main navigation drawer"
        >
          <Ionicons 
            name="menu" 
            size={24} 
            color={isDark ? '#e5e7eb' : '#ffffff'} 
          />
        </TouchableOpacity>
      ) : (
        <View style={[
          styles.rightPlaceholder,
          isDark ? styles.rightPlaceholderDark : styles.rightPlaceholderLight
        ]} />
      )}

      {/* Center: Logo and Title */}
      <View style={styles.centerContent}>
        <View style={[
          styles.logoWrapper,
          isDark ? styles.logoWrapperDark : styles.logoWrapperLight
        ]}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="cover"
            accessibilityLabel="Savannah Herds logo"
          />
        </View>
        
        <View style={[
          styles.titleContainer,
          isDark ? styles.titleContainerDark : styles.titleContainerLight
        ]}>
          <Text style={[
            styles.welcomeText,
            isDark ? styles.welcomeTextDark : styles.welcomeTextLight
          ]}>
            Welcome to
          </Text>
          <Text style={[
            styles.appNameText,
            isDark ? styles.appNameTextDark : styles.appNameTextLight
          ]}>
            Savanna Herds Lmtd
          </Text>
        </View>
      </View>

      {/* Right: Online/Offline status */}
      <View style={[
        styles.statusPill,
        isOnline ? styles.statusOnlineBg : styles.statusOfflineBg
      ]}>
        <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
        <Text style={[styles.statusText]}>{isOnline ? 'Online' : 'Offline'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: 120,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
      },
    }),
  },
  headerLight: {
    backgroundColor: '#1f8b2c',
  },
  headerDark: {
    backgroundColor: '#0a4b16',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  gradientOverlayLight: {
    backgroundColor: '#2aa43a',
    opacity: 0.4,
  },
  gradientOverlayDark: {
    backgroundColor: '#166534',
    opacity: 0.5,
  },
  
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 8,
    zIndex: 1,
  },
  menuButtonLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  centerContent: {
    alignItems: 'center',
    flex: 1,
    marginTop: 8,
    zIndex: 1,
  },

  logoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  logoWrapperLight: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoWrapperDark: {
    backgroundColor: '#d1d5db',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  titleContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },

  welcomeText: {
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: -2,
  },
  welcomeTextLight: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  welcomeTextDark: {
    color: '#e5e7eb',
  },

  appNameText: {
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  appNameTextLight: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  appNameTextDark: {
    color: '#f9fafb',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  rightPlaceholder: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    zIndex: 1,
  },
  rightPlaceholderLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  rightPlaceholderDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 16,
  },
  statusOnlineBg: {
    backgroundColor: 'rgba(34,197,94,0.25)',
  },
  statusOfflineBg: {
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: { backgroundColor: '#22c55e' },
  dotOffline: { backgroundColor: '#ef4444' },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});