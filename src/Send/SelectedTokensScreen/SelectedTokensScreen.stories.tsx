import {NavigationRouteContext} from '@react-navigation/native'
import {storiesOf} from '@storybook/react-native'
import React from 'react'

import {mocks} from '../../../storybook'
import {SelectedWalletProvider} from '../../SelectedWallet'
import {SendProvider} from '../Context/SendContext'
import {SelectedTokensScreen} from './SelectedTokensScreen'

storiesOf('Send/SelectedTokens', module).add('Default', () => {
  const route = {
    key: 'key',
    name: 'name',
    params: {
      amounts: {'': '1'},
    },
  }

  return (
    <SelectedWalletProvider wallet={mocks.wallet}>
      <NavigationRouteContext.Provider value={route}>
        <SendProvider wallet={mocks.wallet} initialState={{receiver: 'storybook: receiver uri or address'}}>
          <SelectedTokensScreen amounts={mocks.balances} />
        </SendProvider>
      </NavigationRouteContext.Provider>
    </SelectedWalletProvider>
  )
})
