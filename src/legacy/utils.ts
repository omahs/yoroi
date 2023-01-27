/* eslint-disable no-empty */

import {BigNumber} from 'bignumber.js'
import {isEmpty} from 'lodash'

import {asciiToHex, CardanoMobile, CardanoTypes, MultiToken, toAssetName, toPolicyId} from '../yoroi-wallets'
import type {Addressing, BaseAsset, NetworkId, RawUtxo} from '../yoroi-wallets/types/other'
import {CONFIG} from './config'
import {getNetworkConfigById} from './networks'

const PRIMARY_ASSET_CONSTANTS = CONFIG.PRIMARY_ASSET_CONSTANTS

export const normalizeToAddress = async (addr: string) => {
  // in Shelley, addresses can be base16, bech32 or base58
  // in this function, we try parsing in all encodings possible
  // 1) Try converting from base58
  try {
    if (await CardanoMobile.ByronAddress.isValid(addr)) {
      return await (await CardanoMobile.ByronAddress.fromBase58(addr)).toAddress()
    }
  } catch (_e) {}

  // eslint-disable-line no-empty
  // 2) If already base16, simply return
  try {
    return await CardanoMobile.Address.fromBytes(Buffer.from(addr, 'hex'))
  } catch (_e) {}

  // eslint-disable-line no-empty
  // 3) Try converting from bech32
  try {
    return await CardanoMobile.Address.fromBech32(addr)
  } catch (_e) {}

  // eslint-disable-line no-empty
  return undefined
}

// need to format shelley addresses as base16 but only legacy addresses as base58

export const verifyFromBip44Root = (request: Addressing['addressing']) => {
  const accountPosition = request.startLevel

  if (accountPosition !== CONFIG.NUMBERS.BIP44_DERIVATION_LEVELS.PURPOSE) {
    throw new Error('verifyFromBip44Root: addressing does not start from root')
  }

  const lastLevelSpecified = request.startLevel + request.path.length - 1

  if (lastLevelSpecified !== CONFIG.NUMBERS.BIP44_DERIVATION_LEVELS.ADDRESS) {
    throw new Error('verifyFromBip44Root: incorrect addressing size')
  }
}

export const deriveRewardAddressHex = async (accountPubKeyHex: string, networkId: NetworkId): Promise<string> => {
  const accountPubKeyPtr = await CardanoMobile.Bip32PublicKey.fromBytes(Buffer.from(accountPubKeyHex, 'hex'))
  const stakingKey = await (
    await (
      await accountPubKeyPtr.derive(CONFIG.NUMBERS.CHAIN_DERIVATIONS.CHIMERIC_ACCOUNT)
    ).derive(CONFIG.NUMBERS.STAKING_KEY_INDEX)
  ).toRawKey()
  const credential = await CardanoMobile.StakeCredential.fromKeyhash(await stakingKey.hash())
  let chainNetworkId = CONFIG.NETWORKS.HASKELL_SHELLEY.CHAIN_NETWORK_ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = getNetworkConfigById(networkId)

  if (config.CHAIN_NETWORK_ID != null) {
    chainNetworkId = config.CHAIN_NETWORK_ID
  }

  const rewardAddr = await CardanoMobile.RewardAddress.new(parseInt(chainNetworkId, 10), credential)
  const rewardAddrAsAddr = await rewardAddr.toAddress()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Buffer.from((await rewardAddrAsAddr.toBytes()) as any, 'hex').toString('hex')
}

/**
 * Multi-asset related
 */
export const identifierToCardanoAsset = async (
  tokenId: string,
): Promise<{
  policyId: CardanoTypes.ScriptHash
  name: CardanoTypes.AssetName
}> => {
  const policyId = toPolicyId(tokenId)

  const assetNameHex = asciiToHex(toAssetName(tokenId) ?? '')

  return {
    policyId: await CardanoMobile.ScriptHash.fromBytes(Buffer.from(policyId, 'hex')),
    name: await CardanoMobile.AssetName.new(Buffer.from(assetNameHex, 'hex')),
  }
}

export const cardanoValueFromMultiToken = async (tokens: MultiToken) => {
  const value = await CardanoMobile.Value.new(
    await CardanoMobile.BigNum.fromStr(tokens.getDefaultEntry().amount.toString()),
  )
  // recall: primary asset counts towards size
  if (tokens.size() === 1) return value
  const assets = await CardanoMobile.MultiAsset.new()

  for (const entry of tokens.nonDefaultEntries()) {
    const {policyId, name} = await identifierToCardanoAsset(entry.identifier)
    const asset = await assets.get(policyId)
    const policyContent = asset.hasValue() ? asset : await CardanoMobile.Assets.new()

    await policyContent.insert(name, await CardanoMobile.BigNum.fromStr(entry.amount.toString()))
    // recall: we always have to insert since WASM returns copies of objects
    await assets.insert(policyId, policyContent)
  }

  if ((await assets.len()) > 0) {
    await value.setMultiasset(assets)
  }

  return value
}

export const cardanoValueFromRemoteFormat = async (utxo: RawUtxo) => {
  const value = await CardanoMobile.Value.new(await CardanoMobile.BigNum.fromStr(utxo.amount))
  if (utxo.assets.length === 0) return value
  const assets = await CardanoMobile.MultiAsset.new()

  for (const remoteAsset of utxo.assets) {
    const {policyId, name} = await identifierToCardanoAsset(remoteAsset.assetId)
    let policyContent = await assets.get(policyId)
    policyContent = policyContent.hasValue() ? policyContent : await CardanoMobile.Assets.new()
    await policyContent.insert(name, await CardanoMobile.BigNum.fromStr(remoteAsset.amount))
    // recall: we always have to insert since WASM returns copies of objects
    await assets.insert(policyId, policyContent)
  }

  if ((await assets.len()) > 0) {
    await value.setMultiasset(assets)
  }

  return value
}
// matches RawUtxo and a tx input/output
type RemoteValue = {
  readonly amount: string
  readonly assets?: ReadonlyArray<BaseAsset>
}

export const multiTokenFromRemote = (remoteValue: RemoteValue, networkId: number) => {
  const result = new MultiToken([], {
    defaultNetworkId: networkId,
    defaultIdentifier: PRIMARY_ASSET_CONSTANTS.CARDANO,
  })
  result.add({
    identifier: PRIMARY_ASSET_CONSTANTS.CARDANO,
    amount: new BigNumber(remoteValue.amount),
    networkId,
  })

  if (remoteValue.assets != null) {
    for (const token of remoteValue.assets) {
      result.add({
        identifier: token.assetId,
        amount: new BigNumber(token.amount),
        networkId,
      })
    }
  }

  return result
}

/**
 * Wrapper function to lodash.isEmpty that
 * returns true if the string is empty.
 * The lodash.isEmpty function doesn't have the typescript's safeguard signature.
 * It will be fixed in this PR https://github.com/DefinitelyTyped/DefinitelyTyped/pull/60401
 *
 * @summary Returns true if the value is empty: length === 0, null or undefined, else false.
 *
 * @param value The string to inspect
 * @return {boolean} Returns true if the string is empty, else false.
 *
 * @example isEmptyString('') returns true
 * @example isEmptyString(' ') returns false
 * @example isEmptyString(null) returns true
 * @example isEmptyString(undefined) returns true
 */
export function isEmptyString(value: string | null | undefined): value is '' | null | undefined {
  return isEmpty(value)
}
