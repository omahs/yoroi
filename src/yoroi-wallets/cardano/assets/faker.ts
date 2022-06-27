/* eslint-disable @typescript-eslint/no-non-null-assertion */
import FingerPrint from '@emurgo/cip14-js'
import {Chance} from 'chance'
import {blake2b} from 'hash-wasm'

import {YoroiToken} from '../../types'
import {CachedRecord, CacheService} from './cache'
import {MintMetadata, RegistryMetadata} from './external-apis'

export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

const random224Hash = async (bech32: string): Promise<string> => {
  return await blake2b(bech32, 224)
}

export async function random224Hashes(howMany: number): Promise<Array<string>> {
  const result: Array<string> = []

  for (let i = 0; i < howMany; i++) {
    const hash = await random224Hash(randomInt(1, 1000000000).toString())
    result.push(hash)
  }
  return result
}

export async function randomAssetIds(
  howMany: number,
  separator = '',
  nameIn: 'ascii' | 'hex' = 'ascii',
): Promise<Array<string>> {
  const result: Array<string> = []
  const c = Chance()
  const hashes = await random224Hashes(howMany)

  for (const policyId of hashes) {
    const name = c.name()

    const subject = `${policyId}${separator}${nameIn === 'ascii' ? name : Buffer.from(name).toString('hex')}`

    result.push(subject)
  }

  return result
}

export async function randomCachedYoroiToken(howMany: number, expired?: boolean) {
  const ids: Array<string> = await randomAssetIds(howMany, '.', 'hex')
  const result: Array<[string, CachedRecord<YoroiToken>]> = []

  for (const id of ids) {
    const [policyId, name] = id.split('.')
    const isNFT = randomInt(0, 1) === 1
    const timeToSubtract = expired ? randomInt(CacheService.defaultTtl * 2, CacheService.defaultTtl * 4) : 0
    result.push([
      id,
      {
        _updatedAt: new Date().getTime() - timeToSubtract,
        record: {
          tokenId: id,
          decimals: isNFT ? randomInt(1, 6) : 0,
          image: await randomImageUrl(),
          name,
          isNFT,
          extras: {
            fingerprint: new FingerPrint(
              Buffer.from(policyId ?? '', 'hex'),
              Buffer.from(name ?? '', 'hex'),
            ).fingerprint(),
            assetNameHex: Buffer.from(name).toString('hex'),
            policyId,
          },
        },
      },
    ])
  }

  return result
}

function toTokenValue<T>(value: T) {
  return {
    sequenceNumber: 0,
    value: value,
    signatures: [
      {
        signature:
          '60080d7d1a67c01c3f488b9e6722823bd46d4ea9709a9e51208f9cfbf25ece97071e1501344801faf51c0893ff8ff82bb46615e9b52046d9b5c505b9ce0b9a0a',
        publicKey: '0bde543ff3ec0dfbb8e8716b85fdc8a7e79a4c44da4c601ebe2fc8cc8f9e8fad',
      },
    ],
  }
}

export async function randomTokenRegistryMetadata(howMany: number) {
  const c = Chance()
  const ids: Array<string> = await randomAssetIds(howMany, '.', 'hex')
  const result: Array<[string, RegistryMetadata]> = []

  for (const id of ids) {
    const [policyId, assetNameHex] = id.split('.')
    const name = Buffer.from(assetNameHex, 'hex').toString()
    const ticker = c.string({length: 5, symbols: false, casing: 'upper'})
    const randValue = randomInt(0, 9)
    const randKey = randomInt(0, 9)
    const metadata: RegistryMetadata = {
      name: toTokenValue(name),
      policy: await random224Hash(randomInt(0, Number.MAX_SAFE_INTEGER).toString()),
      subject: `${policyId}${assetNameHex}`,
    }
    if (randKey > 2) metadata.decimals = toTokenValue(randomInt(0, 6))
    if (randKey > 3) metadata.logo = toTokenValue(await randomImageUrl())
    if (randKey > 4) metadata.description = toTokenValue(c.sentence({words: 4, punctuation: false}) + name)
    if (randKey > 5) metadata.ticker = toTokenValue(randValue > 2 ? ticker : '')
    if (randKey > 6) metadata.url = toTokenValue(randValue > 2 ? c.url() : '')

    result.push([id, metadata])
  }

  return result
}

export async function randomImageUrl(width = 320, height = 240): Promise<string> {
  return `https://loremflickr.com/${width}/${height}`
  // taking too long create a buffered pool
  // return await axios.get(`https://loremflickr.com/${width}/${height}`).then((r) => r.request.res.responseUrl)
}

async function randomMintMetadata721(id: string): Promise<MintMetadata> {
  const c = Chance()
  const [policyId, assetNameHex] = id.split('.')
  const assetName = Buffer.from(assetNameHex, 'hex').toString()
  const randMediaType = randomInt(0, 9)
  const randDescription = randomInt(0, 9)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata: any = {
    image: await randomImageUrl(),
    name: assetName,
  }
  if (randMediaType > 2) metadata.mediaType = 'image/jpeg'
  if (randDescription > 5) metadata.description = c.sentence({words: 4, punctuation: false}) + ' ' + assetName
  return {
    key: '721',
    metadata: {
      [policyId]: {
        [assetName]: metadata,
      },
    },
  }
}

async function randomMintMetadata20(id: string): Promise<MintMetadata> {
  const c = Chance()
  const [policyId, assetNameHex] = id.split('.')
  const assetName = Buffer.from(assetNameHex, 'hex').toString()
  const ticker = c.string({length: 5, symbols: false, casing: 'upper'})
  const randValue = randomInt(0, 9)
  const randKey = randomInt(0, 9)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata: any = {}
  if (randKey > 2) metadata.decimals = randomInt(0, 6)
  if (randKey > 3) metadata.logo = await randomImageUrl()
  if (randKey > 4) metadata.description = c.sentence({words: 4, punctuation: false}) + ' ' + assetName
  if (randKey > 5) metadata.ticker = randValue > 2 ? ticker : ''
  if (randKey > 6) metadata.url = randValue > 2 ? c.url() : ''
  return {
    key: '20',
    metadata: {
      [policyId]: {
        [assetName]: metadata,
      },
    },
  }
}

export async function randomMintMetadata(
  howMany: number,
  addInTxMetadataKeyFor: '721' | '20' | 'both' = 'both',
  minMintTxs = 0,
  maxMintTxs = 1,
): Promise<[string[], Record<string, Array<MintMetadata>>]> {
  const ids: Array<string> = await randomAssetIds(howMany, '.', 'hex')
  const result: Record<string, Array<MintMetadata>> = {}

  for (const id of ids) {
    const assetMintTxMetadatas: Array<MintMetadata> = []
    const howManyMintTxs = randomInt(minMintTxs, maxMintTxs)
    for (let i = 0; i < howManyMintTxs; i++) {
      if (addInTxMetadataKeyFor === '721' || (addInTxMetadataKeyFor === 'both' && randomInt(0, 1) === 1)) {
        const assetMetadata721 = await randomMintMetadata721(id)
        assetMintTxMetadatas.push(assetMetadata721)
      }
      if (addInTxMetadataKeyFor === '20' || (addInTxMetadataKeyFor === 'both' && randomInt(0, 1) === 1)) {
        const assetMetadata20 = await randomMintMetadata20(id)
        assetMintTxMetadatas.push(assetMetadata20)
      }
    }
    if (assetMintTxMetadatas.length) result[id] = [...assetMintTxMetadatas]
  }

  return [ids, result]
}
