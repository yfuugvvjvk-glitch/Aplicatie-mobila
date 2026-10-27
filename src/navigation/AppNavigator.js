/**
 * Sistem de navigare al aplicației
 * - Tab Navigator pentru ecranele principale
 * - Stack Navigator pentru flux de detalii
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTask } from '../context/TaskContext';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── Stack pentru tab-ul Home ─────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          headerShown: true,
          title: 'Detalii task',
          headerStyle: { backgroundColor: '#F0F4FF' },
          headerTintColor: '#2C3E6B',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.taskId ? 'Editare task' : 'Task nou',
          headerStyle: { backgroundColor: '#F0F4FF' },
          headerTintColor: '#2C3E6B',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}

// ─── Tab Navigator principal ──────────────────────────────────────────────────
function MainTabs() {
  const { getStats } = useTask();
  const stats = getStats();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#2C3E6B',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4A6CF7',
        tabBarInactiveTintColor: '#9BA8C0',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: 'Task-uri',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIcon}>
              <Text style={{ fontSize: 22 }}>📋</Text>
              {stats.active > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.active > 9 ? '9+' : stats.active}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          title: 'Categorii',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22 }}>📁</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Navigator root ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading } = useTask();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>✅</Text>
        <Text style={styles.loadingTitle}>TaskManager</Text>
        <ActivityIndicator size="large" color="#4A6CF7" style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Se încarcă...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: { fontSize: 64, marginBottom: 8 },
  loadingTitle: { fontSize: 28, fontWeight: '800', color: '#2C3E6B' },
  loadingText: { color: '#7B8AB8', marginTop: 12, fontSize: 14 },
  tabIcon: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
