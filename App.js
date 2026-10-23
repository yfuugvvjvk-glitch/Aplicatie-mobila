/**
 * Punct de intrare principal al aplicației TaskManager
 * 
 * Arhitectură:
 * - React Native + Expo (cross-platform iOS/Android)
 * - Context API + useReducer pentru state management global
 * - AsyncStorage pentru persistență locală (offline-first)
 * - React Navigation (Stack + Tab) pentru navigare
 * - Componente reutilizabile, accesibilitate WCAG
 */
import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { TaskProvider } from './src/context/TaskContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </TaskProvider>
    </GestureHandlerRootView>
  );
}
