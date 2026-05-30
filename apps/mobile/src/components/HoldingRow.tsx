/* eslint-disable no-restricted-imports */
import { Pressable, Text, View } from "react-native"

import { TickerLogo } from "@/components/TickerLogo"
import { uiTokens } from "@/theme/uiTokens"

const formatSignedPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`

type HoldingRowProps = {
  name: string
  logoUri?: string
  ticker: string
  shares?: number
  value: string
  allocationPercent: number
  changePercent: number
  onPress: () => void
  borderColor?: string
}

export function HoldingRow({
  name,
  logoUri,
  ticker,
  shares,
  value,
  allocationPercent,
  changePercent,
  onPress,
  borderColor = uiTokens.reference.border,
}: HoldingRowProps) {
  return (
    <Pressable
      className="flex-row items-center justify-between border-b py-4 last:border-b-0"
      style={{ borderColor }}
      onPress={onPress}
    >
      <View className="flex-row items-center flex-1 pr-3">
        <TickerLogo ticker={ticker} logoUri={logoUri} />
        <View className="ml-3">
          <Text className="font-sans text-[16px] font-semibold text-[#19172A]">{name}</Text>
          <Text className="font-sans text-[14px] text-[#77728D]">{ticker}</Text>
          {typeof shares === "number" ? (
            <Text className="mt-0.5 font-sans text-[12px] text-[#77728D]">
              {shares} shares . {allocationPercent.toFixed(1)}% of portfolio
            </Text>
          ) : (
            <Text className="mt-0.5 font-sans text-[12px] text-[#77728D]">
              {allocationPercent.toFixed(1)}% of portfolio
            </Text>
          )}
        </View>
      </View>
      <View className="items-end">
        <Text className="font-sans text-[17px] font-semibold text-[#19172A]">{value}</Text>
        <Text
          className={`font-sans text-[13px] ${changePercent >= 0 ? "text-[#19B88F]" : "text-[#EF5B5B]"}`}
        >
          {formatSignedPercent(changePercent)}
        </Text>
      </View>
    </Pressable>
  )
}
