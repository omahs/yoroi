import * as React from 'react'
import {defineMessages, useIntl} from 'react-intl'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FlatList} from 'react-native-gesture-handler'
import {SafeAreaView} from 'react-native-safe-area-context'

import {Boundary, Button} from '../../components'
import {AssetItem} from '../../components/AssetItem'
import {useTokenInfo} from '../../hooks'
import globalMessages from '../../i18n/global-messages'
import {useSelectedWallet} from '../../SelectedWallet'
import {COLORS} from '../../theme'
import {Amounts} from '../../yoroi-wallets'
import {YoroiAmount, YoroiAmounts} from '../../yoroi-wallets/types'
import {DeleteToken} from './DeleteToken'

type SelectedTokensScreenProps = {
  amounts: YoroiAmounts
}

export const SelectedTokensScreen = ({amounts: initialAmounts}: SelectedTokensScreenProps) => {
  const [amounts, setAmounts] = React.useState(initialAmounts)
  const strings = useStrings()

  const onEdit = (amount: YoroiAmount) => setAmounts(Amounts.save(amounts, amount))
  const onDelete = (tokenId) => setAmounts(Amounts.remove(amounts, [tokenId]))
  const onAdd = () => console.log('add')
  const onNext = () => console.log('next')

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <FlatList
        data={Amounts.toArray(amounts)}
        renderItem={({item: amount}: {item: YoroiAmount}) => (
          <Boundary>
            <EditableToken amount={amount} onDelete={onDelete} onEdit={onEdit} />
          </Boundary>
        )}
        bounces={false}
        keyExtractor={(amount) => amount.tokenId}
        testID="selectedTokens"
      />

      <Actions>
        <Button onPress={onAdd} title={strings.addAsset} style={{}} />

        <Button onPress={onNext} title={strings.next} shelleyTheme />
      </Actions>
    </SafeAreaView>
  )
}

type EditableTokenProps = {
  amount: YoroiAmount
  onEdit(amount: YoroiAmount): void
  onDelete(tokenId: string): void
}
const EditableToken = ({amount: {quantity, tokenId}, onDelete, onEdit}: EditableTokenProps) => {
  const wallet = useSelectedWallet()
  const tokenInfo = useTokenInfo({wallet, tokenId})

  const handleDelete = () => onDelete(tokenId)
  const handleEdit = () => onEdit({quantity, tokenId})

  return (
    <DeleteToken onDelete={handleDelete} tokenInfo={tokenInfo}>
      <TouchableOpacity style={{paddingVertical: 16}} onPress={handleEdit} testID="editToken">
        <AssetItem tokenInfo={tokenInfo} quantity={quantity} />
      </TouchableOpacity>
    </DeleteToken>
  )
}

const Actions = (props) => <View {...props} />

export const useStrings = () => {
  const intl = useIntl()

  return {
    addAsset: intl.formatMessage(messages.addAsset),
    next: intl.formatMessage(globalMessages.next),
  }
}

const messages = defineMessages({
  addAsset: {
    id: 'components.send.addToken',
    defaultMessage: '!!!Add asset',
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
  },
})
