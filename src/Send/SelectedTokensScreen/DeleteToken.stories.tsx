import {action} from '@storybook/addon-actions'
import {storiesOf} from '@storybook/react-native'
import React from 'react'
import {Text, View} from 'react-native'

import {mocks, QueryProvider} from '../../../storybook'
import {Spacer} from '../../components'
import {AssetItem} from '../../components/AssetItem'
import {SelectedWalletProvider} from '../../SelectedWallet'
import {DeleteToken} from './DeleteToken'

const primaryTokenInfo = mocks.wallet.primaryTokenInfo
const primaryBalance = mocks.balances[primaryTokenInfo.id]

const tokenInfo = mocks.tokenInfos['698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9d.7444524950']
const tokenBalance = mocks.balances['698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9d.7444524950']

storiesOf('Send/SelectedTokens/DeleteToken', module).add('Gallery', () => (
  <QueryProvider>
    <SelectedWalletProvider wallet={mocks.wallet}>
      <View style={{flex: 1, justifyContent: 'center', padding: 16}}>
        <Text>Fungible primary token</Text>

        <DeleteToken
          onDelete={(tokenId: string) => action(`onDelete ${tokenId}`)}
          tokenInfo={primaryTokenInfo}
          style={{borderColor: 'lightgray', borderWidth: 1, padding: 16, borderRadius: 8}}
        >
          <AssetItem tokenInfo={primaryTokenInfo} quantity={primaryBalance} />
        </DeleteToken>

        <Spacer height={40} />

        <Text>Fungible non-primary token</Text>

        <DeleteToken
          onDelete={(tokenId: string) => action(`onDelete ${tokenId}`)}
          tokenInfo={tokenInfo}
          style={{borderColor: 'lightgray', borderWidth: 1, padding: 16, borderRadius: 8}}
        >
          <AssetItem tokenInfo={tokenInfo} quantity={tokenBalance} />
        </DeleteToken>
      </View>
    </SelectedWalletProvider>
  </QueryProvider>
))