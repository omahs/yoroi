import AssetFingerprint from '@emurgo/cip14-js'
import axiospkg, {Axios} from 'axios'
import {chunk} from 'lodash'

import {TokenEntry, TokenInfo} from '../../../types'
import {YoroiToken} from '../../types'
import {TokenApi, TokenApiResponse} from './api'

export class BulkTokenRegistryApi {
  static readonly requestLimit = 10
  static readonly resources = Object.freeze({
    tokenRegistry: `metadata`,
  })

  constructor(private readonly _baseUrl: string, private readonly _axios: Axios = axiospkg) {}

  /**
   * @param  {readonlystring[]} ids Ids format "${policyId}.${assetName}" assetName in Hex
   * @example tokenRegistryMetadata(["08ab9fee4d071c36d59275690ad4e529d5dca666d429427684a99c98.50686f65626520526f6467657273"])
   */
  async tokenRegistryMetadata(ids: readonly string[]): Promise<TokenApiResponse> {
    const url = `${this._baseUrl}/${BulkTokenRegistryApi.resources.tokenRegistry}`

    const result: Record<string, YoroiToken> = {}
    const tokenChunks = chunk([...ids], BulkTokenRegistryApi.requestLimit)
    for (const tokensChunk of tokenChunks) {
      const chunkRequests = tokensChunk.map(async (tokenId) => {
        const subject = tokenId.replace('.', '')
        try {
          const response = await this._axios.get<RegistryMetadata>(`${url}/${subject}`)
          return response.data
        } catch (_e) {
          return null
        }
      })
      const chunkResponse = await Promise.all(chunkRequests)
      chunkResponse.forEach((registryResponse, idx) => {
        const tokenId = tokensChunk[idx]
        result[tokenId] = fromRegistryToYoroiToken(registryResponse, tokenId)
      })
    }

    return result
  }
}

export class BulkEmurgoAssetApi {
  static readonly payloadLimit = 50
  static readonly resources = Object.freeze({
    mintMetadata: `multiAsset/metadata`,
  })

  constructor(private readonly _baseUrl: string, private readonly _axios: Axios = axiospkg) {}

  /**
   * @param  {readonlystring[]} ids Ids format "${policyId}.${assetName}" assetName in Hex
   * @example assetMintMetadata(["08ab9fee4d071c36d59275690ad4e529d5dca666d429427684a99c98.50686f65626520526f6467657273"])
   */
  async assetMintMetadata(ids: readonly string[]): Promise<TokenApiResponse> {
    const url = `${this._baseUrl}/${BulkEmurgoAssetApi.resources.mintMetadata}`
    const idsMappedToAscName = ids.map(fromTokenIdNameHexToAsc)
    const assetChunks = chunk([...idsMappedToAscName], BulkEmurgoAssetApi.payloadLimit)

    const promises = assetChunks.map(
      async (chunkOfAssets) =>
        await this._axios.post<Record<string, MintMetadata[]>>(url, {
          assets: chunkOfAssets,
        }),
    )

    const dedupedLastMetadata = new Map<string, YoroiToken>()
    const responses = await Promise.all(promises)
    responses.forEach((response) => {
      if (response.data) {
        Object.entries(response.data).forEach(([assetId, mintTxMetadatas]) =>
          dedupedLastMetadata.set(assetId, fromMintToYoroiToken(mintTxMetadatas, assetId)),
        )
      }
    })

    const result = {}
    dedupedLastMetadata.forEach((lastMetadata, assetId) => (result[assetId] = lastMetadata))
    return result
  }
}

export class BulkTokenApi implements TokenApi {
  private readonly _registryApi: BulkTokenRegistryApi
  private readonly _emurgoApi: BulkEmurgoAssetApi

  constructor(
    private readonly _baseUrlRegistry: string,
    private readonly _baseUrlEmurgo: string,
    private readonly _axios: Axios = axiospkg,
  ) {
    this._emurgoApi = new BulkEmurgoAssetApi(this._baseUrlEmurgo, this._axios)
    this._registryApi = new BulkTokenRegistryApi(this._baseUrlRegistry, this._axios)
  }

  tokenRegistryMetadata(ids: readonly string[]): Promise<TokenApiResponse> {
    return this._registryApi.tokenRegistryMetadata(ids)
  }

  assetMintMetadata(ids: readonly string[]): Promise<TokenApiResponse> {
    return this._emurgoApi.assetMintMetadata(ids)
  }
}

export function fromRegistryToTokenInfo(
  registryMetadata: Readonly<RegistryMetadata> | null,
  tokenId: string,
): TokenInfo {
  if (registryMetadata) {
    const {description, name, subject, decimals, logo, ticker, url} = registryMetadata

    const tokenInfo: TokenInfo = {
      policyId: subject.slice(0, 56),
      assetName: subject.slice(56),
      name: name?.value ?? '',
      longName: description?.value,
      decimals: decimals?.value ?? 0,
      ticker: ticker?.value ?? null,
      logo: logo?.value ?? null,
      url: url?.value ?? null,
    }

    return tokenInfo
  }

  const tokenInfo: TokenInfo = {
    policyId: tokenId.split('.')[0],
    assetName: tokenId.split('.')[1],
    name: '',
    longName: null,
    decimals: 0,
    ticker: null,
    logo: null,
    url: null,
  }

  return tokenInfo
}

export function fromRegistryToYoroiToken(
  registryMetadata: Readonly<RegistryMetadata> | null,
  tokenId: string,
): YoroiToken {
  const policyId = tokenId.split('.')[0]
  const assetNameHex = tokenId.split('.')[1]

  const asset: YoroiToken = {
    tokenId,
    isNFT: false,
    decimals: registryMetadata?.decimals?.value ?? 0,
    image: registryMetadata?.logo?.value ?? null,
    name: Buffer.from(assetNameHex, 'hex').toString(),
    extras: {
      fingerprint: new AssetFingerprint(Buffer.from(policyId, 'hex'), Buffer.from(assetNameHex, 'hex')).fingerprint(),
      assetNameHex: assetNameHex,
      policyId,
    },
  }

  return asset
}

export function fromMintToYoroiToken(mintMetadata: Readonly<MintMetadata[]> | null, tokenId: string): YoroiToken {
  const policyId = tokenId.split('.')[0]
  const assetNameHex = tokenId.split('.')[1]
  const assetName = Buffer.from(assetNameHex, 'hex').toString()
  const fingerprint = new AssetFingerprint(Buffer.from(policyId, 'hex'), Buffer.from(assetName, 'hex')).fingerprint()

  if (!mintMetadata) {
    const asset: YoroiToken = {
      tokenId,
      isNFT: false,
      decimals: 0,
      image: null,
      name: assetName,
      extras: {
        fingerprint,
        assetNameHex,
        policyId,
      },
    }
    return asset
  }

  const isNFT = mintMetadata.filter((m) => m.key === '721').length === 1 ? true : false
  const metadataUpdateIdx = mintMetadata.findIndex((m) => m.metadata?.[policyId]?.[assetName])
  const metadataUpdate =
    metadataUpdateIdx !== -1 ? mintMetadata[metadataUpdateIdx].metadata[policyId][assetName] : undefined

  const decimals = isNFT ? 0 : (metadataUpdate as unknown as MintTokenMetadata)?.decimals ?? 0
  const imageUrl = isNFT
    ? (metadataUpdate as unknown as MintNFTMetadata)?.image
    : (metadataUpdate as unknown as MintTokenMetadata)?.logo

  const asset: YoroiToken = {
    tokenId,
    isNFT,
    decimals,
    image: Array.isArray(imageUrl) ? imageUrl.join('') : imageUrl ?? null,
    name: assetName,
    extras: {
      fingerprint,
      assetNameHex,
      policyId,
    },
  }

  return asset
}

export function fromEntrytoYoroiToken(token: TokenEntry): YoroiToken {
  const [policyId, name] = token.identifier.split('.')
  if (!name) throw new Error('Invalid asset id')
  const fingerprint = new AssetFingerprint(Buffer.from(policyId, 'hex'), Buffer.from(name, 'hex')).fingerprint()
  const assetNameHex = Buffer.from(name).toString('hex')

  return {
    tokenId: token.identifier,
    isNFT: false,
    decimals: 0,
    image: null,
    name,
    extras: {
      fingerprint,
      assetNameHex,
      policyId,
    },
  }
}

export function fromTokenIdNameHexToAsc(tokenId) {
  const separatorIdx = tokenId.indexOf('.')
  if (separatorIdx === -1) throw new Error('Invalid token id, separator')

  const nameInHex = tokenId.substring(separatorIdx + 1)
  if (nameInHex.length < 2) throw new Error('Invalid token id, name')

  const nameInAsc = Buffer.from(nameInHex, 'hex').toString()
  const tokenIdWithNameInAsc = `${tokenId.substring(0, separatorIdx)}.${nameInAsc}`

  return tokenIdWithNameInAsc
}

export type TokenSignature = {
  publicKey: string
  signature: string
}

export type TokenValue<T> = {
  signatures: Array<TokenSignature>
  sequenceNumber: number
  value: T
}

export type RegistryMetadata = {
  subject: string // The base16-encoded policyId + base16-encoded assetName.
  policy?: string // the script that hashes to the policyId
  name: TokenValue<string>
  logo?: TokenValue<string>
  description?: TokenValue<string>
  ticker?: TokenValue<string>
  decimals?: TokenValue<number>
  url?: TokenValue<string>
}

type OtherProperties = {
  [other_properties: string]: unknown
}

type File = {
  name: string
  mediaType: string
  src: string | Array<string>
} & OtherProperties

export type MintNFTMetadata = {
  name: string
  image: string | Array<string>
  mediaType?: `image/${string}`
  description?: string | Array<string>
  files?: Array<File>
} & OtherProperties

type MintNFTRecord = {
  key: '721'
  metadata: {
    [policyId: string]: {
      [assetName: string]: MintNFTMetadata
    }
  }
}

export type MintTokenMetadata = {
  logo?: string
  description?: string | Array<string>
  ticker?: string
  decimals?: number
  url?: string
} & OtherProperties

type MintTokenRecord = {
  key: '20'
  metadata: {
    [policyId: string]: {
      [assetName: string]: MintTokenRecord
    }
  }
}

export type MintMetadata = MintNFTRecord | MintTokenRecord
