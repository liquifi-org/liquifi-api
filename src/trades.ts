import { APIGatewayProxyHandler } from 'aws-lambda'
import BigNumber from 'bignumber.js'
import client from './apollo/client'
import { SWAP_OPERATIONS_QUERY } from './apollo/queries'
import { SwapOperationQuery, SwapOperationQueryVariables } from './generated/subgraph'
import { BadRequest, OK, ServerError } from './_response'

type SimpleSwapOperation = SwapOperationQuery['simpleSwapOperations'][number]
type DelayedSwapOperation = SwapOperationQuery['delayedSwapOperations'][number]
type TradeType = 'sell' | 'buy'

interface Trade {
  trade_id: string
  price: string
  base_volume: string
  quote_volume: string
  timestamp: string
  type: TradeType
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.pathParameters?.pair || !/^0x[0-9a-fA-F]{40}_0x[0-9a-fA-F]{40}$/.test(event.pathParameters.pair))
    return BadRequest('Invalid token pair: must be of format tokenAddress_tokenAddress')
  const [baseToken, quoteToken] = event.pathParameters.pair.split('_')
  try {
    return OK(await loadOperations(get24HoursAgoTimestamp(), baseToken, quoteToken))
  } catch (error) {
    return ServerError(error.message)
  }
}

const loadOperations = async (timestamp: number, baseToken: string, quoteToken: string) => {
  const response = await client.query<SwapOperationQuery, SwapOperationQueryVariables>({
    query: SWAP_OPERATIONS_QUERY,
    variables: { timestamp, tokens: [baseToken, quoteToken] }
  })
  const result: Trade[] = []
  for (const operation of response.data.simpleSwapOperations) result.push(simpleOperationToTrade(operation, baseToken))
  for (const operation of response.data.delayedSwapOperations)
    result.push(delayedOperationToTrade(operation, baseToken))
  return result.sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
}

const delayedOperationToTrade = (operation: DelayedSwapOperation, baseToken: string): Trade => {
  const type = operationType(operation, baseToken)
  const baseVolume =
    type === 'sell'
      ? new BigNumber(operation.amountIn).minus(operation.amountAOut)
      : new BigNumber(operation.amountIn).minus(operation.amountBOut)
  const quoteVolume = type === 'sell' ? operation.amountBOut : operation.amountAOut
  return {
    trade_id: operation.id,
    type,
    base_volume: baseVolume.toString(),
    quote_volume: quoteVolume.toString(),
    price: new BigNumber(quoteVolume).dividedBy(baseVolume).toString(),
    timestamp: operation.claimOrderTxTimestamp
  }
}

const simpleOperationToTrade = (operation: SimpleSwapOperation, baseToken: string): Trade => {
  const type = operation.tokenOut.toLowerCase() === baseToken.toLocaleLowerCase() ? 'buy' : 'sell'
  const baseVolume = type === 'sell' ? operation.amountIn : operation.amountOut
  const quoteVolume = type === 'sell' ? operation.amountOut : operation.amountIn
  const price = new BigNumber(quoteVolume).dividedBy(baseVolume).toString()
  return {
    trade_id: operation.id,
    price,
    base_volume: baseVolume,
    quote_volume: quoteVolume,
    timestamp: operation.txTimestamp,
    type
  }
}

const operationType = (operation: DelayedSwapOperation | SimpleSwapOperation, baseToken: string): TradeType => {
  return operation.tokenOut.toLowerCase() === baseToken.toLocaleLowerCase() ? 'buy' : 'sell'
}

const get24HoursAgoTimestamp = () => {
  return Math.floor(Date.now() / 1000 - 84600 /*second in 24 hours*/)
}
