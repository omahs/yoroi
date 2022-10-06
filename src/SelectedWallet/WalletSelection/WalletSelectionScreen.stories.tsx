import {action} from '@storybook/addon-actions'
import {storiesOf} from '@storybook/react-native'
import React from 'react'

import {mockedWalletMeta} from '../../../storybook'
import {WalletMeta} from '../../legacy/state'
import {WalletManagerProvider} from '../../WalletManager'
import {mockWalletManager, WalletManager} from '../../yoroi-wallets'
import {WalletSelectionScreen} from './WalletSelectionScreen'

storiesOf('WalletSelectionScreen', module)
  .add('no wallets', () => (
    <WalletManagerProvider
      walletManager={
        {
          ...mockWalletManager,
          listWallets: () => Promise.resolve([] as Array<WalletMeta>),
        } as WalletManager
      }
    >
      <WalletSelectionScreen />
    </WalletManagerProvider>
  ))
  .add('loading', () => (
    <WalletManagerProvider
      walletManager={
        {
          ...mockWalletManager,
          listWallets: () => new Promise(() => undefined), // never resolves
        } as WalletManager
      }
    >
      <WalletSelectionScreen />
    </WalletManagerProvider>
  ))
  .add('loaded', () => (
    <WalletManagerProvider
      walletManager={
        {
          ...mockWalletManager,
          listWallets: () =>
            Promise.resolve([
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
              mockWalletMeta(),
            ]),
          openWallet: (walletMeta: WalletMeta) => {
            action('openWallet')(walletMeta)
          },
        } as unknown as WalletManager
      }
    >
      <WalletSelectionScreen />
    </WalletManagerProvider>
  ))

const mockWalletMeta = () => {
  const fakeData = Math.random()

  return {
    ...mockedWalletMeta,
    id: fakeData,
    name: String(fakeData),
  }
}
