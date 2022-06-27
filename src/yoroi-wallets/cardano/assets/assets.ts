import {YoroiToken} from '../../types'
import {TokenApi} from './api'
import {CachedStorage, CacheService} from './cache'

export class NativeAssetService extends CacheService<YoroiToken> {
  constructor(
    storage: CachedStorage, //
    private readonly api: TokenApi,
  ) {
    super(storage)
  }

  public async synchronize(assetIds: readonly string[]): Promise<Map<string, YoroiToken>> {
    if (!this.ready) throw new Error(CacheService.Errors.RequiresWarmUp)
    const assetsToFetch = new Set<string>()
    const result = new Map<string, YoroiToken>()
    let missingRecords = false

    assetIds.forEach((assetId) => {
      const asset = this.getByKey(assetId)
      if (asset.record) {
        result.set(assetId, asset.record)
        if (asset.expired) assetsToFetch.add(assetId)
      } else {
        missingRecords = true
        assetsToFetch.add(assetId)
      }
    })

    if (!missingRecords) return result

    const assetIdsToFetch = Array.from(assetsToFetch)
    const [registryMetadatas, mintMetadatas] = await Promise.all([
      this.api.tokenRegistryMetadata(assetIdsToFetch),
      this.api.assetMintMetadata(assetIdsToFetch),
    ])

    const combinedMetadatas = {...registryMetadatas, ...mintMetadatas}

    Object.entries(combinedMetadatas).forEach(([assetId, yoroiToken]) => {
      result.set(assetId, yoroiToken)
      this.setByKey(assetId, yoroiToken)
    })

    return result
  }
}
