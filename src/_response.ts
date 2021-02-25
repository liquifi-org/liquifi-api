import { APIGatewayProxyResult } from 'aws-lambda'

export const OK = <T>(body: T): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  }
}

export const BadRequest = (message: string): APIGatewayProxyResult => {
  return {
    statusCode: 400,
    body: JSON.stringify({ message }),
    headers: {
      'content-type': 'application/json'
    }
  }
}

export const ServerError = (message: string): APIGatewayProxyResult => {
  return {
    statusCode: 500,
    body: JSON.stringify({ message }),
    headers: {
      'content-type': 'application/json'
    }
  }
}
