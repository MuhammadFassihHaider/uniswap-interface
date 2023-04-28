import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { usePwatNewContractEnabled } from 'featureFlags/flags/pwatNewContract'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { useCallback, useMemo, useState } from 'react'
import invariant from 'tiny-invariant'

const DEPRECATED_NFT_UNIVERSAL_ROUTER_MAINNET_ADDRESS = '0x4c60051384bd2d3c01bfc845cf5f4b44bcbe9de5'
const NFT_UNIVERSAL_ROUTER_MAINNET_ADDRESS = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'

export default function usePermit2Approval(
  amount?: CurrencyAmount<Token>,
  maximumAmount?: CurrencyAmount<Token>,
  enabled?: boolean,
  shouldUseNftRouter?: boolean
) {
  const { chainId } = useWeb3React()
  const shouldUseUpdatedContract = usePwatNewContractEnabled()

  const canPermit = enabled && chainId
  let contractToApprove: string | undefined

  if (canPermit) {
    const forceNftRouter = shouldUseNftRouter && chainId === 1
    const mainnetContractToApprove = shouldUseUpdatedContract
      ? NFT_UNIVERSAL_ROUTER_MAINNET_ADDRESS
      : DEPRECATED_NFT_UNIVERSAL_ROUTER_MAINNET_ADDRESS
    contractToApprove = forceNftRouter ? mainnetContractToApprove : UNIVERSAL_ROUTER_ADDRESS(chainId)
  }

  const allowance = usePermit2Allowance(
    enabled ? maximumAmount ?? (amount?.currency.isToken ? (amount as CurrencyAmount<Token>) : undefined) : undefined,
    contractToApprove
  )
  const isApprovalLoading = allowance.state === AllowanceState.REQUIRED && allowance.isApprovalLoading
  const [isAllowancePending, setIsAllowancePending] = useState(false)
  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    setIsAllowancePending(true)
    try {
      await allowance.approveAndPermit()
      sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
        chain_id: chainId,
        token_symbol: maximumAmount?.currency.symbol,
        token_address: maximumAmount?.currency.address,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsAllowancePending(false)
    }
  }, [allowance, chainId, maximumAmount?.currency.address, maximumAmount?.currency.symbol])

  return useMemo(() => {
    return {
      allowance,
      isApprovalLoading,
      isAllowancePending,
      updateAllowance,
    }
  }, [allowance, isAllowancePending, isApprovalLoading, updateAllowance])
}
