// @flow

import React from 'react'
import {defineMessages, useIntl} from 'react-intl'
import {ActivityIndicator, ScrollView, View} from 'react-native'

import {AddressDTOCardano} from '../../crypto/shelley/Address.dto'
import {confirmationMessages} from '../../i18n/global-messages'
import HWInstructions from '../Ledger/HWInstructions'
import {Button, Modal, Text} from '../UiKit'
import styles from './styles/AddressVerifyModal.style'

type Props = {|
  visible: boolean,
  onConfirm: () => mixed,
  onRequestClose: () => any,
  addressInfo: AddressDTOCardano,
  path: string,
  isWaiting: boolean,
  useUSB: boolean,
|}

const AddressVerifyModal = ({visible, onConfirm, onRequestClose, addressInfo, path, isWaiting, useUSB}: Props) => {
  const strings = useStrings()

  return (
    <Modal visible={visible} onRequestClose={onRequestClose} showCloseIcon>
      <ScrollView style={styles.scrollView}>
        <View style={styles.heading}>
          <Text style={styles.title}>{strings.title}</Text>
        </View>

        <HWInstructions useUSB={useUSB} />

        <Text style={styles.paragraph}>{strings.afterConfirm}</Text>

        <View style={styles.addressDetailsView}>
          <Text secondary style={styles.paragraph}>
            {addressInfo.address}
          </Text>

          <Text secondary style={styles.paragraph}>
            {path}
          </Text>
        </View>

        <Button onPress={onConfirm} title={strings.confirmButton} style={styles.button} disabled={isWaiting} />

        {isWaiting && <ActivityIndicator />}
      </ScrollView>
    </Modal>
  )
}

export default AddressVerifyModal

const messages = defineMessages({
  title: {
    id: 'components.receive.addressverifymodal.title',
    defaultMessage: '!!!Verify Address on Ledger',
  },
  afterConfirm: {
    id: 'components.receive.addressverifymodal.afterConfirm',
    defaultMessage:
      '!!!Once you tap on confirm, validate the address on your Ledger ' +
      'device, making sure both the path and the address match what is shown ' +
      'below:',
  },
})

const useStrings = () => {
  const intl = useIntl()

  return {
    title: intl.formatMessage(messages.title),
    afterConfirm: intl.formatMessage(messages.afterConfirm),
    confirmButton: intl.formatMessage(confirmationMessages.commonButtons.confirmButton),
  }
}
