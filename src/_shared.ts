import { DelayedExchangePool } from '../typechain/DelayedExchangePool'
import { exchangePool, poolFactory } from './_contracts'

export const loadPools = async (): Promise<DelayedExchangePool[]> => {
  const poolCount = Number(await poolFactory.getPoolCount())
  const result = []
  for (let i = 0; i < poolCount; i++) {
    result.push(exchangePool(await poolFactory.pools(i)))
  }
  return result
}
