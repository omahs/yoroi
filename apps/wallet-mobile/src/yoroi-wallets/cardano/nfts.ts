import {features} from '../../features'
import {getAssetFingerprint} from '../../legacy/format'
import {NFTAsset, YoroiNft} from '../types'
import {hasProperties, isArray, isArrayOfType, isNumber, isObject, isRecord, isString} from '../utils'
import {toAssetName, toPolicyId, toUtf8DecodedAssetName, utf8ToHex} from './api/utils'

export interface ConvertNftParams {
  id: string
  metadata?: unknown
  storageUrl: string
  version: number
}

export const convertNft = ({id, metadata, storageUrl, version}: ConvertNftParams): YoroiNft => {
  const policyId = toPolicyId(id)
  const assetNameReadable = version === 1 ? toAssetName(id) : toUtf8DecodedAssetName(id)
  const assetNameHex = utf8ToHex(assetNameReadable)
  const fingerprint = getAssetFingerprint(policyId, assetNameHex)
  const description = isRecord(metadata) ? normalizeProperty(metadata.description) : undefined
  const originalImage = isRecord(metadata) ? normalizeProperty(metadata.image) : undefined
  const isIpfsImage = !!originalImage?.startsWith('ipfs://')
  const convertedImage = isIpfsImage ? originalImage?.replace('ipfs://', `https://ipfs.io/ipfs/`) : originalImage

  const name = isRecord(metadata) && isString(metadata.name) ? metadata.name : assetNameReadable

  return {
    id,
    fingerprint,
    name,
    description,
    thumbnail: features.moderatingNftsEnabled ? `${storageUrl}/p_${fingerprint}.jpeg` : convertedImage,
    logo: features.moderatingNftsEnabled ? `${storageUrl}/${fingerprint}.jpeg` : convertedImage,
    metadata: {
      policyId,
      assetNameHex,
      originalMetadata: metadata,
    },
  }
}

const normalizeProperty = (value: unknown): string | undefined => {
  if (isString(value)) return value
  if (isArrayOfType(value, isString)) return value.join('')
}

export const isSvgMediaType = (mediaType: unknown): boolean => {
  return mediaType === 'image/svg+xml'
}

export const getNftFilenameMediaType = (nft: YoroiNft, filename: string): string | undefined => {
  const originalMetadata = isRecord(nft.metadata.originalMetadata) ? nft.metadata.originalMetadata : undefined
  const files = originalMetadata?.files ?? []
  if (!isArray(files)) return undefined

  const file = files.find((file) => {
    if (isRecord(file) && hasProperties(file, ['src'])) {
      return normalizeProperty(file.src) === filename
    }
    return false
  })
  return isRecord(file) && hasProperties(file, ['mediaType']) && isString(file.mediaType) ? file.mediaType : undefined
}

export const isAssetNFT = (asset: unknown): asset is NFTAsset => {
  return isObject(asset) && hasProperties(asset, ['key']) && asset.key === NFT_METADATA_KEY
}

export const getNftAssetVersion = (asset: NFTAsset): number => {
  const version = asset.metadata.version
  if (isNumber(version)) {
    return version
  }

  if (isString(version)) {
    return parseInt(version, 10)
  }

  return 1
}

const NFT_METADATA_KEY = '721'
