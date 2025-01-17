import {useSwap} from '@yoroi/swap'
import React from 'react'

import {useSelectedWallet} from '../../../../../../SelectedWallet'
import {useTokenInfo} from '../../../../../../yoroi-wallets/hooks'
import {Quantities} from '../../../../../../yoroi-wallets/utils'
import {useNavigateTo} from '../../../../common/navigation'
import {ExpandableInfoCard} from '../../../../common/SelectPool/ExpendableCard/ExpandableInfoCard'
import {useStrings} from '../../../../common/strings'

export const ShowPoolActions = () => {
  const navigate = useNavigateTo()
  const strings = useStrings()
  const {createOrder} = useSwap()
  const {selectedPool, amounts} = createOrder
  const wallet = useSelectedWallet()
  const buyTokenInfo = useTokenInfo({wallet, tokenId: amounts.buy.tokenId})
  const sellTokenInfo = useTokenInfo({wallet, tokenId: amounts.sell.tokenId})
  const tokenName = buyTokenInfo.ticker ?? buyTokenInfo.name

  if (selectedPool === undefined) {
    return <></>
  }

  const totalAmount = Quantities.denominated(amounts.buy.quantity, buyTokenInfo.decimals ?? 0)
  const protocolCapitalize = selectedPool.provider[0].toUpperCase() + selectedPool.provider.substring(1)
  const calculatedFee = (Number(selectedPool?.fee) / 100) * Number(createOrder.amounts.sell.quantity)
  const poolFee = Quantities.denominated(`${calculatedFee}`, sellTokenInfo.decimals ?? 0)

  return (
    <ExpandableInfoCard
      label={`${protocolCapitalize} (auto)`}
      mainInfo={[{label: `Total ${totalAmount} ${tokenName} `}]}
      navigateTo={() => navigate.selectPool()}
      hiddenInfo={[
        {
          label: 'Min ADA',
          value: '2 ADA',
          info: strings.swapMinAda,
        },
        {
          label: 'Min Received ?',
          value: '2.99 USDA', // TODO add real value
          info: strings.swapMinReceived,
        },
        {
          label: 'Fees',
          value: String(poolFee),
        },
      ]}
    />
  )
}
