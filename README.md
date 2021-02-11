# Liquifi API

## Prerequisites
#### Install Yarn
```sh
$ npm install -g yarn
```
#### Install Dependencies
```sh
$ yarn install
```

## Calling functions locally (Ropsten Network)
### Summary
```sh
$ yarn sls invoke local --function summary --ethereum-network=ropsten
```
### Assets
```sh
$ yarn sls invoke local --function assets --ethereum-network=ropsten
```
### Tikers
```sh
$ yarn sls invoke  local --function tickers --ethereum-network=ropsten
```
### Trades
```sh
$ yarn sls invoke local --function trades --ethereum-network=ropsten -d '{"pathParameters": {"pair": "0xc778417E063141139Fce010982780140Aa0cD5Ab_0xaD6D458402F60fD3Bd25163575031ACDce07538D"}}'

$ yarn sls invoke local --function trades --ethereum-network=ropsten -d '{"pathParameters": {"pair": "0xaD6D458402F60fD3Bd25163575031ACDce07538D_0xc778417E063141139Fce010982780140Aa0cD5Ab"}}'
```
### Order Book
```sh
$ yarn sls invoke local --function orderbook --ethereum-network=ropsten -d '{"pathParameters": {"pair": "0xc778417E063141139Fce010982780140Aa0cD5Ab_0xaD6D458402F60fD3Bd25163575031ACDce07538D"}}'

$ yarn sls invoke local --function orderbook --ethereum-network=ropsten -d '{"pathParameters": {"pair": "0xaD6D458402F60fD3Bd25163575031ACDce07538D_0xc778417E063141139Fce010982780140Aa0cD5Ab"}}'
```

## Deploying the API

The API uses the [serverless framework](https://serverless.com) and can easily be deployed to any AWS account,
via the `yarn deploy` command or `yarn deploy:{ethereum-network}`.

In order to configure your AWS account as a target, 
see [the serverless docs](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/).

## Config variables
Config variables are located within `serverless.yml`: `custom.config.{ethereum-network}`