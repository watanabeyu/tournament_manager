import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="tournament/members" 
          options={{ 
            title: '参加者登録',
            headerStyle: {
              backgroundColor: '#F6F8FA',
            },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="tournament/matches" 
          options={{ 
            title: 'トーナメント表',
            headerStyle: {
              backgroundColor: '#F6F8FA',
            },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="round-robin/members" 
          options={{ 
            title: '参加者登録',
            headerStyle: {
              backgroundColor: '#F6F8FA',
            },
            headerShadowVisible: false,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}