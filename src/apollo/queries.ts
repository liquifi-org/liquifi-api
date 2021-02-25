import gql from 'graphql-tag'

export const EXCHANGE_VOLUMES_QUERY = gql`
  query ExchangeVolume($date: BigInt!) {
    volumes: exchangeVolumes(where: { date: $date }) {
      poolAddress
      tokenAVolume
      tokenBVolume
      date
    }
  }
`
export const SWAP_OPERATIONS_QUERY = gql`
  query SwapOperation($timestamp: BigInt!, $tokens: [Bytes!]) {
    simpleSwapOperations(where: { txTimestamp_gte: $timestamp, tokenIn_in: $tokens, tokenOut_in: $tokens }) {
      id
      tokenIn
      amountIn
      tokenOut
      amountOut
      txTimestamp
    }
    delayedSwapOperations(where: { claimOrderTxTimestamp_gte: $timestamp, tokenIn_in: $tokens, tokenOut_in: $tokens, orderClaimed: true }) {
      id
      tokenIn
      amountIn
      tokenOut
      amountAOut
      amountBOut
      claimOrderTxTimestamp
    }
  }
`
