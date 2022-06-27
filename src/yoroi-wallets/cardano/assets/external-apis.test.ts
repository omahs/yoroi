import {rest} from 'msw'
import {setupServer} from 'msw/node'

import {BulkEmurgoAssetApi, BulkTokenRegistryApi, fromMintToYoroiToken, fromRegistryToYoroiToken} from './external-apis'
import {randomMintMetadata, randomTokenRegistryMetadata} from './faker'

const fakeApiUrl = 'http://fake.api'
let mockedTokenRegistryResponse: Awaited<ReturnType<typeof randomTokenRegistryMetadata>>
let handlersTokenRegistry: ReturnType<typeof rest.get>[]
let mockedAssetApi: Awaited<ReturnType<typeof randomMintMetadata>>[]
let handlersAsset: ReturnType<typeof rest.post>[]
let server: ReturnType<typeof setupServer>

describe('external-apis', () => {
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
  })

  afterAll(() => {
    server.close()
  })

  describe('BulkTokenRegistryApi', () => {
    it('tokenRegistryMetadata', async () => {
      const resultAsset = mockedTokenRegistryResponse.reduce((acc, [tokenId, assetMetadata]) => {
        acc[tokenId] = fromRegistryToYoroiToken(assetMetadata, tokenId)
        return acc
      }, {})

      const sut = new BulkTokenRegistryApi(fakeApiUrl)
      const response = await sut.tokenRegistryMetadata(mockedTokenRegistryResponse.map(([tokenId]) => tokenId))

      expect(response).toEqual(resultAsset)
    })
  })
  describe('BulkEmurgoAssetApi', () => {
    it('assetMintMetadata', async () => {
      const resultAsset = {}
      for (let i = 0; i < mockedAssetApi.length; i++) {
        Object.entries(mockedAssetApi[i][1]).reduce((acc, [tokenId, assetMetadata]) => {
          acc[tokenId] = fromMintToYoroiToken(assetMetadata, tokenId)
          return acc
        }, resultAsset)
      }

      const sut = new BulkEmurgoAssetApi(fakeApiUrl)
      const response = await sut.assetMintMetadata(mockedAssetApi[0][0].concat(mockedAssetApi[1][0]))

      expect(response).toEqual(resultAsset)
    })
  })
})
