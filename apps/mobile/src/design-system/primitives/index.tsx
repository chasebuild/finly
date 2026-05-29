import type { ComponentProps } from "react"
import { Button, Card, Paragraph, SizableText, XStack, YStack, type ButtonProps } from "tamagui"

export const DsStack = YStack
export const DsRow = XStack
export const DsCard = Card

export function DsTitle(props: ComponentProps<typeof SizableText>) {
  return <SizableText size="$7" fontWeight="700" {...props} />
}

export function DsBody(props: ComponentProps<typeof Paragraph>) {
  return <Paragraph size="$4" {...props} />
}

export function DsButton(props: ButtonProps) {
  return <Button borderRadius="$4" {...props} />
}
