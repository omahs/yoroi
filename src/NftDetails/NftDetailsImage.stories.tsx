import {storiesOf} from '@storybook/react-native'
import React from 'react'

import {mocks, QueryProvider, RouteProvider} from '../../storybook'
import {SelectedWalletProvider} from '../SelectedWallet'
import {NftDetailsImage} from './NftDetailsImage'

storiesOf('NFT/Details Image', module).add('Default', () => {
  const loadedWallet = {
    ...mocks.wallet,
    fetchNfts: mocks.fetchNfts.success.many,
    fetchNftModerationStatus: mocks.fetchNftModerationStatus.success.approved,
  }
  return (
    <RouteProvider params={{id: '1'}}>
      <QueryProvider>
        <SelectedWalletProvider wallet={loadedWallet}>
          <NftDetailsImage />
        </SelectedWalletProvider>
      </QueryProvider>
    </RouteProvider>
  )
})