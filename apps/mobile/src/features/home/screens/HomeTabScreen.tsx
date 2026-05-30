/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable no-restricted-imports */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import Markdown from "react-native-markdown-display"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import {
  HeaderIconButton,
  InvestmentCard,
  ProgressRing,
  SectionHeader,
} from "@/components/ReferenceFinanceWidgets"
import { TickerLogo } from "@/components/TickerLogo"
import {
  buildTeamInsights,
  clamp,
  formatLocalDateKey,
  shortHeadline,
} from "@/features/home/home.utils"
import { api } from "@/services/api"
import { useMarketData } from "@/services/marketData"
import { useOnboardingStore } from "@/stores/onboardingStore"
import { uiTokens } from "@/theme/uiTokens"
import { getRandomAgentAvatar } from "@/utils/agentAvatars"
import { teamAgents } from "@/utils/mockAppData"
import { useSelectedPortfolioData } from "@/utils/selectedPortfolio"

const formatMoney = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
    style: "currency",
  }).format(value)

const signedMoney = (value: number) => `${value >= 0 ? "+" : "-"}${formatMoney(Math.abs(value), 2)}`

const signedPct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
const allocationColors = ["#89F4BC", "#55A8FF", "#9365FF", "#D8D1FF"] as const
const TEAM_COLLAPSED_HEIGHT = 214
const TEAM_SNAP_THRESHOLD = 92

export function HomeTabScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { height, width } = useWindowDimensions()
  const name = useOnboardingStore((state) => state.name)
  const { holdings, snapshot: portfolioSnapshot } = useSelectedPortfolioData()
  const { quotes, isLoading, hasLiveQuotes } = useMarketData(
    holdings.map((holding) => holding.ticker),
  )
  const [advisorNewsSummary, setAdvisorNewsSummary] = useState(
    "Today's holdings headlines are loading.",
  )
  const [isTeamExpanded, setIsTeamExpanded] = useState(false)
  const [expandedInsight, setExpandedInsight] = useState<{
    agentName: string
    role: string
    text: string
  } | null>(null)
  const expandedHeight = Math.max(height - insets.top - 12, TEAM_COLLAPSED_HEIGHT)
  const sheetHeight = useRef(new Animated.Value(TEAM_COLLAPSED_HEIGHT)).current
  const dragStartHeightRef = useRef(TEAM_COLLAPSED_HEIGHT)
  const showSideGainLoss = width >= 760

  const displayName = name.trim() || "Tin"
  const enrichedHoldings = useMemo(
    () =>
      holdings.map((holding) => {
        const liveQuote = quotes[holding.ticker]
        const valueUsd = liveQuote ? liveQuote.price * holding.shares : holding.valueUsd

        return {
          ...holding,
          valueUsd,
          changePercent: liveQuote?.change_pct ?? holding.changePercent,
        }
      }),
    [holdings, quotes],
  )
  const totalValueUsd = useMemo(
    () => enrichedHoldings.reduce((sum, holding) => sum + holding.valueUsd, 0),
    [enrichedHoldings],
  )
  const totalPnlUsd = totalValueUsd - portfolioSnapshot.investedUsd
  const totalPnlPct = portfolioSnapshot.investedUsd
    ? (totalPnlUsd / portfolioSnapshot.investedUsd) * 100
    : 0
  const gainValue = Math.max(totalPnlUsd, 0)
  const lossValue = Math.max(-totalPnlUsd, 0)
  const sortedByValue = useMemo(
    () => [...enrichedHoldings].sort((left, right) => right.valueUsd - left.valueUsd),
    [enrichedHoldings],
  )
  const allocationItems = useMemo(() => {
    if (sortedByValue.length === 0 || totalValueUsd <= 0) return []

    const top = sortedByValue.slice(0, 3).map((holding) => ({
      label: holding.name,
      percent: totalValueUsd ? (holding.valueUsd / totalValueUsd) * 100 : 0,
    }))
    const otherPercent = Math.max(0, 100 - top.reduce((sum, item) => sum + item.percent, 0))
    return otherPercent > 0.5 ? [...top, { label: "Other", percent: otherPercent }] : top
  }, [sortedByValue, totalValueUsd])
  const allocationLegendItems = allocationItems.map((item, index) => ({
    ...item,
    color: allocationColors[index] ?? allocationColors[allocationColors.length - 1],
  }))
  const allocationRingSegments =
    allocationLegendItems.length > 0
      ? allocationLegendItems.map((item) => ({
          color: item.color,
          value: item.percent / 100,
        }))
      : [{ color: uiTokens.reference.mint, value: 0.72 }]
  const latestAgentMessages = useMemo(
    () => buildTeamInsights(enrichedHoldings, totalValueUsd, advisorNewsSummary),
    [advisorNewsSummary, enrichedHoldings, totalValueUsd],
  )
  const forecastAgent = teamAgents[0]
  const forecastAvatar = getRandomAgentAvatar(forecastAgent.id)
  const forecastAgentName = forecastAgent.name as keyof typeof latestAgentMessages
  const forecastText =
    latestAgentMessages[forecastAgentName] ?? "Your agent team is monitoring the portfolio."
  const teamPreviewAgents = useMemo(() => teamAgents.slice(0, 4), [])
  const agentMessageFor = useCallback(
    (agentName: string) =>
      latestAgentMessages[agentName as keyof typeof latestAgentMessages] ??
      "Monitoring the portfolio.",
    [latestAgentMessages],
  )

  const snapTeamTo = useCallback(
    (expanded: boolean) => {
      const toValue = expanded ? expandedHeight : TEAM_COLLAPSED_HEIGHT
      setIsTeamExpanded(expanded)
      Animated.spring(sheetHeight, {
        toValue,
        useNativeDriver: false,
        bounciness: 0,
        speed: 18,
      }).start()
    },
    [expandedHeight, sheetHeight],
  )

  useEffect(() => {
    sheetHeight.setValue(isTeamExpanded ? expandedHeight : TEAM_COLLAPSED_HEIGHT)
  }, [expandedHeight, isTeamExpanded, sheetHeight])

  const headerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          sheetHeight.stopAnimation((value) => {
            dragStartHeightRef.current = value
          })
        },
        onPanResponderMove: (_, gestureState) => {
          const nextHeight = clamp(
            dragStartHeightRef.current - gestureState.dy,
            TEAM_COLLAPSED_HEIGHT,
            expandedHeight,
          )
          sheetHeight.setValue(nextHeight)
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentHeight = clamp(
            dragStartHeightRef.current - gestureState.dy,
            TEAM_COLLAPSED_HEIGHT,
            expandedHeight,
          )
          const shouldExpand =
            gestureState.vy < -0.2 || currentHeight > TEAM_COLLAPSED_HEIGHT + TEAM_SNAP_THRESHOLD

          snapTeamTo(shouldExpand)
        },
        onPanResponderTerminate: () => {
          snapTeamTo(isTeamExpanded)
        },
      }),
    [expandedHeight, isTeamExpanded, sheetHeight, snapTeamTo],
  )

  useEffect(() => {
    let active = true

    const run = async () => {
      const tickers = holdings
        .map((holding) => holding.ticker.trim().toUpperCase())
        .filter((ticker) => ticker.length > 0)

      if (tickers.length === 0) {
        if (active) setAdvisorNewsSummary("No current holdings yet.")
        return
      }

      const todayIso = formatLocalDateKey(new Date())
      const headlineRows = await Promise.all(
        tickers.slice(0, 4).map(async (ticker) => {
          const result = await api.getTickerNews(ticker, 3, 1)
          if (result.kind !== "ok") return `${ticker}: no fresh headline`
          const items = result.news.items
          const todayItem =
            items.find((item) => item.published_at.slice(0, 10) === todayIso) ?? items[0]
          return todayItem ? `${ticker}: ${shortHeadline(todayItem.title)}` : `${ticker}: quiet`
        }),
      )

      if (active) setAdvisorNewsSummary(headlineRows.join(" | "))
    }

    run()

    return () => {
      active = false
    }
  }, [holdings])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: uiTokens.reference.background }}>
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={$scrollContent}>
          <View className="px-5 pt-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-[#C8F2FF]">
                  <Text className="font-sans text-[20px] font-semibold text-[#19172A]">
                    {displayName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View className="ml-3">
                  <Text className="font-sans text-[18px] leading-[22px] text-[#19172A]">Hello</Text>
                  <Text className="font-sans text-[25px] font-semibold leading-[29px] text-[#19172A]">
                    {displayName}
                  </Text>
                </View>
              </View>
              <HeaderIconButton icon="notifications-outline" />
            </View>

            <View className="my-5 h-px bg-[#E5E7F4]" />

            <View className={showSideGainLoss ? "flex-row items-start" : ""}>
              <View
                className="relative h-[156px]"
                style={showSideGainLoss ? { flex: 1, marginRight: 12 } : { width: "100%" }}
              >
                <LinearGradient
                  colors={["#7061F4", "#5F4DE4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    bottom: 0,
                    left: 80,
                    overflow: "hidden",
                    paddingBottom: 18,
                    paddingLeft: 84,
                    paddingRight: 16,
                    paddingTop: 18,
                    position: "absolute",
                    right: 0,
                    top: 0,
                  }}
                >
                  {allocationLegendItems.length
                    ? allocationLegendItems.map((item, index) => (
                        <View
                          key={`${item.label}-${index}`}
                          className="mb-2.5 flex-row items-center"
                        >
                          <Text
                            className="mr-2 flex-1 font-sans text-[14px] font-semibold leading-[18px] text-white"
                            numberOfLines={1}
                          >
                            {item.label}
                          </Text>
                          <Text
                            className="min-w-[38px] text-right font-sans text-[13px] font-semibold"
                            style={{ color: item.color }}
                          >
                            {Math.round(item.percent)}%
                          </Text>
                        </View>
                      ))
                    : null}
                  {!allocationLegendItems.length ? (
                    <View className="flex-1 justify-center">
                      <View className="h-2.5 w-20 rounded-full bg-[#8F80FF]" />
                      <View className="mt-3 h-2.5 w-28 rounded-full bg-[#998BFF]" />
                      <View className="mt-3 h-2.5 w-16 rounded-full bg-[#A99EFF]" />
                    </View>
                  ) : null}
                </LinearGradient>

                <View
                  className="absolute left-0 top-[4px] h-[148px] w-[148px] items-center justify-center rounded-full bg-[#151433]"
                  style={$summaryDonutShadow}
                >
                  <ProgressRing
                    progress={allocationItems[0]?.percent ? allocationItems[0].percent / 100 : 0.68}
                    size={148}
                    strokeWidth={12}
                    color={uiTokens.reference.mint}
                    trackColor="#28254B"
                    segments={allocationRingSegments}
                  >
                    <Text
                      adjustsFontSizeToFit
                      className="max-w-[104px] font-sans text-[22px] font-semibold text-white"
                      minimumFontScale={0.72}
                      numberOfLines={1}
                    >
                      {isLoading && !hasLiveQuotes ? "--" : formatMoney(totalValueUsd, 2)}
                    </Text>
                    <Text className="mt-2 font-sans text-[13px] font-semibold leading-[17px] text-[#C9C6E8]">
                      Total investment
                    </Text>
                  </ProgressRing>
                </View>
              </View>

              {showSideGainLoss ? (
                <GainLossPanel gainValue={gainValue} lossValue={lossValue} vertical />
              ) : (
                <View className="mt-3 flex-row gap-3">
                  <GainLossPanel gainValue={gainValue} lossValue={lossValue} />
                </View>
              )}
            </View>

            <Text
              className={`mt-3 text-right font-sans text-[14px] font-semibold ${
                totalPnlUsd >= 0 ? "text-[#19B88F]" : "text-[#EF5B5B]"
              }`}
            >
              {signedMoney(totalPnlUsd)} ({signedPct(totalPnlPct)}) overall
            </Text>
          </View>

          {sortedByValue.length > 0 ? (
            <>
              <View className="mt-4">
                <View className="px-5">
                  <SectionHeader
                    title="My Investment"
                    actionLabel="View all"
                    onActionPress={() => router.push("/portfolio")}
                  />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={$horizontalCards}
                >
                  {sortedByValue.slice(0, 6).map((holding) => (
                    <InvestmentCard
                      key={holding.ticker}
                      ticker={holding.ticker}
                      name={holding.name}
                      logoUri={holding.logoUri}
                      value={formatMoney(holding.valueUsd, 2)}
                      changePercent={holding.changePercent}
                      chartValues={trendValuesForTicker(holding.ticker, holding.changePercent)}
                      onPress={() => router.push(`/holding/${holding.ticker}`)}
                    />
                  ))}
                </ScrollView>
              </View>

              <View className="mt-8 px-5">
                <SectionHeader
                  title="Top listed"
                  actionLabel="View all"
                  onActionPress={() => router.push("/portfolio")}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={$topListed}
                >
                  {sortedByValue.slice(0, 5).map((holding) => (
                    <Pressable
                      key={holding.ticker}
                      className="mr-4 min-w-[178px] rounded-[18px] bg-[#F1F0FF] px-4 py-4"
                      onPress={() => router.push(`/holding/${holding.ticker}`)}
                    >
                      <View className="flex-row items-center">
                        <TickerLogo ticker={holding.ticker} logoUri={holding.logoUri} size={38} />
                        <Text
                          className="ml-3 flex-1 font-sans text-[18px] font-semibold text-[#19172A]"
                          numberOfLines={1}
                        >
                          {holding.name}
                        </Text>
                      </View>
                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="font-sans text-[17px] font-semibold text-[#19172A]">
                          {formatMoney(holding.valueUsd, 0)}
                        </Text>
                        <Text
                          className={`font-sans text-[13px] font-semibold ${
                            holding.changePercent >= 0 ? "text-[#19B88F]" : "text-[#EF5B5B]"
                          }`}
                        >
                          {signedPct(holding.changePercent)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </>
          ) : null}

          <View className={`${sortedByValue.length > 0 ? "mt-7" : "mt-5"} px-5`}>
            <Pressable
              className="flex-row items-center overflow-hidden rounded-[24px] bg-[#F0F1FA] px-5 py-5"
              onPress={() => router.push(`/agent/${forecastAgent.id}`)}
            >
              <View className="flex-1 pr-4">
                <Text className="font-sans text-[24px] font-semibold text-[#19172A]">Forecast</Text>
                <Text className="mt-2 font-sans text-[15px] leading-[22px] text-[#3D3852]">
                  {forecastText}
                </Text>
                <Text className="mt-2 font-sans text-[14px] font-semibold text-[#6A4DF7]">
                  See more
                </Text>
              </View>
              <View
                className="h-[104px] w-[76px] items-center justify-end rounded-[22px] bg-[#171533]"
                style={{
                  shadowColor: uiTokens.reference.shadow,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.14,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <Image
                  source={forecastAvatar.image}
                  style={{ width: 74, height: 74, borderRadius: 999 }}
                  resizeMode="cover"
                />
              </View>
            </Pressable>
          </View>
        </ScrollView>

        <Animated.View
          className="absolute inset-x-0 bottom-0"
          style={[
            $teamSheetShadow,
            {
              height: sheetHeight,
            },
          ]}
        >
          <View
            className="flex-1 overflow-hidden rounded-t-[24px] bg-white px-4 pb-8 pt-2"
            style={$teamSheetContainer}
          >
            <View {...headerPanResponder.panHandlers}>
              <Pressable className="items-center pb-3" onPress={() => snapTeamTo(!isTeamExpanded)}>
                <View className="h-1.5 w-14 rounded-full bg-[#D9D8EA]" />
              </Pressable>

              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-sans text-[22px] font-semibold text-[#19172A]">
                    Investment analyst team
                  </Text>
                  {isTeamExpanded ? (
                    <Text className="mt-1 font-sans text-[14px] leading-5 text-[#77728D]">
                      Live coverage from each specialist, with faster scanning across updates.
                    </Text>
                  ) : (
                    <StackedAgentAvatars agents={teamPreviewAgents} />
                  )}
                </View>
                <View className="items-end">
                  <Text className="pt-1 font-sans text-[14px] font-medium text-[#77728D]">
                    {teamAgents.length} online
                  </Text>
                  <Pressable className="mt-2" onPress={() => snapTeamTo(!isTeamExpanded)}>
                    <Text className="font-sans text-[13px] font-semibold text-[#6A4DF7]">
                      {isTeamExpanded ? "View less" : "View full"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {isTeamExpanded ? (
              <View className="mt-5 min-h-0 flex-1">
                <ScrollView
                  bounces
                  className="flex-1"
                  contentContainerStyle={$teamContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {teamAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      recentMessage={agentMessageFor(agent.name)}
                      onPressMessage={() =>
                        setExpandedInsight({
                          agentName: agent.name,
                          role: agent.role,
                          text: agentMessageFor(agent.name),
                        })
                      }
                      onPress={() => router.push(`/agent/${agent.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Modal
          animationType="fade"
          transparent
          visible={expandedInsight !== null}
          onRequestClose={() => setExpandedInsight(null)}
        >
          <View className="flex-1 items-center justify-center bg-[#0F172855] px-5">
            <View className="max-h-[82%] w-full rounded-[26px] bg-white p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-sans text-[19px] font-semibold text-[#19172A]">
                    {expandedInsight?.agentName}
                  </Text>
                  <Text className="mt-1 font-sans text-[13px] text-[#77728D]">
                    {expandedInsight?.role}
                  </Text>
                </View>
                <Pressable
                  className="rounded-full bg-[#F1F0FF] px-3 py-1.5"
                  onPress={() => setExpandedInsight(null)}
                >
                  <Text className="font-sans text-[12px] font-semibold text-[#4C4765]">Close</Text>
                </Pressable>
              </View>

              <ScrollView className="mt-4">
                <Markdown style={teamMarkdownStyles}>{expandedInsight?.text ?? ""}</Markdown>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

function trendValuesForTicker(ticker: string, changePercent: number) {
  const seed = ticker.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const direction = changePercent >= 0 ? 1 : -1

  return Array.from({ length: 8 }, (_, index) => {
    const wave = Math.sin((seed + index * 17) / 9) * 8
    return 48 + wave + index * direction * 3
  })
}

function GainLossPanel({
  gainValue,
  lossValue,
  vertical = false,
}: {
  gainValue: number
  lossValue: number
  vertical?: boolean
}) {
  if (vertical) {
    return (
      <View className="h-[156px] w-[108px] rounded-[24px] bg-[#F0F0FF] px-4 py-4">
        <GainLossMetric icon="trending-up-outline" label="Gain" tone="gain" value={gainValue} />
        <View className="my-3 h-px bg-[#D5D2EA]" />
        <GainLossMetric icon="trending-down-outline" label="Loss" tone="loss" value={lossValue} />
      </View>
    )
  }

  return (
    <>
      <View className="min-w-0 flex-1 rounded-[20px] bg-[#F0F0FF] px-4 py-3">
        <GainLossMetric icon="trending-up-outline" label="Gain" tone="gain" value={gainValue} />
      </View>
      <View className="min-w-0 flex-1 rounded-[20px] bg-[#F0F0FF] px-4 py-3">
        <GainLossMetric icon="trending-down-outline" label="Loss" tone="loss" value={lossValue} />
      </View>
    </>
  )
}

function GainLossMetric({
  icon,
  label,
  tone,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  tone: "gain" | "loss"
  value: number
}) {
  const color = tone === "gain" ? uiTokens.reference.success : uiTokens.reference.danger

  return (
    <View>
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color={color} />
        <Text className="ml-1 font-sans text-[16px] font-semibold" style={{ color }}>
          {label}
        </Text>
      </View>
      <Text
        adjustsFontSizeToFit
        className="mt-2 font-sans text-[16px] font-semibold text-[#19172A]"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {formatMoney(value, 2)}
      </Text>
    </View>
  )
}

function AgentCard({
  agent,
  recentMessage,
  onPressMessage,
  onPress,
}: {
  agent: (typeof teamAgents)[number]
  recentMessage: string
  onPressMessage: () => void
  onPress: () => void
}) {
  const avatar = getRandomAgentAvatar(agent.id)

  return (
    <Pressable
      className="mb-3 rounded-[24px] border bg-white px-4 py-4"
      style={{ borderColor: uiTokens.reference.border }}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-center pr-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: avatar.palette.background }}
          >
            <Image
              source={avatar.image}
              style={{ width: 48, height: 48, borderRadius: 999 }}
              resizeMode="cover"
            />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-sans text-[20px] font-semibold text-[#19172A]">{agent.name}</Text>
            <Text className="mt-0.5 font-sans text-[15px] leading-5 text-[#77728D]">
              {agent.role}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center rounded-full bg-[#F1F0FF] px-2.5 py-1">
          <View className={`mr-1.5 h-2 w-2 rounded-full ${statusDotClassName(agent.status)}`} />
          <Text className="font-sans text-[11px] font-medium capitalize text-[#5F5B78]">
            {agent.status}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap items-center">
        <View className="mr-2 rounded-full bg-[#F7F7FF] px-2.5 py-1">
          <Text className="font-sans text-[12px] font-medium text-[#5F5B78]">
            {agent.specialty}
          </Text>
        </View>
        <Text className="mt-1 font-sans text-[13px] text-[#77728D]">{agent.lastUpdate}</Text>
      </View>

      <Pressable
        className="mt-4 rounded-[20px] rounded-tl-[8px] bg-[#F4F3FF] px-4 py-4"
        onPress={onPressMessage}
      >
        <View className="max-h-[126px] overflow-hidden">
          <Markdown style={teamMarkdownStyles}>{recentMessage}</Markdown>
        </View>
      </Pressable>

      <Text className="mt-4 font-sans text-[13px] leading-5 text-[#6B667F]">{agent.coverage}</Text>
    </Pressable>
  )
}

function StackedAgentAvatars({ agents }: { agents: (typeof teamAgents)[number][] }) {
  return (
    <View className="mt-4 flex-row items-center">
      {agents.map((agent, index) => {
        const avatar = getRandomAgentAvatar(agent.id)

        return (
          <View
            key={agent.id}
            className={`h-11 w-11 items-center justify-center rounded-full border-2 border-[#F7F8FF] ${
              index === 0 ? "" : "-ml-3"
            }`}
            style={{ backgroundColor: avatar.palette.background, zIndex: agents.length - index }}
          >
            <Image
              source={avatar.image}
              style={{ width: 44, height: 44, borderRadius: 999 }}
              resizeMode="cover"
            />
          </View>
        )
      })}
    </View>
  )
}

function statusDotClassName(status: (typeof teamAgents)[number]["status"]) {
  switch (status) {
    case "active":
      return "bg-[#19B88F]"
    case "monitoring":
      return "bg-[#F58A24]"
    default:
      return "bg-[#9CA3AF]"
  }
}

const teamMarkdownStyles = {
  body: {
    color: "#4C4765",
    fontSize: 15,
    lineHeight: 24,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
    color: "#4C4765",
    fontSize: 15,
    lineHeight: 24,
  },
  strong: {
    color: "#19172A",
    fontWeight: "700" as const,
  },
  bullet_list: {
    marginTop: 2,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 2,
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: "#F1F0FF",
    color: "#4C3FE6",
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: "#D9D7F7",
    paddingLeft: 10,
    marginTop: 2,
    marginBottom: 8,
  },
}

const $scrollContent = {
  paddingBottom: 260,
}

const $horizontalCards = {
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 14,
}

const $topListed = {
  paddingTop: 14,
  paddingRight: 4,
}

const $summaryDonutShadow = {
  shadowColor: "#151433",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.18,
  shadowRadius: 18,
  elevation: 8,
}

const $teamContent = {
  paddingBottom: 120,
}

const $teamSheetContainer = {
  borderColor: uiTokens.reference.border,
  borderTopWidth: 1,
}

const $teamSheetShadow = {
  shadowColor: "#3A3560",
  shadowOffset: { width: 0, height: -10 },
  shadowOpacity: 0.14,
  shadowRadius: 24,
  elevation: 20,
}
