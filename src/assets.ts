import { APIGatewayProxyHandler } from 'aws-lambda'
import { loadPools } from './_shared'
import { erc20 } from './_contracts'
import { OK, ServerError } from './_response'

interface AssetsResponse {
  [tokenAddress: string]: TokenData
}

interface TokenData {
  name: string
  symbol: string
  maker_fee: '0'
  taker_fee: '0.003'
}

export const handler: APIGatewayProxyHandler = async () => {
  try {
    return OK(await loadAssets())
  } catch (error) {
    return ServerError(error.message)
  }
}

export const loadAssets = async (): Promise<AssetsResponse> => {
  const pools = await loadPools()

  const result: AssetsResponse = {}
  for (const pool of pools)
    for (const token of [await pool.tokenA(), await pool.tokenB()])
      result[token] = result[token] ?? (await loadTokenData(token))
  return result
}

const loadTokenData = async (address: string): Promise<TokenData> => {
  const token = erc20(address)
  return {
    name: await token.name(),
    symbol: await token.symbol(),
    maker_fee: '0',
    taker_fee: '0.003'
  }
}
