import {useNavigation} from '@react-navigation/native'
import React from 'react'
import {defineMessages, useIntl} from 'react-intl'
import {StyleSheet, View, ViewProps} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {Button, ButtonProps, Spacer, StatusBar} from '../../components'
import {isNightly} from '../../legacy/config'
import {WalletInitRouteNavigation} from '../../navigation'
import {COLORS} from '../../theme'
import {CONFIG, NetworkId, WalletImplementationId} from '../../yoroi-wallets'
import {WalletDescription} from '../WalletDescription'

export const WalletFreshInitScreen = () => {
  const strings = useStrings()
  const navigateTo = useNavigateTo()

  return (
    <SafeAreaView edges={['left', 'right', 'top', 'bottom']} style={styles.safeAreaView}>
      <StatusBar type="dark" />

      <View style={styles.banner}>
        <WalletDescription />
      </View>

      <Actions>
        <ShelleyButton title={strings.addWalletButton} onPress={navigateTo.shelley} />

        <Spacer height={16} />

        <ByronButton title={`${strings.addWalletButton} (Byron-era - deprecated)`} onPress={navigateTo.byron} />

        <NightlyOnly>
          <Spacer height={16} />
          <ShelleyTestnetButton
            title={`${strings.addWalletButton} on TESTNET (Shelley-era)`}
            onPress={navigateTo.shelleyTestnet}
          />
        </NightlyOnly>
      </Actions>
    </SafeAreaView>
  )
}

const Actions = ({style, ...props}: ViewProps) => <View {...props} style={[style, styles.actions]} />

const ShelleyButton = (props: ButtonProps) => <Button {...props} testID="addWalletOnHaskellShelleyButton" />
const ShelleyTestnetButton = (props: ButtonProps) => <Button {...props} testID="addWalletTestnetShelleyButton" />
const ByronButton = (props: ButtonProps) => <Button {...props} outline testID="addWalletOnByronButton" />
const NightlyOnly = ({children}: {children: React.ReactNode}) => <>{isNightly() ? children : null}</>

const messages = defineMessages({
  addWalletButton: {
    id: 'components.walletinit.walletfreshinitscreen.addWalletButton',
    defaultMessage: '!!!Add wallet',
  },
  addWalletOnShelleyButton: {
    id: 'components.walletinit.walletfreshinitscreen.addWalletOnShelleyButton',
    defaultMessage: '!!!Add wallet (Shelley Testnet)',
  },
})

const useStrings = () => {
  const intl = useIntl()

  return {
    addWalletButton: intl.formatMessage(messages.addWalletButton),
    addWalletOnShelleyButton: intl.formatMessage(messages.addWalletOnShelleyButton),
  }
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_BLUE,
  },
  banner: {
    flex: 1,
    justifyContent: 'center',
  },
  actions: {
    padding: 16,
  },
})

const useNavigateTo = () => {
  const navigation = useNavigation<WalletInitRouteNavigation>()

  const navigateInitWallet = (networkId: NetworkId, walletImplementationId: WalletImplementationId) =>
    navigation.navigate('choose-create-restore', {
      networkId,
      walletImplementationId,
      provider: '',
    })

  return {
    shelley: () =>
      navigateInitWallet(
        CONFIG.NETWORKS.HASKELL_SHELLEY.NETWORK_ID,
        CONFIG.WALLETS.HASKELL_SHELLEY.WALLET_IMPLEMENTATION_ID,
      ),
    byron: () =>
      navigateInitWallet(
        CONFIG.NETWORKS.HASKELL_SHELLEY.NETWORK_ID,
        CONFIG.WALLETS.HASKELL_BYRON.WALLET_IMPLEMENTATION_ID,
      ),
    shelleyTestnet: () =>
      navigateInitWallet(
        CONFIG.NETWORKS.HASKELL_SHELLEY_TESTNET.NETWORK_ID,
        CONFIG.WALLETS.HASKELL_SHELLEY.WALLET_IMPLEMENTATION_ID,
      ),
  }
}
