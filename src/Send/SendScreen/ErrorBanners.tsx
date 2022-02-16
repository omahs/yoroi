import React from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {fetchUTXOs} from '../../../legacy/actions/utxo'
import {Banner, OfflineBanner} from '../../../legacy/components/UiKit'
import {
  hasPendingOutgoingTransactionSelector,
  isFetchingUtxosSelector,
  isOnlineSelector,
  lastUtxosFetchErrorSelector,
} from '../../../legacy/selectors'
import {useStrings} from './strings'

export const ErrorBanners = () => {
  const strings = useStrings()
  const isOnline = useSelector(isOnlineSelector)
  const hasPendingOutgoingTransaction = useSelector(hasPendingOutgoingTransactionSelector)
  const lastFetchingError = useSelector(lastUtxosFetchErrorSelector)
  const isFetchingBalance = useSelector(isFetchingUtxosSelector)
  const dispatch = useDispatch()

  if (!isOnline) {
    return <OfflineBanner />
  } else if (lastFetchingError && !isFetchingBalance) {
    return <Banner error onPress={() => dispatch(fetchUTXOs())} text={strings.errorBannerNetworkError} />
  } else if (hasPendingOutgoingTransaction) {
    return <Banner error text={strings.errorBannerPendingOutgoingTransaction} />
  } else {
    return null
  }
}