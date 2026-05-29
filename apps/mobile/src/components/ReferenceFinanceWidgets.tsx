/* eslint-disable no-restricted-imports */
import { Pressable, Text, View } from "react-native"
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Polyline,
  Stop,
} from "react-native-svg"
import { Ionicons } from "@expo/vector-icons"

import { TickerLogo } from "@/components/TickerLogo"
import { uiTokens } from "@/theme/uiTokens"

type HeaderIconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap
  onPress?: () => void
}

type SectionHeaderProps = {
  title: string
  actionLabel?: string
  onActionPress?: () => void
}

type ProgressRingProps = {
  progress: number
  size?: number
  strokeWidth?: number
  trackColor?: string
  color?: string
  children?: React.ReactNode
}

type SparklineProps = {
  values: number[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  strokeWidth?: number
}

type InvestmentCardProps = {
  ticker: string
  name: string
  logoUri?: string
  value: string
  changePercent: number
  chartValues: number[]
  onPress?: () => void
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

export function HeaderIconButton({ icon, onPress }: HeaderIconButtonProps) {
  return (
    <Pressable
      className="h-10 w-10 items-center justify-center rounded-full"
      style={{
        backgroundColor: uiTokens.reference.card,
        shadowColor: uiTokens.reference.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
      }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={21} color={uiTokens.reference.ink} />
      {icon === "notifications-outline" ? (
        <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#6C55FF]" />
      ) : null}
    </Pressable>
  )
}

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-1">
      <Text className="font-sans text-[28px] font-semibold leading-[34px] text-[#19172A]">
        {title}
      </Text>
      {actionLabel ? (
        <Pressable className="min-h-10 justify-center px-1" onPress={onActionPress}>
          <Text className="font-sans text-[16px] font-semibold text-[#6A4DF7]">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function ProgressRing({
  progress,
  size = 124,
  strokeWidth = 10,
  trackColor = "#EEF0FA",
  color = "#6C55FF",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamp01(progress))

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children ? (
        <View className="absolute inset-0 items-center justify-center">{children}</View>
      ) : null}
    </View>
  )
}

export function Sparkline({
  values,
  width = 120,
  height = 54,
  color = "#3B8DE8",
  fillColor = "#E9F4FF",
  strokeWidth = 2,
}: SparklineProps) {
  const points = createSvgPoints(values, width, height, 4)
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ")
  const fillPath =
    points.length > 1
      ? `M ${points[0].x} ${height} L ${pointString.replace(/ /g, " L ")} L ${points[points.length - 1].x} ${height} Z`
      : ""

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <SvgLinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fillColor} stopOpacity="0.9" />
          <Stop offset="1" stopColor={fillColor} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      {fillPath ? <Path d={fillPath} fill="url(#sparkFill)" /> : null}
      <Polyline
        points={pointString}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

export function InvestmentCard({
  ticker,
  name,
  logoUri,
  value,
  changePercent,
  chartValues,
  onPress,
}: InvestmentCardProps) {
  const isPositive = changePercent >= 0
  const trendColor = isPositive ? uiTokens.reference.success : uiTokens.reference.danger

  return (
    <Pressable
      className="mr-4 w-[184px] rounded-[18px] border bg-white px-4 py-4"
      style={{
        borderColor: uiTokens.reference.border,
        shadowColor: uiTokens.reference.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
      }}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <TickerLogo ticker={ticker} logoUri={logoUri} size={34} />
        <Text
          className="ml-3 flex-1 font-sans text-[18px] font-semibold text-[#19172A]"
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
      <View className="mt-4 h-[58px] justify-center">
        <Sparkline
          values={chartValues}
          width={146}
          height={56}
          color={trendColor}
          fillColor={isPositive ? "#DFF9EF" : "#FFE9EA"}
        />
      </View>
      <View className="mt-4 flex-row items-end justify-between">
        <Text className="font-sans text-[18px] font-semibold text-[#19172A]">{value}</Text>
        <Text className="font-sans text-[13px] font-semibold" style={{ color: trendColor }}>
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </Text>
      </View>
    </Pressable>
  )
}

export function createSvgPoints(values: number[], width: number, height: number, inset = 0) {
  const safeValues = values.length > 1 ? values : [0, 1]
  const min = Math.min(...safeValues)
  const max = Math.max(...safeValues)
  const range = Math.max(max - min, 1)
  const plotWidth = Math.max(width - inset * 2, 1)
  const plotHeight = Math.max(height - inset * 2, 1)

  return safeValues.map((value, index) => ({
    x: inset + (index / (safeValues.length - 1)) * plotWidth,
    y: inset + plotHeight - ((value - min) / range) * plotHeight,
  }))
}
