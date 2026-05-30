/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-restricted-imports */
import { useMemo, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { HoldingRow } from "@/components/HoldingRow"
import {
  HeaderIconButton,
  ProgressRing,
  SectionHeader,
  Sparkline,
} from "@/components/ReferenceFinanceWidgets"
import { TickerLogo } from "@/components/TickerLogo"
import { useMarketData } from "@/services/marketData"
import { useAgentBoardStore } from "@/stores/agentBoardStore"
import { uiTokens } from "@/theme/uiTokens"
import { useSelectedPortfolioData } from "@/utils/selectedPortfolio"
import { getTickerLogoUri } from "@/utils/tickerLogo"

const BORDER = uiTokens.reference.border

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)

const moneyWithCents = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const signedPct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
const roundToCents = (value: number) => Math.round(value * 100) / 100

const sortLabels = {
  value: "Value",
  alphabet: "A-Z",
  holdings: "Share Size",
} as const

type HoldingsSort = keyof typeof sortLabels
type AssetTab = "assets" | "watchlist"
type RangeTab = "1D" | "1W" | "1M" | "1Y"

export default function PortfolioTab() {
  const router = useRouter()
  const [assetTab, setAssetTab] = useState<AssetTab>("assets")
  const [sortBy, setSortBy] = useState<HoldingsSort>("value")
  const [rangeTab, setRangeTab] = useState<RangeTab>("1W")
  const { holdings } = useSelectedPortfolioData()
  const boardThreads = useAgentBoardStore((state) => state.threads)
  const { quotes, lastUpdatedAt } = useMarketData(holdings.map((holding) => holding.ticker))

  const enrichedHoldings = useMemo(() => {
    const withLiveValues = holdings.map((holding) => {
      const liveQuote = quotes[holding.ticker]
      const valueUsd = liveQuote
        ? roundToCents(liveQuote.price * holding.shares)
        : roundToCents(holding.valueUsd)
      return {
        ...holding,
        valueUsd,
        changePercent: liveQuote?.change_pct ?? holding.changePercent,
      }
    })
    const totalValue = withLiveValues.reduce((sum, holding) => sum + holding.valueUsd, 0)
    if (totalValue <= 0) {
      return withLiveValues.map((holding) => ({ ...holding, allocationPercent: 0 }))
    }

    return withLiveValues.map((holding) => ({
      ...holding,
      allocationPercent: (holding.valueUsd / totalValue) * 100,
    }))
  }, [holdings, quotes])
  const totalValueUsd = useMemo(
    () => enrichedHoldings.reduce((sum, holding) => sum + holding.valueUsd, 0),
    [enrichedHoldings],
  )
  const sortedHoldings = useMemo(() => {
    const nextHoldings = [...enrichedHoldings]

    switch (sortBy) {
      case "alphabet":
        return nextHoldings.sort((left, right) => left.ticker.localeCompare(right.ticker))
      case "holdings":
        return nextHoldings.sort((left, right) => right.shares - left.shares)
      case "value":
      default:
        return nextHoldings.sort((left, right) => right.valueUsd - left.valueUsd)
    }
  }, [enrichedHoldings, sortBy])
  const featuredHolding = sortedHoldings[0]
  const compareHoldings = sortedHoldings.slice(0, 2)
  const chartValues = useMemo(
    () => portfolioChartValues(totalValueUsd, rangeTab),
    [rangeTab, totalValueUsd],
  )
  const watchlistRows = useMemo(() => {
    const heldTickers = new Set(enrichedHoldings.map((holding) => holding.ticker))
    const latestThreadByTicker = new Map<
      string,
      {
        id: string
        ticker: string
        summary: string
        updatedAt: string
      }
    >()

    boardThreads.forEach((thread) => {
      if (thread.ticker === "BOARD" || heldTickers.has(thread.ticker)) return

      const current = latestThreadByTicker.get(thread.ticker)
      const nextTimestamp = new Date(thread.updatedAt).getTime()
      const currentTimestamp = current
        ? new Date(current.updatedAt).getTime()
        : Number.NEGATIVE_INFINITY

      if (!current || nextTimestamp >= currentTimestamp) {
        latestThreadByTicker.set(thread.ticker, {
          id: thread.id,
          ticker: thread.ticker,
          summary: thread.summary || thread.intake || "Board conversation available",
          updatedAt: thread.updatedAt,
        })
      }
    })

    return Array.from(latestThreadByTicker.values())
      .map((item) => {
        const liveQuote = quotes[item.ticker]
        return {
          ...item,
          valueUsd: liveQuote?.price ?? null,
          changePercent: liveQuote?.change_pct ?? null,
        }
      })
      .sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )
  }, [boardThreads, enrichedHoldings, quotes])

  const handleOpenTickerDetail = (ticker: string) => {
    router.push(`/holding/${ticker.trim().toUpperCase()}`)
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: uiTokens.reference.background }}>
      <ScrollView className="flex-1" contentContainerStyle={$scrollContent}>
        <View className="px-5 pt-3">
          <View className="flex-row items-center justify-between">
            <HeaderIconButton
              icon="arrow-back-outline"
              onPress={() => {
                if (router.canGoBack()) router.back()
              }}
            />
            <Text className="font-sans text-[23px] font-semibold text-[#19172A]">
              Portfolio Details
            </Text>
            <HeaderIconButton icon="notifications-outline" />
          </View>

          <View className="my-5 h-px bg-[#E5E7F4]" />

          <LinearGradient
            colors={["#765DFF", "#654CF0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              shadowColor: uiTokens.reference.shadow,
              shadowOffset: { width: 18, height: 0 },
              shadowOpacity: 0.14,
              shadowRadius: 0,
            }}
          >
            {featuredHolding ? (
              <View className="flex-row items-center">
                <ProgressRing
                  progress={featuredHolding.allocationPercent / 100}
                  size={128}
                  strokeWidth={10}
                  color={uiTokens.reference.mint}
                  trackColor="#7E6BFF"
                >
                  <Text className="font-sans text-[23px] font-semibold text-white">
                    {Math.round(featuredHolding.allocationPercent)}%
                  </Text>
                  <Text className="mt-1 font-sans text-[15px] text-[#DDD9FF]">Investment</Text>
                </ProgressRing>
                <View className="ml-5 flex-1">
                  <View className="flex-row items-center">
                    <TickerLogo
                      ticker={featuredHolding.ticker}
                      logoUri={featuredHolding.logoUri}
                      size={30}
                    />
                    <Text className="ml-2 font-sans text-[22px] font-semibold text-white">
                      {featuredHolding.name}
                    </Text>
                  </View>
                  <Text className="mt-4 font-sans text-[25px] font-semibold text-white">
                    {moneyWithCents(featuredHolding.valueUsd)}
                  </Text>
                  <Text
                    className={`mt-3 font-sans text-[18px] font-semibold ${
                      featuredHolding.changePercent >= 0 ? "text-[#66F0B3]" : "text-[#FFD0D0]"
                    }`}
                  >
                    ({signedPct(featuredHolding.changePercent)})
                  </Text>
                </View>
              </View>
            ) : (
              <Text className="font-sans text-[18px] font-semibold text-white">
                Import a portfolio to see details.
              </Text>
            )}
          </LinearGradient>

          <View className="mt-6">
            <SectionHeader title="Analytics" />
            <View
              className="mt-4 rounded-[12px] border bg-white px-4 pb-5 pt-4"
              style={{ borderColor: BORDER }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-2">
                  {(["1D", "1W", "1M", "1Y"] as const).map((item) => (
                    <RangeButton
                      key={item}
                      active={rangeTab === item}
                      label={item}
                      onPress={() => setRangeTab(item)}
                    />
                  ))}
                </View>
                <Text className="font-sans text-[16px] font-semibold text-[#6A4DF7]">View all</Text>
              </View>

              <View className="mt-5 h-[246px] overflow-hidden">
                <View className="flex-1 flex-row">
                  <View className="min-w-0 flex-1 pr-3">
                    <View className="absolute bottom-[46px] left-2 right-3 top-2">
                      {[0, 1, 2, 3].map((line) => (
                        <View
                          key={line}
                          className="absolute left-0 right-0 h-px bg-[#E7E8F2]"
                          style={{ top: line * 46 }}
                        />
                      ))}
                    </View>
                    <View className="mt-12">
                      <Sparkline
                        values={chartValues}
                        width={260}
                        height={128}
                        color="#3B8DE8"
                        fillColor="#EAF4FF"
                        strokeWidth={3}
                      />
                    </View>
                    <View className="absolute bottom-0 left-0 right-3 flex-row justify-between">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                        <Text
                          key={label}
                          className={`font-sans text-[16px] ${
                            label === "Thu" ? "font-semibold text-[#2477E8]" : "text-[#7B7B83]"
                          }`}
                        >
                          {label}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <View className="w-[62px] items-end">
                    {["$1000", "$700", "$500", "$300", "$100"].map((label) => (
                      <Text key={label} className="mb-[25px] font-sans text-[16px] text-[#68657B]">
                        {label}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-8 rounded-[22px] bg-[#151433] px-5 py-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-sans text-[29px] font-semibold text-white">Compare</Text>
                <Text className="mt-1 font-sans text-[17px] text-[#D7D3EC]">analyses</Text>
              </View>
              <View className="flex-1 px-5">
                {compareHoldings.map((holding) => (
                  <View key={holding.ticker} className="mb-3 flex-row items-center last:mb-0">
                    <TickerLogo ticker={holding.ticker} logoUri={holding.logoUri} size={28} />
                    <Text
                      className="ml-2 font-sans text-[19px] font-semibold text-white"
                      numberOfLines={1}
                    >
                      {holding.name}
                    </Text>
                  </View>
                ))}
              </View>
              <Pressable
                className="h-[74px] w-[74px] items-center justify-center rounded-full bg-[#6C55FF]"
                onPress={() => router.push("/board")}
              >
                <Text className="font-sans text-[24px] font-semibold text-white">AI</Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-8">
            <View className="mb-3 flex-row gap-2">
              <SegmentTab
                active={assetTab === "assets"}
                label="Assets"
                onPress={() => setAssetTab("assets")}
              />
              <SegmentTab
                active={assetTab === "watchlist"}
                label="Watchlist"
                onPress={() => setAssetTab("watchlist")}
              />
            </View>

            <View className="rounded-[22px] border bg-white p-4" style={{ borderColor: BORDER }}>
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-[24px] font-semibold text-[#19172A]">
                  {assetTab === "assets" ? "Assets" : "Watchlist"}
                </Text>
                <Text className="font-sans text-[12px] text-[#77728D]">
                  {formatLastRefresh(lastUpdatedAt)}
                </Text>
              </View>

              {assetTab === "assets" ? (
                sortedHoldings.length === 0 ? (
                  <EmptyCard
                    title="No assets yet"
                    body="Your assets will appear here once added."
                  />
                ) : (
                  <>
                    <View className="mt-4 flex-row flex-wrap gap-2">
                      <SortButton
                        active={sortBy === "value"}
                        label={sortLabels.value}
                        onPress={() => setSortBy("value")}
                      />
                      <SortButton
                        active={sortBy === "alphabet"}
                        label={sortLabels.alphabet}
                        onPress={() => setSortBy("alphabet")}
                      />
                      <SortButton
                        active={sortBy === "holdings"}
                        label={sortLabels.holdings}
                        onPress={() => setSortBy("holdings")}
                      />
                    </View>

                    <View className="mt-2">
                      {sortedHoldings.map((holding) => (
                        <HoldingRow
                          key={holding.ticker}
                          name={holding.name}
                          logoUri={holding.logoUri}
                          ticker={holding.ticker}
                          shares={holding.shares}
                          value={money(holding.valueUsd)}
                          allocationPercent={holding.allocationPercent}
                          changePercent={holding.changePercent}
                          onPress={() => handleOpenTickerDetail(holding.ticker)}
                          borderColor={BORDER}
                        />
                      ))}
                    </View>
                  </>
                )
              ) : watchlistRows.length === 0 ? (
                <EmptyCard
                  title="No watchlist names yet"
                  body="Search stocks in Board. New reports for symbols you do not hold will appear here."
                />
              ) : (
                watchlistRows.map((item) => (
                  <Pressable
                    key={item.ticker}
                    className="border-b py-4 last:border-b-0"
                    style={{ borderColor: BORDER }}
                    onPress={() => router.push(`/watchlist/${item.ticker}`)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <TickerLogo ticker={item.ticker} logoUri={getTickerLogoUri(item.ticker)} />
                        <View className="ml-3">
                          <Text className="font-sans text-[20px] font-semibold text-[#19172A]">
                            {item.ticker}
                          </Text>
                          <Text className="font-sans text-[15px] text-[#77728D]">Watchlist</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="font-sans text-[20px] font-semibold text-[#19172A]">
                          {item.valueUsd === null ? "--" : money(item.valueUsd)}
                        </Text>
                        <Text
                          className={`font-sans text-[15px] ${
                            item.changePercent === null
                              ? "text-[#77728D]"
                              : item.changePercent >= 0
                                ? "text-[#19B88F]"
                                : "text-[#EF5B5B]"
                          }`}
                        >
                          {item.changePercent === null
                            ? "No live quote"
                            : signedPct(item.changePercent)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="mt-3 font-sans text-[14px] leading-5 text-[#77728D]"
                      numberOfLines={2}
                    >
                      {item.summary}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function RangeButton({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      className={`h-12 w-12 items-center justify-center rounded-full ${
        active ? "bg-[#6C55FF]" : "bg-[#F8F8FD]"
      }`}
      onPress={onPress}
    >
      <Text
        className={`font-sans text-[16px] font-semibold ${active ? "text-white" : "text-[#19172A]"}`}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function SortButton({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      className={`rounded-full border px-4 py-2 ${
        active ? "border-[#6C55FF] bg-[#6C55FF]" : "border-[#E2E4F3] bg-[#F7F8FF]"
      }`}
      onPress={onPress}
    >
      <Text
        className={`font-sans text-[14px] font-semibold ${active ? "text-white" : "text-[#77728D]"}`}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function SegmentTab({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      className={`rounded-full border px-4 py-2 ${
        active ? "border-[#6C55FF] bg-[#6C55FF]" : "border-[#E2E4F3] bg-white"
      }`}
      onPress={onPress}
    >
      <Text
        className={`font-sans text-[13px] font-semibold ${active ? "text-white" : "text-[#77728D]"}`}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <View className="mt-4 rounded-[18px] bg-[#F3F3FF] p-4">
      <Text className="font-sans text-[16px] font-semibold text-[#19172A]">{title}</Text>
      <Text className="mt-1 font-sans text-[14px] leading-6 text-[#77728D]">{body}</Text>
    </View>
  )
}

function portfolioChartValues(totalValueUsd: number, rangeTab: RangeTab) {
  const base = Math.max(totalValueUsd, 1000)
  const rangeOffset =
    rangeTab === "1D" ? 0.97 : rangeTab === "1W" ? 0.9 : rangeTab === "1M" ? 0.82 : 0.7
  return [0.72, 0.78, 0.69, 0.86, 0.81, 0.95, 0.88, 0.84, 0.9, 1].map(
    (point, index) => base * (rangeOffset + point * 0.18 + index * 0.002),
  )
}

function formatLastRefresh(timestamp: number | null) {
  if (!timestamp) return "No refresh"
  const date = new Date(timestamp)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

const $scrollContent = {
  paddingBottom: 128,
}
