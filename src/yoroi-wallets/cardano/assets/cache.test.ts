/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {Chance} from 'chance'

import {YoroiToken} from '../../types'
import {CacheService} from './cache'
import {randomCachedYoroiToken} from './faker'

const mockedStorage = {
  read: jest.fn(),
  write: jest.fn(),
}

describe('CacheService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('cache', () => {
    describe('without warming up', () => {
      const sut = new CacheService<YoroiToken>(mockedStorage)

      expect(sut.ready).toBeFalsy()
    })
  })
  describe('warmUp', () => {
    it('from empty storage', async () => {
      mockedStorage.read.mockResolvedValue([])

      const sut = new CacheService<YoroiToken>(mockedStorage)

      await expect(sut.warmUp()).resolves.not.toThrow()
      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(sut.ready).toBe(true)
    })
    it('from filled storage', async () => {
      const mockedNativeAssets = await randomCachedYoroiToken(10)
      mockedStorage.read.mockResolvedValue(mockedNativeAssets)
      const sut = new CacheService<YoroiToken>(mockedStorage)

      await sut.warmUp()

      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(sut.size).toBe(mockedNativeAssets.length)
      expect(sut.ready).toBe(true)
    })
  })
  describe('getByKey', () => {
    it('return cached records', async () => {
      const [mockedNotExpiredNativeAssets, mockedExpiredNativeAssets] = await Promise.all([
        randomCachedYoroiToken(10),
        randomCachedYoroiToken(10, true),
      ])
      const allMockedAssets = [mockedExpiredNativeAssets, mockedNotExpiredNativeAssets].flat()
      mockedStorage.read.mockResolvedValue(allMockedAssets)

      const sut = new CacheService<YoroiToken>(mockedStorage)
      await sut.warmUp()

      mockedNotExpiredNativeAssets.map(([assetId, asset]) =>
        expect(sut.getByKey(assetId)).toEqual({record: asset.record, expired: false}),
      )
      mockedExpiredNativeAssets.map(([assetId, asset]) =>
        expect(sut.getByKey(assetId)).toEqual({record: asset.record, expired: true}),
      )
      expect(sut.size).toBe(allMockedAssets.length)
    })
  })
  describe('wipe', () => {
    it('wipe out the entire cache', async () => {
      const mockedNativeAssets = await randomCachedYoroiToken(10)
      mockedStorage.read.mockResolvedValue(mockedNativeAssets)
      const sut = new CacheService<YoroiToken>(mockedStorage)

      await sut.warmUp()
      await sut.wipe()

      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(mockedStorage.write).not.toBeCalled()
      expect(sut.size).toBe(0)
    })
  })
  describe('clearByKey', () => {
    it('clear the cache record', async () => {
      const mockedNativeAssets = await randomCachedYoroiToken(10)
      mockedStorage.read.mockResolvedValue(mockedNativeAssets)
      const sut = new CacheService<YoroiToken>(mockedStorage)

      await sut.warmUp()
      await sut.clearByKey(mockedNativeAssets[0][0])
      const after = sut.getByKey(mockedNativeAssets[0][0])

      expect(after.record).toBeNull()
      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(mockedStorage.write).not.toBeCalled()
      expect(sut.size).toBe(mockedNativeAssets.length - 1)
    })
  })
  describe('setByKey', () => {
    it('update the cache record', async () => {
      const c = new Chance()
      const name = c.name({full: true, middle: true})
      const mockedNativeAssets = await randomCachedYoroiToken(10)
      mockedStorage.read.mockResolvedValue(mockedNativeAssets)
      const sut = new CacheService<YoroiToken>(mockedStorage)

      await sut.warmUp()
      const before = await sut.getByKey(mockedNativeAssets[0][0])
      await sut.setByKey(mockedNativeAssets[0][0], {
        ...before.record!,
        name,
      })
      const after = await sut.getByKey(mockedNativeAssets[0][0])

      expect(before.record?.name).not.toBe(name)
      expect(after.record?.name).toBe(name)
      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(mockedStorage.write).not.toBeCalled()
    })
    it('create the cache record if does not exist', async () => {
      const [mockedAssetId, mockedNativeAsset] = (await randomCachedYoroiToken(1))[0]
      mockedStorage.read.mockResolvedValue([])
      const sut = new CacheService<YoroiToken>(mockedStorage)

      await sut.warmUp()
      const before = await sut.getByKey(mockedAssetId)
      await sut.setByKey(mockedAssetId, mockedNativeAsset.record)
      const after = await sut.getByKey(mockedAssetId)

      expect(before.record).toBeNull()
      expect(after.record).toEqual(mockedNativeAsset.record)
      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(mockedStorage.write).not.toBeCalled()
    })
  })
  describe('hasByKey', () => {
    it('the cache record exists', async () => {
      const [mockedAssetId, mockedNativeAsset] = (await randomCachedYoroiToken(1))[0]
      const [mockedExpiredAssetId, mockedExpiredNativeAsset] = (await randomCachedYoroiToken(1, true))[0]
      mockedStorage.read.mockResolvedValue([[mockedExpiredAssetId, mockedExpiredNativeAsset]])
      const sut = new CacheService<YoroiToken>(mockedStorage)

      await sut.warmUp()
      const before = await sut.hasByKey(mockedAssetId)
      await sut.setByKey(mockedAssetId, mockedNativeAsset.record)
      const after = await sut.hasByKey(mockedAssetId)
      const expired = await sut.hasByKey(mockedExpiredAssetId)

      expect(expired).toBeTruthy()
      expect(before).toBeFalsy()
      expect(after).toBeTruthy()
      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(mockedStorage.write).not.toBeCalled()
      expect(sut.size).toBe(2)
    })
  })
  describe('dump', () => {
    it('dump all cache data to disk', async () => {
      const mockedNativeAssets = await randomCachedYoroiToken(10)
      mockedStorage.read.mockResolvedValue(mockedNativeAssets)
      const sut = new CacheService<YoroiToken>(mockedStorage)

      await sut.warmUp()
      await sut.dump()

      expect(mockedStorage.read).toBeCalledTimes(1)
      expect(mockedStorage.write).toBeCalledTimes(1)
    })
  })
})
