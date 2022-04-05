import {RouteProp, useRoute} from '@react-navigation/native'
import React from 'react'
import {ActivityIndicator, StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import type {WalletMeta} from '../../../legacy/state'
import {COLORS} from '../../../legacy/styles/config'
import {useCreateWallet} from '../../hooks'
import {useWalletNavigation, WalletInitRoutes} from '../../navigation'
import {useSetSelectedWallet, useSetSelectedWalletMeta} from '../../SelectedWallet'
import {WalletForm} from '../WalletForm'

export const WalletCredentialsScreen = () => {
  const {navigateToTxHistory} = useWalletNavigation()
  const route = useRoute<RouteProp<WalletInitRoutes, 'wallet-credentials'>>()
  const {phrase, networkId, walletImplementationId, provider} = route.params

  const setSelectedWalletMeta = useSetSelectedWalletMeta()
  const setSelectedWallet = useSetSelectedWallet()

  const {createWallet, isLoading, isSuccess} = useCreateWallet({
    onSuccess: async (wallet, {name}) => {
      const walletMeta: WalletMeta = {
        name,

        id: wallet.id,
        networkId: wallet.networkId,
        walletImplementationId: wallet.walletImplementationId,
        isHW: wallet.isHW,
        checksum: wallet.checksum,
        isEasyConfirmationEnabled: wallet.isEasyConfirmationEnabled,
        provider: wallet.provider,
      }
      setSelectedWalletMeta(walletMeta)
      setSelectedWallet(wallet)

      navigateToTxHistory()
    },
  })

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeAreaView}>
      <WalletForm
        onSubmit={
          isLoading || isSuccess
            ? NOOP
            : ({name, password}) =>
                createWallet({name, password, mnemonicPhrase: phrase, networkId, walletImplementationId, provider})
        }
      />
      {isLoading && <ActivityIndicator />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
})

const NOOP = () => undefined
