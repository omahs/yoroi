import {YoroiToken} from '../../types'

export type TokenApiResponse = Record<string, YoroiToken>

export interface TokenApi {
  tokenRegistryMetadata(ids: readonly string[]): Promise<TokenApiResponse>
  assetMintMetadata(ids: readonly string[]): Promise<TokenApiResponse>
}
