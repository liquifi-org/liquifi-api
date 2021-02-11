import { ethers } from 'ethers'
import { PoolFactory__factory } from '../typechain/factories/PoolFactory__factory'
import { DelayedExchangePool__factory } from '../typechain/factories/DelayedExchangePool__factory'
import { DelayedExchangePool } from '../typechain/DelayedExchangePool'
import { ERC20__factory } from '../typechain/factories/ERC20__factory'
import { ERC20 } from '../typechain/ERC20'

const provider = new ethers.providers.JsonRpcProvider(process.env.jsonRpcProvider)
export const poolFactory = PoolFactory__factory.connect(process.env.poolFactoryAddress as string, provider)

export const exchangePool = (address: string): DelayedExchangePool =>
  DelayedExchangePool__factory.connect(address, provider)

export const erc20 = (address: string): ERC20 => ERC20__factory.connect(address, provider)
