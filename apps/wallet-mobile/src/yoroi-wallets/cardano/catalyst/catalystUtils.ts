import {mnemonicToEntropy} from 'bip39'
import {CardanoMobile} from '../../wallets'
import {generateAdaMnemonic} from '../mnemonic'
import {CATALYST} from '../utils'

export async function generatePrivateKeyForCatalyst() {
  const mnemonic = generateAdaMnemonic()
  const bip39entropy = mnemonicToEntropy(mnemonic)
  const EMPTY_PASSWORD = Buffer.from('')
  const rootKey = await CardanoMobile.Bip32PrivateKey.fromBip39Entropy(Buffer.from(bip39entropy, 'hex'), EMPTY_PASSWORD)

  return rootKey
}

export const isRegistrationOpen = (fundInfo?: null | {registrationStart: string; registrationEnd: string}) => {
  const now = new Date()

  if (fundInfo != null) {
    const startDate = new Date(Date.parse(fundInfo.registrationStart))
    const endDate = new Date(Date.parse(fundInfo.registrationEnd))
    if (now >= startDate && now <= endDate) {
      return true
    }
    return false
  } else {
    // if we don't get fund info from server, fallback to hardcoded dates
    const rounds = CATALYST.VOTING_ROUNDS
    for (const round of rounds) {
      const startDate = new Date(Date.parse(round.START_DATE))
      const endDate = new Date(Date.parse(round.END_DATE))
      if (now >= startDate && now <= endDate) {
        return true
      }
    }
    return false
  }
}
