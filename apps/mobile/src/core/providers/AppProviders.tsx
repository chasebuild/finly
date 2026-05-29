import { PropsWithChildren, ReactNode } from "react"
import { Platform, View, useWindowDimensions } from "react-native"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { ThemeProvider } from "@/theme/context"

function maybeWrapWithTamagui(children: ReactNode) {
  // Keep boot path free of Tamagui module resolution until dependencies are installed.
  return <>{children}</>
}

export function AppProviders({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions()
  const isDesktopWeb = Platform.OS === "web" && width >= 1024

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {maybeWrapWithTamagui(
        <ThemeProvider>
          <KeyboardProvider>
            {isDesktopWeb ? (
              <View className="flex-1 items-center justify-center bg-[#E8EDF6] p-4">
                <View className="h-[852px] min-h-[852px] w-[393px] min-w-[393px] overflow-hidden rounded-[36px] border border-[#CFD9EA] bg-white shadow-2xl">
                  {children}
                </View>
              </View>
            ) : (
              children
            )}
          </KeyboardProvider>
        </ThemeProvider>,
      )}
    </SafeAreaProvider>
  )
}
