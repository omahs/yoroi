/* eslint-disable @typescript-eslint/no-explicit-any */
import {useNavigation} from '@react-navigation/native'
import {BigNumber} from 'bignumber.js'
import _ from 'lodash'
import React from 'react'
import {defineMessages, MessageDescriptor, useIntl} from 'react-intl'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {useSelector} from 'react-redux'

import {Text} from '../../components'
import {Icon} from '../../components/Icon'
import {getDefaultAssetByNetworkId} from '../../legacy/config'
import {
  ASSET_DENOMINATION,
  formatTimeToSeconds,
  formatTokenFractional,
  formatTokenInteger,
  getAssetDenominationOrId,
} from '../../legacy/format'
import {
  availableAssetsSelector,
  externalAddressIndexSelector,
  internalAddressIndexSelector,
} from '../../legacy/selectors'
import utfSymbols from '../../legacy/utfSymbols'
import {isEmptyString} from '../../legacy/utils'
import {TxHistoryRouteNavigation} from '../../navigation'
import {useSelectedWallet} from '../../SelectedWallet'
import {COLORS} from '../../theme'
import {MultiToken} from '../../yoroi-wallets'
import {
  DefaultAsset,
  IOData,
  TransactionAssurance,
  TransactionDirection,
  TransactionInfo,
} from '../../yoroi-wallets/types'

const filtersTxIO = (address: string) => {
  const isMyReceive = (extAddrIdx) => extAddrIdx[address] != null
  const isMyChange = (intAddrIdx) => intAddrIdx[address] != null
  const isMyAddress = (extAddrIdx, intAddrIdx) => isMyReceive(extAddrIdx) || isMyChange(intAddrIdx)
  return {
    isMyReceive,
    isMyChange,
    isMyAddress,
  }
}

const getTxIOMyWallet = (txIO: Array<IOData>, extAddrIdx, intAddrIdx) => {
  const io = _.uniq(txIO).map(({address, assets}) => ({
    address,
    assets,
  }))
  const filtered = io.filter(({address}) => filtersTxIO(address).isMyAddress(extAddrIdx, intAddrIdx))
  return filtered ?? []
}

type Props = {
  transaction: TransactionInfo
}

export const TxHistoryListItem = ({transaction}: Props) => {
  const strings = useStrings()
  const navigation = useNavigation<TxHistoryRouteNavigation>()

  const wallet = useSelectedWallet()

  const showDetails = () => navigation.navigate('history-details', {id: transaction.id})
  const submittedAt = formatTimeToSeconds(transaction.submittedAt)

  const isPending = transaction.assurance === 'PENDING'
  const isReceived = transaction.direction === 'RECEIVED'

  const rootBgColor = bgColorByAssurance(transaction.assurance)

  const availableAssets = useSelector(availableAssetsSelector)
  const internalAddressIndex = useSelector(internalAddressIndexSelector)
  const externalAddressIndex = useSelector(externalAddressIndexSelector)

  const fee = transaction.fee ? transaction.fee[0] : null
  const amountAsMT = MultiToken.fromArray(transaction.amount)
  const amount: BigNumber = amountAsMT.getDefault()
  const amountDefaultAsset = availableAssets[amountAsMT.getDefaultId()] as DefaultAsset

  const defaultAsset = amountDefaultAsset ?? getDefaultAssetByNetworkId(wallet.networkId)

  // if we don't have a symbol for this asset, default to ticker first and
  // then to identifier
  const assetSymbol = getAssetDenominationOrId(defaultAsset, ASSET_DENOMINATION.SYMBOL)

  const amountToDisplay = isEmptyString(fee?.amount) ? amount : amount.plus(new BigNumber(fee?.amount ?? 0))
  const amountStyle = amountToDisplay.eq(0)
    ? styles.neutralAmount
    : amountToDisplay.gte(0)
    ? styles.positiveAmount
    : styles.negativeAmount

  const outputsToMyWallet =
    (isReceived && getTxIOMyWallet(transaction.outputs, externalAddressIndex, internalAddressIndex)) || []

  const totalAssets = outputsToMyWallet.reduce((acc, {assets}) => acc + Number(assets.length), 0)

  return (
    <View removeClippedSubviews style={styles.wrapper}>
      <TouchableOpacity onPress={showDetails} activeOpacity={0.5} testID="txHistoryListItem">
        <View style={[styles.item, {backgroundColor: rootBgColor}]}>
          <View style={styles.iconRoot}>
            <Icon.Direction transaction={transaction} />
          </View>
          <View style={styles.transactionRoot}>
            <View style={styles.row}>
              <Text small secondary={isPending} testID="transactionDirection">
                {strings.direction(transaction.direction as any)}
              </Text>
              {transaction.amount.length > 0 ? (
                <View style={styles.amount} testID="transactionAmount">
                  <Text style={amountStyle} secondary={isPending}>
                    {formatTokenInteger(amountToDisplay, defaultAsset)}
                  </Text>
                  <Text small style={amountStyle} secondary={isPending}>
                    {formatTokenFractional(amountToDisplay, defaultAsset)}
                  </Text>
                  <Text style={amountStyle}>{`${utfSymbols.NBSP}${assetSymbol}`}</Text>
                </View>
              ) : (
                <Text style={amountStyle}>- -</Text>
              )}
            </View>
            {totalAssets !== 0 && (
              <View style={styles.row}>
                <Text secondary small testID="submittedAtText">
                  {submittedAt}
                </Text>
                <Text testID="totalAssetsText">{strings.assets(totalAssets)}</Text>
              </View>
            )}
            <View style={styles.last}>
              <Text secondary small testID="submittedAtText">
                {totalAssets === 0 && submittedAt}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 10,
    elevation: 2,
    shadowOffset: {width: 0, height: -2},
    shadowRadius: 10,
    shadowOpacity: 0.08,
    shadowColor: '#181a1e',
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  last: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  positiveAmount: {
    color: COLORS.POSITIVE_AMOUNT,
  },
  negativeAmount: {
    color: COLORS.BLACK,
  },
  neutralAmount: {
    color: COLORS.BLACK,
  },
  iconRoot: {
    paddingRight: 8,
  },
  transactionRoot: {
    flex: 14,
  },
})

const messages = defineMessages({
  fee: {
    id: 'components.txhistory.txhistorylistitem.fee',
    defaultMessage: '!!!Fee',
  },
  transactionTypeSent: {
    id: 'components.txhistory.txhistorylistitem.transactionTypeSent',
    defaultMessage: '!!!ADA sent',
  },
  transactionTypeReceived: {
    id: 'components.txhistory.txhistorylistitem.transactionTypeReceived',
    defaultMessage: '!!!ADA received',
  },
  transactionTypeSelf: {
    id: 'components.txhistory.txhistorylistitem.transactionTypeSelf',
    defaultMessage: '!!!Intrawallet',
  },
  transactionTypeMulti: {
    id: 'components.txhistory.txhistorylistitem.transactionTypeMulti',
    defaultMessage: '!!!Multiparty',
  },
  assets: {
    id: 'global.txLabels.assets',
    defaultMessage: '!!!{cnt} assets',
    description: 'The number of assets different assets, not the amount',
  },
})

const directionMessages: Record<TransactionDirection, MessageDescriptor> = Object.freeze({
  SENT: messages.transactionTypeSent,
  RECEIVED: messages.transactionTypeReceived,
  SELF: messages.transactionTypeSelf,
  MULTI: messages.transactionTypeMulti,
})

const useStrings = () => {
  const intl = useIntl()

  return {
    direction: (direction: TransactionDirection) => intl.formatMessage(directionMessages[direction]),
    assets: (qty: number) => intl.formatMessage(messages.assets, {cnt: qty}),
  }
}

const bgColorByAssurance = (assurance: TransactionAssurance) => {
  switch (assurance) {
    case 'PENDING':
      return 'rgba(207, 217, 224, 0.6)'
    case 'FAILED':
      return '#F8D7DA'
    default:
      return '#FFF'
  }
}
