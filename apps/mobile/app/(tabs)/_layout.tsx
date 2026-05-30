/* eslint-disable no-restricted-imports */
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { uiTokens } from "@/theme/uiTokens"

const ACTIVE = uiTokens.reference.violet
const INACTIVE = uiTokens.reference.muted
const SHELL_BORDER = uiTokens.reference.border

type TabIconProps = {
  focused: boolean
  activeIcon: keyof typeof Ionicons.glyphMap
  inactiveIcon?: keyof typeof Ionicons.glyphMap
}

function TabIcon({ focused, activeIcon, inactiveIcon }: TabIconProps) {
  const iconName = focused ? activeIcon : (inactiveIcon ?? activeIcon)

  return <Ionicons name={iconName} size={24} color={focused ? ACTIVE : INACTIVE} />
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 92,
          borderTopWidth: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: "rgba(255,255,255,0.97)",
          borderWidth: 1,
          borderColor: SHELL_BORDER,
          paddingTop: 9,
          paddingBottom: 15,
          shadowColor: "#3A3560",
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="home" inactiveIcon="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="pie-chart" inactiveIcon="pie-chart-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: "Board",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon="chatbubble-ellipses"
              inactiveIcon="chatbubble-ellipses-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="heartbeat"
        options={{
          title: "Heartbeat",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="pulse" inactiveIcon="pulse-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 92,
            borderTopWidth: 0,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: "rgba(255,255,255,0.97)",
            borderWidth: 1,
            borderColor: SHELL_BORDER,
            paddingTop: 9,
            paddingBottom: 15,
            shadowColor: "#3A3560",
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 16,
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="person" inactiveIcon="person-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}
