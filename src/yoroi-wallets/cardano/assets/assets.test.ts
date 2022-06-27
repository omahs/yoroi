/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {rest} from 'msw'
import {setupServer} from 'msw/lib/node'

import {NativeAssetService} from './assets'
import {CacheService} from './cache'
import {BulkEmurgoAssetApi, BulkTokenApi, BulkTokenRegistryApi} from './external-apis'
import {randomMintMetadata, randomTokenRegistryMetadata} from './faker'

let storageData
const mockedStorage = {
  read: () =>
    Promise.resolve(storageData)
      .then((assets) => {
        if (!assets) return []
        const parsedAssets = JSON.parse(assets)
        return parsedAssets
      })
      .catch((e) => {
        console.error(e)
        return []
      }),
  write: (assets) =>
    Promise.resolve(JSON.stringify(assets))
      .then((assets) => (storageData = assets))
      .then(() => {
        return true
      })
      .catch((e) => {
        console.error(e)
        return false
      }),
}

const fakeApiUrl = 'http://fake.api'
let mockedTokenRegistryResponse: Awaited<ReturnType<typeof randomTokenRegistryMetadata>>
let handlersTokenRegistry: ReturnType<typeof rest.get>[]
let mockedAssetApi: Awaited<ReturnType<typeof randomMintMetadata>>[]
let handlersAsset: ReturnType<typeof rest.post>[]
let server: ReturnType<typeof setupServer>

const mockedApi = new BulkTokenApi(fakeApiUrl, fakeApiUrl)

describe('NativeAssetsService', () => {
  beforeAll(async () => {
    mockedTokenRegistryResponse = await randomTokenRegistryMetadata(BulkTokenRegistryApi.requestLimit * 2)
    handlersTokenRegistry = mockedTokenRegistryResponse.map(([tokenId, registryMetadata]) =>
      rest.get(
        `${fakeApiUrl}/${BulkTokenRegistryApi.resources.tokenRegistry}/${tokenId.replace('.', '')}`,
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json(registryMetadata))
        },
      ),
    )
    mockedAssetApi = await Promise.all([
      await randomMintMetadata(BulkEmurgoAssetApi.payloadLimit, 'both', 1, 2),
      await randomMintMetadata(BulkEmurgoAssetApi.payloadLimit - 1, 'both', 1, 2),
    ])
    Array.from([...mockedAssetApi[0][0], ...mockedAssetApi[1][0]]).forEach((id) =>
      handlersTokenRegistry.push(
        rest.get(
          `${fakeApiUrl}/${BulkTokenRegistryApi.resources.tokenRegistry}/${id.replace('.', '')}`,
          (_, res, ctx) => {
            return res(ctx.status(404))
          },
        ),
      ),
    )
    handlersAsset = [
      rest.post<{assets: string[]}>(`${fakeApiUrl}/${BulkEmurgoAssetApi.resources.mintMetadata}`, (req, res, ctx) => {
        const {body} = req
        return res(ctx.status(200), ctx.json(mockedAssetApi[body.assets?.length === 50 ? 0 : 1][1]))
      }),
    ]
    const allHandlers = [...handlersTokenRegistry, ...handlersAsset]
    server = setupServer(...allHandlers)
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    jest.resetAllMocks()
    storageData = undefined
  })

  afterAll(() => {
    server.close()
  })

  describe('synchronize', () => {
    it('without warming up the cache', async () => {
      const sut = new NativeAssetService(mockedStorage, mockedApi)

      await expect(sut.synchronize([])).rejects.toThrowError(CacheService.Errors.RequiresWarmUp)
    })
    it('should retrieve and populate the cache', async () => {
      const sut = new NativeAssetService(mockedStorage, mockedApi)
      const registryIds = mockedTokenRegistryResponse.map(([id]) => id)
      const allIds = [...registryIds, ...mockedAssetApi[0][0], ...mockedAssetApi[1][0]]

      await sut.warmUp()
      const assets = await sut.synchronize(allIds)

      expect(sut.size).toBeGreaterThanOrEqual(assets.size)
    })
  })
})
