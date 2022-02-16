import React from 'react'
import {useSelector} from 'react-redux'

import {Banner} from '../../../legacy/components/UiKit'
import {isFetchingUtxosSelector, tokenBalanceSelector} from '../../../legacy/selectors'
import {formatTokenWithText} from '../../../legacy/utils/format'
import {useTokenInfo} from '../../hooks'
import {useSelectedWallet} from '../../SelectedWallet'
import {useStrings} from './strings'

export const AvailableAmountBanner = () => {
  const strings = useStrings()
  const tokenBalance = useSelector(tokenBalanceSelector)
  const isFetchingBalance = useSelector(isFetchingUtxosSelector)
  const wallet = useSelectedWallet()
  const tokenInfo = useTokenInfo({wallet, tokenId: tokenBalance.getDefaultId()})

  return (
    <Banner
      label={strings.availableFunds}
      text={
        isFetchingBalance
          ? strings.availableFundsBannerIsFetching
          : tokenBalance
          ? formatTokenWithText(tokenBalance.getDefault(), tokenInfo)
          : strings.availableFundsBannerNotAvailable
      }
      boldText
    />
  )
}