import {getSellAmountByChangingReceive, useSwap} from '@yoroi/swap'
import * as React from 'react'

import {useSelectedWallet} from '../../../../../../SelectedWallet'
import {useBalance, useTokenInfo} from '../../../../../../yoroi-wallets/hooks'
import {Logger} from '../../../../../../yoroi-wallets/logging'
import {asQuantity, Quantities} from '../../../../../../yoroi-wallets/utils'
import {AmountCard} from '../../../../common/AmountCard/AmountCard'
import {useNavigateTo} from '../../../../common/navigation'
import {useStrings} from '../../../../common/strings'
import {useSwapTouched} from '../TouchedContext'

export const EditBuyAmount = () => {
  const strings = useStrings()
  const navigate = useNavigateTo()
  const wallet = useSelectedWallet()

  const {createOrder, buyAmountChanged, sellAmountChanged} = useSwap()
  const {isBuyTouched} = useSwapTouched()
  const {tokenId, quantity} = createOrder.amounts.buy
  const tokenInfo = useTokenInfo({wallet, tokenId})
  const {decimals} = tokenInfo
  const balance = useBalance({wallet, tokenId})

  const [inputValue, setInputValue] = React.useState<string>(Quantities.denominated(quantity, tokenInfo.decimals ?? 0))

  React.useEffect(() => {
    setInputValue(Quantities.denominated(quantity, tokenInfo.decimals ?? 0))
  }, [quantity, tokenInfo.decimals])

  const recalculateSellValue = (buyQuantity) => {
    const {sell} = getSellAmountByChangingReceive(createOrder?.selectedPool, {
      quantity: buyQuantity,
      tokenId: tokenId,
    })
    sellAmountChanged({
      quantity: sell?.quantity,
      tokenId: createOrder.amounts.sell.tokenId,
    })
  }

  const onChangeQuantity = (text: string) => {
    try {
      setInputValue(text)

      const inputQuantity = asQuantity(text.length > 0 ? text : '0')
      const quantity = Quantities.integer(inputQuantity, decimals ?? 0)
      buyAmountChanged({tokenId, quantity})
      recalculateSellValue(quantity)
    } catch (error) {
      Logger.error('SwapAmountScreen::onChangeQuantity', error)
    }
  }

  return (
    <AmountCard
      label={strings.swapTo}
      onChange={onChangeQuantity}
      value={inputValue}
      amount={{tokenId, quantity: balance}}
      wallet={wallet}
      navigateTo={navigate.selectBuyToken}
      touched={isBuyTouched}
    />
  )
}
