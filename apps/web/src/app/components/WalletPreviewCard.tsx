import { Circle, Flex, Text, Unicon, useUniconColors } from 'ui/src'
import { CheckmarkIcon } from 'ui/src/assets/icons/CheckmarkIcon'
import { iconSizes, validToken } from 'ui/src/theme'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { shortenAddress } from 'wallet/src/utils/addresses'

interface Props {
  address: string
  selected: boolean
  balance?: number | null
  onSelect: (address: string) => void
  hideSelectionCircle?: boolean
}

export const ADDRESS_WRAPPER_HEIGHT = 36
const UNICON_SIZE = iconSizes.icon40

export default function WalletPreviewCard({
  address,
  selected,
  balance,
  onSelect,
  hideSelectionCircle,
  ...rest
}: Props): JSX.Element {
  const unselectedBorderColor = '$surface3'

  const { gradientStart } = useUniconColors(address)

  return (
    <Flex
      alignItems="center"
      borderColor={validToken(selected ? gradientStart : unselectedBorderColor)}
      borderRadius="$rounded20"
      borderWidth={2}
      cursor="pointer"
      px="$spacing16"
      py="$spacing16"
      width="100%"
      onPress={(): void => onSelect(address)}
      {...rest}>
      <Flex
        row
        alignItems="center"
        gap="$spacing12"
        height={ADDRESS_WRAPPER_HEIGHT}
        justifyContent="space-between"
        width="100%">
        <Flex centered row gap="$spacing12">
          <Unicon address={address} size={UNICON_SIZE} />
          <Flex>
            <Text variant="subheading1">{shortenAddress(address)}</Text>
            {balance ? (
              <Text color="$neutral2" variant="body2">
                {formatUSDPrice(balance, NumberType.FiatTokenQuantity)}
              </Text>
            ) : null}
          </Flex>
        </Flex>
        {!hideSelectionCircle ? (
          selected ? (
            <CheckmarkIcon color={gradientStart} />
          ) : (
            <Circle borderColor="$surface3" borderWidth={2} size={iconSizes.icon20} />
          )
        ) : null}
      </Flex>
    </Flex>
  )
}