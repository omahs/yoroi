import {getAssetFingerprint} from '../../../legacy/format'
import {RawUtxo, TokenInfo, YoroiAmounts, YoroiNft} from '../../types'
import {Amounts, hasProperties, isArray, isObject, Utxos} from '../../utils'
import {hexToAscii, toAssetName, toPolicyId} from '../api'
import fetchDefault from '../api/fetch'
import {BACKEND} from '../shelley-testnet/constants'
import {getOffChainMetadatas} from './offChainMetadatas'
// import {getOffChainMetadatas, OffChainMetadatas} from './offChainMetadatas'
import {getOnChainMetadatas} from './onChainMetadatas'

export type AssetManager = Awaited<ReturnType<typeof makeAssetManager>>

type AssetManagerState = {
  assetInfos: {
    fts: Record<string, TokenInfo>
    nfts: Record<string, YoroiNft>
  }
  balances: {
    all: YoroiAmounts
    fts: YoroiAmounts
    nfts: YoroiAmounts
  }
}

export const makeAssetManager = () => {
  const state: AssetManagerState = {
    assetInfos: {
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

      const assetIds = Amounts.toArray(state.balances.all).map(({tokenId}) => tokenId)
      const [offChainMetadatas, onChainMetadatas, assetSupplies] = await Promise.all([
        getOffChainMetadatas(assetIds),
        getOnChainMetadatas(assetIds),
        getAssetSupplies(assetIds),
      ])

      console.log('QWE', offChainMetadatas)

      state.assetInfos.fts = assetIds.reduce((result, id) => {
        const onChainMetadata = onChainMetadatas[id]
        const offChainMetadata = offChainMetadatas[id]
        const assetSupply = assetSupplies[id]

        const isNFT = onChainMetadata?.key === '721' && assetSupply === 1
        if (isNFT) return result

        const [policyId, assetNameHex] = id.split('.')

        const decimals = onChainMetadata?.decimals ?? offChainMetadata.decimals ?? 0

        const name1 = onChainMetadata?.name ?? offChainMetadata.name ?? ''
        const name = hexToAscii(name1)

        const description1 = onChainMetadata?.description ?? offChainMetadata.description ?? ''
        const description = isArray(description1) ? description1.join(' ') : description1

        const ticker = onChainMetadata?.ticker ?? offChainMetadata.ticker ?? ''

        const tokenInfo: TokenInfo = {
          id,
          group: policyId,
          decimals,
          name,
          description,
          ticker,
          fingerprint: getAssetFingerprint(policyId, assetNameHex),
          symbol: metadata.ticker,
          url: metadata.url,
          logo: isArray(metadata.icon) ? metadata.icon.join('') : metadata.icon,
        }

        return {...result, [id]: tokenInfo}
      }, {})

      state.assetInfos.nfts = Object.entries(onChainMetadatas.nfts).reduce((result, [id, metadata]) => {
        const [policyId, assetNameHex] = id.split('.')
        const description = isArray(metadata.description) ? metadata.description.join(' ') : metadata.description ?? ''
        const originalImage = isArray(metadata.image) ? metadata.image.join('') : metadata.image
        const isIpfsImage = originalImage.startsWith('ipfs://')
        const convertedImage = isIpfsImage ? originalImage.replace('ipfs://', `https://ipfs.io/ipfs/`) : originalImage

        const nftInfo: YoroiNft = {
          id,
          fingerprint: getAssetFingerprint(policyId, assetNameHex),
          name: metadata.name,
          description,
          thumbnail: convertedImage,
          image: convertedImage,
          metadata: {
            policyId,
            assetNameHex,
            originalMetadata: metadata,
          },
        }

        return {...result, [id]: nftInfo}
      }, {})

      state.balances.fts = Amounts.filter(state.balances.all, ({tokenId}) => !!state.assetInfos.fts[tokenId])
      state.balances.nfts = Amounts.filter(state.balances.all, ({tokenId}) => !!state.assetInfos.nfts[tokenId])

      console.log('QWE', state)

      notify(state)
    },
    subscribe,
  } as const
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

export const getAssetSupplies = async (assetIds: Array<string>) => {
  const suppliesRequest = {
    assets: assetIds.map((tokenId) => ({
      name: toAssetName(tokenId),
      policy: toPolicyId(tokenId),
    })),
  }

  const totalSupplies: unknown = await fetchDefault('multiAsset/supply', suppliesRequest, BACKEND)
  if (!isObject(totalSupplies)) throw new Error('Invalid asset supplies')
  if (!hasProperties(totalSupplies, ['supplies'])) throw new Error('Invalid asset supplies')
  if (!isObject(totalSupplies.supplies)) throw new Error('Invalid asset supplies')
  if (!Object.values(totalSupplies.supplies).every((supply) => typeof supply === 'number' || supply === null))
    throw new Error('Invalid asset supplies')

  return totalSupplies.supplies as {[assetId: string]: number | null}
}
