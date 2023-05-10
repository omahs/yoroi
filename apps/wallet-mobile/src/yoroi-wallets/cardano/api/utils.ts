import AssetFingerprint from '@emurgo/cip14-js'
import {Buffer} from 'memfs/lib/internal/buffer'

import {LegacyToken, TokenInfo} from '../../types'
import {YoroiWallet} from '../types'
import {TokenRegistryEntry} from './api'

const POLICY_ID_LENGTH_IN_BYTES = 28
const MAX_ASSET_NAME_LENGTH_IN_BYTES = 32
// 775f356c756b70ca6b8e65feec417c7da295179eee6c4bfe9ff33176.54657374696e6754657374496d6167653636

export const tokenInfo = (entry: TokenRegistryEntry): TokenInfo => {
  const policyId = toPolicyId(entry.subject)
  const assetName = toUtf8DecodedAssetName(entry.subject)

  return {
    id: toTokenId(entry.subject),
    group: policyId,
    decimals: entry.decimals?.value ?? 0,
    fingerprint: toTokenFingerprint({
      policyId,
      assetNameHex: assetName ? utf8ToHex(assetName) : undefined,
    }),

    // optional values
    name: assetName,
    description: entry.description?.value,
    symbol: undefined,
    ticker: entry.ticker?.value,
    url: entry.url?.value,
    logo: entry.logo?.value,
  }
}

export const fallbackTokenInfo = (tokenId: string): TokenInfo => {
  const policyId = toPolicyId(tokenId)
  const assetName = toUtf8DecodedAssetName(tokenId)

  return {
    id: toTokenId(tokenId),
    name: assetName,
    group: policyId,
    decimals: 0,
    fingerprint: toTokenFingerprint({
      policyId,
      assetNameHex: assetName ? utf8ToHex(assetName) : undefined,
    }),
    description: undefined,
    logo: undefined,
    symbol: undefined,
    ticker: undefined,
    url: undefined,
  }
}

export const toPolicyId = (tokenIdentifier: string) => {
  const tokenSubject = toTokenSubject(tokenIdentifier)
  return tokenSubject.slice(0, POLICY_ID_LENGTH_IN_BYTES * 2)
}
export const toUtf8DecodedAssetName = (tokenIdentifier: string): string => {
  return hexToUtf8(toAssetName(tokenIdentifier))
}

export const toAssetName = (tokenIdentifier: string): string => {
  const tokenSubject = toTokenSubject(tokenIdentifier)
  return tokenSubject.slice(
    POLICY_ID_LENGTH_IN_BYTES * 2,
    POLICY_ID_LENGTH_IN_BYTES * 2 + MAX_ASSET_NAME_LENGTH_IN_BYTES * 2,
  )
}

export const toTokenSubject = (tokenIdentifier: string) => tokenIdentifier.replace('.', '')
export const toTokenId = (tokenIdentifier: string) => {
  const tokenSubject = toTokenSubject(tokenIdentifier)
  return `${tokenSubject.slice(0, 56)}.${toAssetName(tokenIdentifier)}`
}

export const hexToUtf8 = (hex: string) => Buffer.from(hex, 'hex').toString('utf-8')
export const utf8ToHex = (ascii: string) => Buffer.from(ascii, 'utf-8').toString('hex')

export const toToken = ({wallet, tokenInfo}: {wallet: YoroiWallet; tokenInfo: TokenInfo}): LegacyToken => {
  if (tokenInfo.id === wallet.primaryTokenInfo.id) return wallet.primaryToken
  const assetNameHex = tokenInfo.name ? utf8ToHex(tokenInfo.name) : ''

  return {
    identifier: `${tokenInfo.group}.${assetNameHex}`,
    networkId: wallet.networkId,
    isDefault: tokenInfo.id === wallet.primaryTokenInfo.id,
    metadata: {
      type: 'Cardano',
      policyId: tokenInfo.group,
      assetName: assetNameHex,
      numberOfDecimals: tokenInfo.decimals,
      ticker: tokenInfo.ticker ?? null,
      longName: tokenInfo.description ?? null,
      maxSupply: null,
    },
  }
}

export const toTokenInfo = (token: LegacyToken): TokenInfo => {
  const policyId = toPolicyId(token.identifier)
  const assetName = toUtf8DecodedAssetName(token.identifier)

  return {
    id: toTokenId(token.identifier),
    group: policyId,
    name: assetName,
    decimals: token.metadata.numberOfDecimals,
    fingerprint: toTokenFingerprint({policyId: token.metadata.policyId, assetNameHex: token.metadata.assetName}),
    description: token.metadata.longName ?? undefined,
    symbol: undefined,
    url: undefined,
    logo: undefined,
    ticker: token.metadata?.ticker ?? undefined,
  }
}

export const toTokenFingerprint = ({
  policyId,
  assetNameHex = '',
}: {
  policyId: string
  assetNameHex: string | undefined
}) => {
  const assetFingerprint = AssetFingerprint.fromParts(Buffer.from(policyId, 'hex'), Buffer.from(assetNameHex, 'hex'))
  return assetFingerprint.fingerprint()
}
