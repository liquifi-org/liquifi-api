import { APIGatewayProxyHandler } from 'aws-lambda'
import client from './apollo/client'
import { EXCHANGE_VOLUMES_QUERY } from './apollo/queries'
import { ExchangeVolumeQuery, ExchangeVolumeQueryVariables } from './generated/subgraph'
import BigNumber from 'bignumber.js'
import { loadPools } from './_shared'
import { OK, ServerError } from './_response'

class PoolSummary {
  [poolId: string]: {
    base_volume: string
    quote_volume: string
    last_price: string
  }
}

export const handler: APIGatewayProxyHandler = async () => {
  try {
    return OK(await loadSummary())
  } catch (error) {
    return ServerError(error.message)
  }
}

export const loadSummary = async (): Promise<PoolSummary> => {
  const pools = await loadPoolsData()
  const volumes = await loadVolumes()

  const result: PoolSummary = {}
  for (const { id, address, last_price } of pools) {
    const { base_volume, quote_volume } = volumes[address.toLowerCase()] ?? { base_volume: 0, quote_volume: 0 }
    result[id] = { base_volume, quote_volume, last_price }
  }
  return result
}

const today = () => {
  return Math.floor(Date.now() / 1000 / 86400) * 86400
}

const yesterday = () => {
  return today() - 86400
}

const loadVolumes = async (): Promise<PoolSummary> => {
  const response = await loadVolumesByDate(yesterday())
  const result: PoolSummary = {}
  for (const { poolAddress, tokenAVolume, tokenBVolume } of response.data.volumes)
    result[poolAddress?.toLowerCase()] = { base_volume: tokenAVolume, quote_volume: tokenBVolume, last_price: '0' }
  return result
}

const loadVolumesByDate = async (date: number) => {
  return await client.query<ExchangeVolumeQuery, ExchangeVolumeQueryVariables>({
    query: EXCHANGE_VOLUMES_QUERY,
    variables: { date },
    fetchPolicy: 'no-cache'
  })
}

const loadPoolsData = async (): Promise<{ id: string; address: string; last_price: string }[]> => {
  const pools = await loadPools()
  const result = []
  for (const pool of pools) {
    const balances = await pool.poolBalances()
    const balanceA = new BigNumber(balances.totalBalanceA.sub(balances.balanceALocked).toString())
    const balanceB = new BigNumber(balances.totalBalanceB.sub(balances.balanceBLocked).toString())
    result.push({
      id: `${await pool.tokenA()}_${await pool.tokenB()}`,
      address: pool.address,
      last_price: balanceB.dividedBy(balanceA).toString()
    })
  }

  return result
}
