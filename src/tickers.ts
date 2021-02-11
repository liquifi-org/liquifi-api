import { APIGatewayProxyHandler } from 'aws-lambda'
import { loadSummary } from './summary'
import { loadAssets } from './assets'
import { OK, ServerError } from './_response'

interface Tikers {
  [id: string]: Tiker
}

interface Tiker {
  base_id: string
  base_name: string
  base_symbol: string
  quote_id: string
  quote_name: string
  quote_symbol: string
  last_price: string
  base_volume: string
  quote_volume: string
}

export const handler: APIGatewayProxyHandler = async () => {
  try {
    return OK(await loadTikers())
  } catch (error) {
    return ServerError(error.message)
  }
}

const loadTikers = async (): Promise<Tikers> => {
  const summary = await loadSummary()
  const assets = await loadAssets()
  const result: Tikers = {}

  for (const pool in summary) {
    const [base, quote] = extractTokens(pool)
    result[pool] = {
      base_id: base,
      base_name: assets[base].name,
      base_symbol: assets[base].symbol,
      quote_id: quote,
      quote_name: assets[quote].name,
      quote_symbol: assets[quote].symbol,
      last_price: summary[pool].last_price,
      base_volume: summary[pool].base_volume,
      quote_volume: summary[pool].quote_volume
    }
  }
  return result
}

const extractTokens = (poolId: string): [string, string] => {
  const tokens = poolId.split('_')
  return [tokens[0], tokens[1]]
}
