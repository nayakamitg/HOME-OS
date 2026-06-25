import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { DashboardScreen } from '../screens/DashboardScreen';
import { DevicesScreen } from '../screens/DevicesScreen';
import { AutomateScreen } from '../screens/AutomateScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RoomScreen } from '../screens/RoomScreen';
import { DeviceDetailScreen } from '../screens/DeviceDetailScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { AutomationScreen } from '../screens/AutomationScreen';
import { HomeSwitcherScreen } from '../screens/HomeSwitcherScreen';
import { OnboardingDiscoverScreen } from '../screens/OnboardingDiscoverScreen';
import { OnboardingSuccessScreen } from '../screens/OnboardingSuccessScreen';
import { AddDeviceScreen } from '../screens/AddDeviceScreen';
import { AddSceneScreen } from '../screens/AddSceneScreen';
import { ScenesScreen } from '../screens/ScenesScreen';
import { AddAutomationScreen } from '../screens/AddAutomationScreen';
import { AutomationDetailScreen } from '../screens/AutomationDetailScreen';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, (focused: boolean) => React.ReactNode> = {
  Home: (f) => <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /><Path d="M9 22V12h6v10" stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} fill="none" /></Svg>,
  Devices: (f) => <Svg width={22} height={22} viewBox="0 0 24 24"><Rect x={3} y={3} width={7} height={7} rx={1.5} stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} fill="none" /><Rect x={14} y={3} width={7} height={7} rx={1.5} stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} fill="none" /><Rect x={3} y={14} width={7} height={7} rx={1.5} stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} fill="none" /><Rect x={14} y={14} width={7} height={7} rx={1.5} stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} fill="none" /></Svg>,
  Automate: (f) => <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M13 2 3 14h9l-1 8 10-12h-9z" stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>,
  Activity: (f) => <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>,
  Settings: (f) => <Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={3} stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} fill="none" /><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={f ? Colors.accent : '#62626a'} strokeWidth={2} fill="none" /></Svg>,
};

function TabBar({ state, navigation }: any) {
  const Colors = useTheme();
  const tabStyles = makeTabStyles(Colors);
  return (
    <View style={tabStyles.bar}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            {TAB_ICONS[route.name]?.(focused)}
            <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeTabStyles = (Colors: ThemeColors) => StyleSheet.create({
  bar: { height: 92, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  tabItem: { alignItems: 'center', gap: 5 },
  tabLabel: { fontSize: 10.5, color: '#62626a', fontWeight: '500' },
  tabLabelActive: { color: Colors.accent, fontWeight: '600' },
});

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Devices" component={DevicesScreen} />
      <Tab.Screen name="Automate" component={AutomateScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Room" component={RoomScreen} />
        <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
        <Stack.Screen name="Assistant" component={AssistantScreen} />
        <Stack.Screen name="Automation" component={AutomationScreen} />
        <Stack.Screen name="HomeSwitcher" component={HomeSwitcherScreen} />
        <Stack.Screen name="OnboardingDiscover" component={OnboardingDiscoverScreen} />
        <Stack.Screen name="OnboardingSuccess" component={OnboardingSuccessScreen} />
        <Stack.Screen name="AddDevice" component={AddDeviceScreen} />
        <Stack.Screen name="AddScene" component={AddSceneScreen} />
        <Stack.Screen name="Scenes" component={ScenesScreen} />
        <Stack.Screen name="AddAutomation" component={AddAutomationScreen} />
        <Stack.Screen name="AutomationDetail" component={AutomationDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
