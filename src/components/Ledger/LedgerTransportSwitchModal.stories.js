// @flow

import React from 'react'
import {storiesOf} from '@storybook/react-native'

import {withModalProps} from '../../../storybook/decorators'
import LedgerTransportSwitchModal from './LedgerTransportSwitchModal'

storiesOf('Ledger Transport Switch Modal', module)
  .addDecorator(withModalProps)
  .add('default', ({visible, onRequestClose, onPress}) => (
    <LedgerTransportSwitchModal
      visible={visible}
      showCloseIcon
      onRequestClose={onRequestClose}
      onSelectUSB={onPress('USB selected')}
      onSelectBLE={onPress('BLE selected')}
    />
  ))
