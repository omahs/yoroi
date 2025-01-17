import axios from 'axios'

export const SWAP_API_ENDPOINTS = {
  mainnet: {
    getPools: 'https://onchain2.muesliswap.com/pools/pair',
    getOrders: 'https://onchain2.muesliswap.com/orders/all',
    getTokens: 'https://api.muesliswap.com/list',
    constructSwapDatum: 'https://aggregator.muesliswap.com/constructSwapDatum',
    cancelSwapTransaction:
      'https://aggregator.muesliswap.com/cancelSwapTransaction',
  },
  preprod: {
    getPools: 'https://preprod.pools.muesliswap.com/pools/pair',
    getOrders: 'https://preprod.pools.muesliswap.com/orders/all',
    getTokens: 'https://preprod.api.muesliswap.com/list',
    constructSwapDatum:
      'https://aggregator.muesliswap.com/constructTestnetSwapDatum',
    cancelSwapTransaction:
      'https://aggregator.muesliswap.com/cancelTestnetSwapTransaction',
  },
} as const

export const axiosClient = axios.create({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})
