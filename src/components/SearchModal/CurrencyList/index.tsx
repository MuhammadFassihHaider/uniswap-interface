import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import Loader from 'components/Icons/LoadingSpinner'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { checkWarning } from 'constants/tokenSafety'
import { TokenBalances } from 'lib/hooks/useTokenList/sorting'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { useIsUserAddedToken } from '../../../hooks/Tokens'
import { TokenFromList } from '../../../state/lists/tokenFromList'
import Column, { AutoColumn } from '../../Column'
import CurrencyLogo from '../../Logo/CurrencyLogo'
import Row, { RowFixed } from '../../Row'
import { MouseoverTooltip } from '../../Tooltip'
import { LoadingRows, MenuItem } from '../styled'
import { scrollbarStyle } from './index.css'

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const CurrencyName = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  border-radius: 4px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

const WarningContainer = styled.div`
  margin-left: 0.3em;
`

function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  const { formatNumberOrString } = useFormatter()

  return (
    <StyledBalanceText title={balance.toExact()}>
      {formatNumberOrString({
        input: balance.toExact(),
        type: NumberType.TokenNonTx,
      })}
    </StyledBalanceText>
  )
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof TokenFromList)) {
    return null
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

export function CurrencyRow({
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
  eventProperties,
  balance,
}: {
  currency: Currency
  onSelect: (hasWarning: boolean) => void
  isSelected: boolean
  otherSelected: boolean
  style?: CSSProperties
  showCurrencyAmount?: boolean
  eventProperties: Record<string, unknown>
  balance?: CurrencyAmount<Currency>
}) {
  console.log({ currency })
  const { account } = useWeb3React()
  const key = currencyKey(currency)
  const customAdded = useIsUserAddedToken(currency)
  const warning = currency.isNative ? null : checkWarning(currency.address)
  const isBlockedToken = !!warning && !warning.canProceed
  const blockedTokenOpacity = '0.6'
  const { data } = useCachedPortfolioBalancesQuery({ account })
  const portfolioBalanceUsd = data?.portfolios?.[0].tokensTotalDenominatedValue?.value
  console.log({ currency })

  // only show add or remove buttons if not on selected list
  return (
    <TraceEvent
      events={[BrowserEvent.onClick, BrowserEvent.onKeyPress]}
      name={InterfaceEventName.TOKEN_SELECTED}
      properties={{ is_imported_by_user: customAdded, ...eventProperties, total_balances_usd: portfolioBalanceUsd }}
      element={InterfaceElementName.TOKEN_SELECTOR_ROW}
    >
      <MenuItem
        tabIndex={0}
        style={style}
        className={`token-item-${key}`}
        onKeyPress={(e) => (!isSelected && e.key === 'Enter' ? onSelect(!!warning) : null)}
        onClick={() => (isSelected ? null : onSelect(!!warning))}
        disabled={isSelected}
        selected={otherSelected}
        dim={isBlockedToken}
      >
        <Column>
          <CurrencyLogo
            currency={currency}
            size="36px"
            style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }}
          />
        </Column>
        <AutoColumn style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }}>
          <Row>
            <CurrencyName title={currency.name}>{currency.name}</CurrencyName>
            <WarningContainer>
              <TokenSafetyIcon warning={warning} />
            </WarningContainer>
          </Row>
          <ThemedText.LabelMicro ml="0px">{currency.symbol} ABC</ThemedText.LabelMicro>
        </AutoColumn>
        <Column>
          <RowFixed style={{ justifySelf: 'flex-end' }}>
            <TokenTags currency={currency} />
          </RowFixed>
        </Column>
        {showCurrencyAmount && (
          <RowFixed style={{ justifySelf: 'flex-end' }}>
            {account ? balance ? <Balance balance={balance} /> : <Loader /> : null}
          </RowFixed>
        )}
      </MenuItem>
    </TraceEvent>
  )
}

interface TokenRowProps {
  data: Array<Currency>
  index: number
  style: CSSProperties
}

export const formatAnalyticsEventProperties = (
  token: Token,
  index: number,
  data: any[],
  searchQuery: string,
  isAddressSearch: string | false
) => ({
  token_symbol: token?.symbol,
  token_address: token?.address,
  is_suggested_token: false,
  is_selected_from_list: true,
  scroll_position: '',
  token_list_index: index,
  token_list_length: data.length,
  ...(isAddressSearch === false
    ? { search_token_symbol_input: searchQuery }
    : { search_token_address_input: isAddressSearch }),
})

const LoadingRow = () => (
  <LoadingRows data-testid="loading-rows">
    <div />
    <div />
    <div />
  </LoadingRows>
)

export default function CurrencyList({
  height,
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showCurrencyAmount,
  isLoading,
  searchQuery,
  isAddressSearch,
  balances,
}: {
  height: number
  currencies: Currency[]
  otherListTokens?: TokenFromList[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showCurrencyAmount?: boolean
  isLoading: boolean
  searchQuery: string
  isAddressSearch: string | false
  balances: TokenBalances
}) {
  const itemData: Currency[] = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      return [...currencies, ...otherListTokens]
    }
    return currencies
  }, [currencies, otherListTokens])

  const Row = useCallback(
    function TokenRow({ data, index, style }: TokenRowProps) {
      const row: Currency = data[index]

      const currency = row

      const balance =
        tryParseCurrencyAmount(
          String(balances[currency.isNative ? 'ETH' : currency.address?.toLowerCase()]?.balance ?? 0),
          currency
        ) ?? CurrencyAmount.fromRawAmount(currency, 0)

      const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
      const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
      const handleSelect = (hasWarning: boolean) => currency && onCurrencySelect(currency, hasWarning)

      const token = currency?.wrapped

      if (isLoading) {
        return LoadingRow()
      } else if (currency) {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            showCurrencyAmount={showCurrencyAmount}
            eventProperties={formatAnalyticsEventProperties(token, index, data, searchQuery, isAddressSearch)}
            balance={balance}
          />
        )
      } else {
        return null
      }
    },
    [
      selectedCurrency,
      otherCurrency,
      isLoading,
      onCurrencySelect,
      showCurrencyAmount,
      searchQuery,
      isAddressSearch,
      balances,
    ]
  )

  const itemKey = useCallback((index: number, data: typeof itemData) => {
    const currency = data[index]
    return currencyKey(currency)
  }, [])

  return (
    <div data-testid="currency-list-wrapper">
      {isLoading ? (
        <FixedSizeList
          className={scrollbarStyle}
          height={height}
          ref={fixedListRef as any}
          width="100%"
          itemData={[]}
          itemCount={10}
          itemSize={56}
        >
          {LoadingRow}
        </FixedSizeList>
      ) : (
        <FixedSizeList
          className={scrollbarStyle}
          height={height}
          ref={fixedListRef as any}
          width="100%"
          itemData={itemData}
          itemCount={itemData.length}
          itemSize={56}
          itemKey={itemKey}
        >
          {Row}
        </FixedSizeList>
      )}
    </div>
  )
}
