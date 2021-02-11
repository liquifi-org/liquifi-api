import { APIGatewayProxyHandler } from 'aws-lambda'
import { BigNumber } from 'bignumber.js'
import { exchangePool, poolFactory } from './_contracts'
import { BadRequest, OK, ServerError } from './_response'

const FEE = 0.997

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.pathParameters?.pair || !/^0x[0-9a-fA-F]{40}_0x[0-9a-fA-F]{40}$/.test(event.pathParameters.pair))
    return BadRequest('Invalid token pair: must be of format tokenAddress_tokenAddress')
  const [baseToken, quoteToken] = event.pathParameters.pair.split('_')
  try {
    return OK(await orderbook(baseToken, quoteToken))
  } catch (error) {
    return ServerError(error.message)
  }
}

const orderbook = async (baseToken: string, quoteToken: string) => {
  const pool = exchangePool(await poolFactory.findPool(baseToken, quoteToken))
  const balances = await pool.poolBalances()
  const poolBaseToken = await pool.tokenA()

  const baseTokenBalance =
    baseToken.toLocaleLowerCase() === poolBaseToken
      ? balances.totalBalanceA.sub(balances.balanceALocked)
      : balances.totalBalanceB.sub(balances.balanceBLocked)

  const quoteTokenBalance =
    baseToken.toLocaleLowerCase() === poolBaseToken
      ? balances.totalBalanceB.sub(balances.balanceBLocked)
      : balances.totalBalanceA.sub(balances.balanceALocked)

  return computeBidsAsks(new BigNumber(baseTokenBalance.toString()), new BigNumber(quoteTokenBalance.toString()))
}

function getAmountOut(
  amountIn: BigNumber,
  balanceIn: BigNumber,
  balanceOut: BigNumber
): { amountOut: BigNumber; reservesInAfter: BigNumber; reservesOutAfter: BigNumber } {
  const amountOut = amountIn.eq(0)
    ? new BigNumber(0)
    : balanceOut.minus(balanceOut.multipliedBy(balanceIn).dividedBy(balanceIn.plus(amountIn.multipliedBy(FEE))))
  return {
    amountOut,
    reservesInAfter: balanceIn.plus(amountIn),
    reservesOutAfter: balanceOut.minus(amountOut)
  }
}

function getAmountIn(
  amountOut: BigNumber,
  balanceIn: BigNumber,
  balanceOut: BigNumber
): { amountIn: BigNumber; reservesInAfter: BigNumber; reservesOutAfter: BigNumber } {
  const amountIn = amountOut.eq(0)
    ? new BigNumber(0)
    : amountOut.isGreaterThanOrEqualTo(balanceOut)
    ? new BigNumber(Infinity)
    : balanceIn.multipliedBy(balanceOut).dividedBy(balanceOut.minus(amountOut)).minus(balanceIn).dividedBy(FEE)

  return {
    amountIn,
    reservesInAfter: balanceIn.plus(amountIn),
    reservesOutAfter: balanceOut.minus(amountOut)
  }
}

export function computeBidsAsks(
  baseBalance: BigNumber,
  quoteBalance: BigNumber,
  numSegments = 200
): { bids: [string, string][]; asks: [string, string][] } {
  if (baseBalance.eq(0) || quoteBalance.eq(0)) {
    return {
      bids: [],
      asks: []
    }
  }

  // we don't do exactly 100 segments because we do not care about the trade that takes exact out of entire reserves
  const increment = baseBalance.dividedBy(numSegments + 1)
  const baseAmounts = Array.from({ length: numSegments }, (x, i): BigNumber => increment.multipliedBy(i))

  const bids = baseAmounts.map((buyBaseAmount): [string, string] => {
    const { reservesInAfter: baseReservesBefore, reservesOutAfter: quoteReservesBefore } = getAmountOut(
      buyBaseAmount,
      baseBalance,
      quoteBalance
    )
    const { amountOut } = getAmountOut(increment, baseReservesBefore, quoteReservesBefore)
    return [increment.toString(), amountOut.dividedBy(increment).toString()]
  })

  const asks = baseAmounts.map((sellBaseAmount): [string, string] => {
    const { reservesInAfter: baseReservesBefore, reservesOutAfter: quoteReservesBefore } = getAmountIn(
      sellBaseAmount,
      quoteBalance,
      baseBalance
    )
    const { amountIn } = getAmountIn(increment, baseReservesBefore, quoteReservesBefore)
    return [increment.toString(), amountIn.dividedBy(increment).toString()]
  })

  return {
    bids,
    asks
  }
}
