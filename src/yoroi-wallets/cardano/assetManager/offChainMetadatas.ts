import {toAssetName, TokenRegistryEntry, toPolicyId, toTokenSubject} from '../api'
import {checkedFetch} from '../api/fetch'
import {API_ROOT} from '../shelley-testnet/constants'

export type OffChainMetadatas = {
  fts: Record<string, FtMetadataRecord>
  nfts: Record<string, NftMetadataRecord>
}
export const getOffChainMetadatas = async (assetIds: Array<string>) => {
  const metadataEntries = await Promise.all(assetIds.map((tokenId) => getRegistryEntry(tokenId, API_ROOT)))

  const fts: Record<string, TokenRegistryEntry> = {}

  const nfts: Record<string, TokenRegistryEntry> = {}

  const offChainMetadatas = {
    fts,
    nfts,
  }

  return offChainMetadatas
}

const fallbackFtEntry = (policyIdAssetName: string) => {
  const policyId = toPolicyId(policyIdAssetName)
  const assetName = toAssetName(policyIdAssetName)

  const fallback: FtMetadataRecord = {
    key: '20',
    metadata: {
      [policyId]: {
        [assetName]: {
          desc: undefined,
          icon: undefined,
          decimals: 0,
          ticker: undefined,
          url: undefined,
          version: undefined,
        },
      },
    },
  }

  return fallback
}

const getRegistryEntry = async (tokenId: string, apiUrl: string) => {
  const response = await checkedFetch({
    endpoint: `${apiUrl}/${toTokenSubject(tokenId)}`,
    method: 'GET',
    payload: undefined,
  }).catch(() => undefined)

  return parseTokenRegistryEntry(response)
}

const parseTokenRegistryEntry = (data: unknown) => {
  return isTokenRegistryEntry(data) ? data : undefined
}

const isTokenRegistryEntry = (data: unknown): data is TokenRegistryEntry => {
  const candidate = data as TokenRegistryEntry

  return (
    !!candidate &&
    typeof candidate === 'object' &&
    'subject' in candidate &&
    typeof candidate.subject === 'string' &&
    'name' in candidate &&
    !!candidate.name &&
    typeof candidate.name === 'object' &&
    'value' in candidate.name &&
    typeof candidate.name.value === 'string'
  )
}

export type MetadataRecords = {
  [policyIdAssetName: string]: readonly [AssetMetadataRecord]
}

type AssetMetadataRecord = FtMetadataRecord | NftMetadataRecord

type NftMetadataRecord = {
  key: '721'
  metadata: {[policyId: string]: {[assetName: string]: NftMetadata}}
}

type FtMetadataRecord = {
  key: '20'
  metadata: {[policyId: string]: {[assetName: string]: FtMetadata}}
}

type FtMetadata = {
  desc: string | Array<string> | undefined
  icon: string | Array<string> | undefined
  decimals: number | undefined
  ticker: string | undefined
  url: string | undefined
  version: string | undefined
}
