import {features} from '../../../features'
import {getAssetFingerprint} from '../../../legacy/format'
import {YoroiNft} from '../../types'
import {hasProperties, isArray, isNonNullable, isObject, isRecord} from '../../utils'
import {asciiToHex, toAssetName, toPolicyId} from '../api'
import fetchDefault from '../api/fetch'
import {BACKEND} from '../shelley-testnet/constants'

export type OnChainMetadatas = {
  fts: Record<string, FtMetadata>
  nfts: Record<string, NftMetadata>
}
export const getOnChainMetadatas = async ({
  assetIds,
  tokenSuppliesPromise,
}: {
  assetIds: Array<string>
  tokenSuppliesPromise: Promise<{[assetId: string]: number | null}>
}) => {
  const [records, tokenSupplies] = await Promise.all([getOnChainRecords(assetIds), tokenSuppliesPromise])
  const entries = assetIds.map((assetId) => {
    const policyId = toPolicyId(assetId)
    const assetName = toAssetName(assetId)
    const recordKey = `${policyId}.${assetName}`
    const record = records[recordKey]?.[0] ?? fallbackFtEntry(recordKey)

    return [recordKey, record] as const
  })

  const fts: Record<string, FtMetadata> = Object.fromEntries(
    entries
      .filter((entry): entry is [string, FtMetadataRecord] => !isNft(entry, tokenSupplies[entry[0]]))
      .map(formatFtEntry),
  )

  const nfts: Record<string, NftMetadata> = Object.fromEntries(
    entries
      .filter((entry): entry is [string, NftMetadataRecord] => isNft(entry, tokenSupplies[entry[0]]))
      .map((entry) => formatNftEntry(entry)),
  )

  const onChainMetadatas: OnChainMetadatas = {
    fts,
    nfts,
  }

  return onChainMetadatas
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

const getOnChainRecords = async (assetIds: Array<string>) => {
  const metadatasRequest = {
    assets: assetIds.map((tokenId) => ({
      nameHex: asciiToHex(toAssetName(tokenId)),
      policy: toPolicyId(tokenId),
    })),
  }

  const response: unknown = await fetchDefault('multiAsset/metadata', metadatasRequest, BACKEND)

  if (!isObject(response)) throw new Error('Invalid asset metadatas')

  return response as {
    [id: string]: Array<AssetMetadataRecord>
  }
}

type AssetMetadataRecord = FtMetadataRecord | NftMetadataRecord

type NftMetadataRecord = {
  key: '721'
  metadata: {
    [policyId: string]: {
      [assetName: string]: NftMetadata
    }
  }
}

const NFT_METADATA_KEY = '721'

export type NftMetadata = {
  name: string
  image: string | Array<string>
  mediaType?: string
  description?: string | Array<string>
  authors?: string
  author?: string
  files?: Array<{
    name?: string
    mediaType?: string
    src?: string | Array<string>
  }>
}

export type AssetMetadata = {
  [policyID: string]: {
    [assetNameHex: string]: NftMetadata
  }
}

export type NFTAsset = {
  key: '721'
  metadata: AssetMetadata
}

type FtMetadataRecord = {
  key: '20'
  metadata: {
    [policyId: string]: {
      [assetName: string]: FtMetadata
    }
  }
}

type FtMetadata = {
  desc: string | Array<string> | undefined
  icon: string | Array<string> | undefined
  decimals: number | undefined
  ticker: string | undefined
  url: string | undefined
  version: string | undefined
}

const fallbackFtEntry = (policyIdAssetName: string) => {
  const [policyId, assetName] = policyIdAssetName.split('.')

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

const formatFtEntry = ([policyIdAssetName, record]: [string, FtMetadataRecord]) => {
  const [policyId, assetName] = policyIdAssetName.split('.')
  const assetNameHex = asciiToHex(assetName)
  const assetId = `${policyId}.${assetNameHex}`
  const metadata = record.metadata[policyId][assetName]

  return [assetId, metadata] as const
}

const formatNftEntry = ([policyIdAssetName, record]: [string, NftMetadataRecord]) => {
  const [policyId, assetName] = policyIdAssetName.split('.')
  const assetNameHex = asciiToHex(assetName)
  const assetId = `${policyId}.${assetNameHex}`
  const metadata = record.metadata[policyId][assetName]

  return [assetId, metadata] as const
}

const isNft = (
  tuple: readonly [string, AssetMetadataRecord],
  totalSupply: number | null,
): tuple is [string, NftMetadataRecord] => {
  if (totalSupply === null) return false
  if (totalSupply > 1) return false
  if (tuple[1].key !== NFT_METADATA_KEY) return false

  return true
}

export const convertNft = (
  metadata: NftMetadata,
  storageUrl: string,
  policyId: string,
  shortName: string,
): YoroiNft => {
  const assetNameHex = asciiToHex(shortName)
  const fingerprint = getAssetFingerprint(policyId, assetNameHex)
  const description = isArray(metadata.description) ? metadata.description.join(' ') : metadata.description
  const originalImage = isArray(metadata.image) ? metadata.image.join('') : metadata.image
  const isIpfsImage = originalImage.startsWith('ipfs://')
  const convertedImage = isIpfsImage ? originalImage.replace('ipfs://', `https://ipfs.io/ipfs/`) : originalImage
  const id = `${policyId}.${assetNameHex}`

  return {
    id,
    fingerprint,
    name: metadata.name,
    description: description ?? '',
    thumbnail: features.moderatingNftsEnabled ? `${storageUrl}/p_${fingerprint}.jpeg` : convertedImage,
    image: features.moderatingNftsEnabled ? `${storageUrl}/${fingerprint}.jpeg` : convertedImage,
    metadata: {
      policyId,
      assetNameHex,
      originalMetadata: metadata,
    },
  }
}

const parseNFTs = (value: unknown, storageUrl: string): YoroiNft[] => {
  if (!isRecord(value)) {
    throw new Error('Invalid response. Expected to receive object when parsing NFTs')
  }

  const identifiers = Object.keys(value)

  const tokens: Array<YoroiNft | null> = identifiers.map((id) => {
    const assets = value[id]
    if (!isArray(assets)) {
      return null
    }

    const nftAsset = assets.find(isAssetNFT)

    if (!nftAsset) {
      return null
    }

    const [policyId, assetName] = id.split('.')
    const nftMetadata = nftAsset.metadata?.[policyId]?.[assetName]

    if (!nftMetadata || !nftMetadata.image) {
      return null
    }
    return convertNft(nftMetadata, storageUrl, policyId, assetName)
  })

  return tokens.filter(isNonNullable)
}

const isAssetNFT = (asset: unknown): asset is NFTAsset =>
  isObject(asset) && hasProperties(asset, ['key']) && asset.key === NFT_METADATA_KEY

export const foo = {
  '4d99f2fcc2fd91aca97865516b8e77a8e6dc011a905b9960289833e8.V42': [],
  '4d99f2fcc2fd91aca97865516b8e77a8e6dc011a905b9960289833e8.V42/NFT#229770440': [
    {
      key: '721',
      metadata: {
        '4d99f2fcc2fd91aca97865516b8e77a8e6dc011a905b9960289833e8': {
          'V42/NFT#229770440': {
            description: 'V42 NFT Collection',
            files: [
              {
                mediaType: 'image/png',
                name: 'V42/NFT#229770440',
                src: 'ipfs://QmRhTTbUrPYEw3mJGGhQqQST9k86v1DPBiTTWJGKDJsVFw',
              },
            ],
            image: 'ipfs://QmRhTTbUrPYEw3mJGGhQqQST9k86v1DPBiTTWJGKDJsVFw',
            mediaType: 'image/png',
            name: 'V42/NFT#229770440',
          },
        },
        version: '1.0',
      },
    },
  ],
  '5449dbad479b09de066bdf7934799c8a5aa2b66cf4a11eb759aa76c6.TestYoroiNFTdavinciMan': [
    {
      key: '721',
      metadata: {
        '5449dbad479b09de066bdf7934799c8a5aa2b66cf4a11eb759aa76c6': {
          TestYoroiNFTdavinciMan: {
            description: 'davinci man',
            files: [
              {
                mediaType: 'image/png',
                name: 'davinciMan',
                src: 'ipfs://QmXf464J4aLjjBwfdaontdxKsqeEYah7rgh5XiZgQs5yVv',
              },
            ],
            image: 'ipfs://QmXf464J4aLjjBwfdaontdxKsqeEYah7rgh5XiZgQs5yVv',
            mediaType: 'image/png',
            name: 'davinciMan',
          },
        },
        version: '1.0',
      },
    },
  ],
  '775f356c756b70ca6b8e65feec417c7da295179eee6c4bfe9ff33176.TestingTestImage15': [
    {
      key: '721',
      metadata: {
        '775f356c756b70ca6b8e65feec417c7da295179eee6c4bfe9ff33176': {
          TestingTestImage15: {
            description: 'Image #15',
            files: [
              {mediaType: 'image/png', name: 'Image #15', src: 'ipfs://QmZYkfWFWuFyJxGDoPFkiLXk6D7x2FGYdntKawKmZmYxff'},
            ],
            image: 'ipfs://QmZYkfWFWuFyJxGDoPFkiLXk6D7x2FGYdntKawKmZmYxff',
            mediaType: 'image/png',
            name: 'Image #15',
          },
        },
        version: '1.0',
      },
    },
  ],
  '9d88eef1d822a708cad279fc7c79c3936733b236011544f8567f4842.V42': [],
  '9d88eef1d822a708cad279fc7c79c3936733b236011544f8567f4842.V42/NFT#90691472': [
    {
      key: '721',
      metadata: {
        '9d88eef1d822a708cad279fc7c79c3936733b236011544f8567f4842': {
          'V42/NFT#90691472': {
            description: 'V42 NFT Collection',
            files: [
              {
                mediaType: 'image/png',
                name: 'V42/NFT#90691472',
                src: 'ipfs://QmRhTTbUrPYEw3mJGGhQqQST9k86v1DPBiTTWJGKDJsVFw',
              },
            ],
            image: 'ipfs://QmRhTTbUrPYEw3mJGGhQqQST9k86v1DPBiTTWJGKDJsVFw',
            mediaType: 'image/png',
            name: 'V42/NFT#90691472',
          },
        },
        version: '1.0',
      },
    },
  ],
  '9d88eef1d822a708cad279fc7c79c3936733b236011544f8567f4842.V42/NFT#747297547': [
    {
      key: '721',
      metadata: {
        '9d88eef1d822a708cad279fc7c79c3936733b236011544f8567f4842': {
          'V42/NFT#747297547': {
            description: 'V42 NFT Collection',
            files: [
              {
                mediaType: 'image/png',
                name: 'V42/NFT#747297547',
                src: 'ipfs://QmRhTTbUrPYEw3mJGGhQqQST9k86v1DPBiTTWJGKDJsVFw',
              },
            ],
            image: 'ipfs://QmRhTTbUrPYEw3mJGGhQqQST9k86v1DPBiTTWJGKDJsVFw',
            mediaType: 'image/png',
            name: 'V42/NFT#747297547',
          },
        },
        version: '1.0',
      },
    },
  ],
}
