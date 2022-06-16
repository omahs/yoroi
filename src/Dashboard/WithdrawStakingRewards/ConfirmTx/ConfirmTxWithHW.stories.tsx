import {action} from '@storybook/addon-actions'
import {storiesOf} from '@storybook/react-native'
import React from 'react'

import {mockWallet, mockYoroiTx, WithModal} from '../../../../storybook'
import {Boundary} from '../../../components'
import {ConfirmTxWithHW} from './ConfirmTxWithHW'

storiesOf('ConfirmWithdrawalTx/HW', module)
  .add('withdrawals, no deregistrations', () => (
    <WithModal>
      <Boundary>
        <ConfirmTxWithHW
          wallet={{
            ...mockWallet,
            submitTransaction: async (yoroiSignedTx) => {
              action('onSubmit')(yoroiSignedTx)
              return []
            },
          }}
          unsignedTx={{
            ...mockYoroiTx,
            staking: {
              ...mockYoroiTx.staking,
              withdrawals: {
                'withdrawal-address': {['']: '12356789'},
              },
            },
          }}
          onSuccess={action('onSuccess')}
          onCancel={action('onCancel')}
        />
      </Boundary>
    </WithModal>
  ))
  .add('withdrawals, deregistrations', () => (
    <WithModal>
      <Boundary>
        <ConfirmTxWithHW
          wallet={{
            ...mockWallet,
            submitTransaction: async (yoroiSignedTx) => {
              action('onSubmit')(yoroiSignedTx)
              return []
            },
          }}
          unsignedTx={{
            ...mockYoroiTx,
            staking: {
              ...mockYoroiTx.staking,
              deregistrations: {
                ...mockYoroiTx.staking.deregistrations,
                'deregistration-address': {['']: '12356789'},
              },
              withdrawals: {
                'withdrawal-address': {['']: '12356789'},
              },
            },
          }}
          onSuccess={action('onSuccess')}
          onCancel={action('onCancel')}
        />
      </Boundary>
    </WithModal>
  ))