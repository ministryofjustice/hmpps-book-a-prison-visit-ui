import superagent, { SuperAgentRequest } from 'superagent'

// from https://github.com/govuk-one-login/simulator/blob/main/src/types/authorise-errors.ts
export type AuthoriseError = 'ACCESS_DENIED' | 'TEMPORARILY_UNAVAILABLE'

// from https://github.com/govuk-one-login/simulator/blob/main/src/types/id-token-error.ts
export type IdTokenError =
  | 'INVALID_ISS'
  | 'INVALID_AUD'
  | 'INVALID_ALG_HEADER'
  | 'INVALID_SIGNATURE'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_NOT_VALID_YET'
  | 'NONCE_NOT_MATCHING'
  | 'INCORRECT_VOT'

const url = 'http://localhost:9090/config'

const setAuthoriseError = (error: AuthoriseError): SuperAgentRequest =>
  superagent.post(url).send({ errorConfiguration: { authoriseErrors: [error] } })

const setIdTokenError = (error: IdTokenError): SuperAgentRequest =>
  superagent.post(url).send({ errorConfiguration: { idTokenErrors: [error] } })

const resetErrors = (): SuperAgentRequest => superagent.post(url).send({ errorConfiguration: {} })

export { setAuthoriseError, setIdTokenError, resetErrors }
