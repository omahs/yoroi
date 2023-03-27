import {NftMetadata, RawUtxo, YoroiAmounts} from '../../types'
import {Amounts, Utxos} from '../../utils'
import {asciiToHex, getRegistryEntry, toAssetName, TokenRegistryEntry, toPolicyId} from '../api'
import fetchDefault from '../api/fetch'
import {API_ROOT, BACKEND} from '../shelley-testnet/constants'

export type AssetManager = Awaited<ReturnType<typeof makeAssetManager>>

type AssetManagerState = {
  tokenInfos: {
    fts: Record<string, any>
    nfts: Record<string, any>
  }
  balances: {
    all: YoroiAmounts
    fts: YoroiAmounts
    nfts: YoroiAmounts
  }
}

export const makeAssetManager = () => {
  const state: AssetManagerState = {
    tokenInfos: {
      fts: {},
      nfts: {},
    },
    balances: {
      all: {},
      fts: {},
      nfts: {},
    },
  }

  const {subscribe, notify} = observable()

  return {
    ...state,
    update: async (utxos: Array<RawUtxo>) => {
      state.balances.all = Utxos.toAmounts(utxos)

      const tokenIds = Amounts.toArray(state.balances.all).map(({tokenId}) => tokenId)
      const request = {
        assets: tokenIds.map((tokenId) => ({
          nameHex: asciiToHex(toAssetName(tokenId)),
          policy: toPolicyId(tokenId),
        })),
      }
      const records: MetadataEndpointReponse = await fetchDefault('multiAsset/metadata', request, BACKEND)
      const entries = Object.entries(records).map(([key, [entry]]) => [key, entry] as const)
      const ftEntries = Object.fromEntries(
        entries
          .filter((tuple): tuple is readonly [string, NftMetadataRecord] => isFt(tuple[1]))
          .map(([key, record]) => {
            const [policyId, assetName] = key.split('.')
            const assetNameHex = asciiToHex(assetName)
            const assetId = `${policyId}.${assetNameHex}`
            const metadata = record.metadata[policyId][assetNameHex]

            return [assetId, metadata] as const
          }),
      )

      const nftEntries = Object.fromEntries(
        entries
          .filter((tuple): tuple is readonly [string, NftMetadataRecord] => isNft(tuple[1]))
          .map(([key, record]) => {
            const [policyId, assetName] = key.split('.')
            const assetNameHex = asciiToHex(assetName)
            const assetId = `${policyId}.${assetNameHex}`
            const metadata = record.metadata[policyId][assetNameHex]

            return [assetId, metadata] as const
          }),
      )

      const onChainMetadata = {
        ft: ftEntries,
        nft: nftEntries,
      }

      const offChainMetadatas = await Promise.all(tokenIds.map((tokenId) => getRegistryEntry(tokenId, API_ROOT))).then(
        (entries) => entries.filter((entry): entry is TokenRegistryEntry => !!entry),
      )

      state.tokenInfos.fts = ftEntries
      state.tokenInfos.nfts = nftEntries

      state.balances.fts = Amounts.filter(state.balances.all, ({tokenId}) => !!state.tokenInfos.fts[tokenId])
      state.balances.nfts = Amounts.filter(state.balances.all, ({tokenId}) => !!state.tokenInfos.nfts[tokenId])

      console.log('QWE', state)

      notify(state)
    },
    subscribe,
  } as const
}

const format = ([key, record]: [string, AssetMetadataRecord]) => {
  const [policyId, assetName] = key.split('.')
  const assetNameHex = asciiToHex(assetName)
  const assetId = `${policyId}.${assetNameHex}`
  const metadata = record.metadata[policyId][assetNameHex]

  return [assetId, metadata] as const
}

const observable = () => {
  let subscribers: Array<(state: AssetManagerState) => void> = []
  const notify = (state: AssetManagerState) => subscribers.forEach((sub) => sub(state))

  return {
    subscribe: (callback: (state: AssetManagerState) => void) => {
      subscribers.push(callback)
      return () => (subscribers = subscribers.filter((sub) => sub !== callback))
    },
    notify,
  } as const
}

const isNft = (entry: AssetMetadataRecord): entry is FtMetadataRecord => entry.key === '721'
const isFt = (entry: AssetMetadataRecord): entry is NftMetadataRecord => entry.key !== '721'

export type MetadataEndpointReponse = {
  [policyIdAssetName: string]: [AssetMetadataRecord]
}

type AssetMetadataRecord = FtMetadataRecord | NftMetadataRecord

type NftMetadataRecord = {
  key: '721'
  metadata: {
    [policyId: string]: {
      [assetNameHex: string]: NftMetadata
    }
  }
}

type FtMetadataRecord = {
  key: '20'
  metadata: {
    [policyId: string]: {
      [assetNameHex: string]: FtMetadata
    }
  }
}

type FtMetadata = {
  desc: string | Array<string>
  icon: string | Array<string>
  decimals: number
  ticker: string
  url: string
  version: string
}
