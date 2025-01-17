import {storiesOf} from '@storybook/react-native'
import {mockSwapManager, mockSwapStateDefault, SwapProvider} from '@yoroi/swap'
import {produce} from 'immer'
import React from 'react'

import {SearchProvider} from '../../../../../../Search/SearchContext'
import {SelectedWalletProvider} from '../../../../../../SelectedWallet'
import {mocks} from '../../../../../../yoroi-wallets/mocks/wallet'
import {SwapTouchedProvider} from '../TouchedContext'
import {EditSlippage} from './EditSlippage'

storiesOf('Swap Edit Slippage', module)
  .add('initial %', () => {
    return (
      <SelectedWalletProvider wallet={mocks.wallet}>
        <SearchProvider>
          <SwapProvider swapManager={mockSwapManager}>
            <SwapTouchedProvider>
              <EditSlippage />
            </SwapTouchedProvider>
          </SwapProvider>
        </SearchProvider>
      </SelectedWalletProvider>
    )
  })
  .add('big %', () => {
    const mockSwapStateBigSlippage = produce(mockSwapStateDefault, (draft) => {
      draft.createOrder.slippage = 99.123456789
    })
    return (
      <SelectedWalletProvider wallet={mocks.wallet}>
        <SearchProvider>
          <SwapProvider swapManager={mockSwapManager} initialState={mockSwapStateBigSlippage}>
            <SwapTouchedProvider>
              <EditSlippage />
            </SwapTouchedProvider>
          </SwapProvider>
        </SearchProvider>
      </SelectedWalletProvider>
    )
  })
