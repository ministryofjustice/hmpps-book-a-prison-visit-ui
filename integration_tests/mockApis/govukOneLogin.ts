import fs from 'fs'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Response } from 'superagent'
import { createPublicKey } from 'crypto'
import { getMatchingRequests, stubFor } from './wiremock'

let idToken: string

const oidcConfig = JSON.parse(
  fs.readFileSync('integration_tests/mockApis/mappings/openid-configuration.json').toString(),
)

const stubOidcDiscovery = () => stubFor(oidcConfig)

const stubJwks = () => {
  const publicKey = fs.readFileSync('integration_tests/testKeys/server_public_key.pem')
  const publicKeyJwk = createPublicKey({ key: publicKey }).export({ format: 'jwk' })

  return stubFor({
    request: {
      method: 'GET',
      url: '/govukOneLogin/.well-known/jwks.json',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: { keys: [publicKeyJwk] },
    },
  })
}

const redirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/govukOneLogin/authorize',
      queryParameters: {
        response_type: { equalTo: 'code' },
        scope: { equalTo: 'openid email phone' },
        client_id: { equalTo: 'clientId' },
        state: { matches: '.*' },
        redirect_uri: { equalTo: 'http://localhost:3007/auth/callback' },
        nonce: { matches: '.*' },
        vtr: { equalTo: '["Cl.Cm"]' },
        ui_locales: { equalTo: 'en' },
      },
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body><h1>GOV.UK One Login</h1></body></html>',
    },
  })

const getSignInUrl = (nonce?: string): Promise<string> =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/govukOneLogin/authorize',
  }).then(data => {
    const { requests } = data.body
    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    const nonceForToken = nonce || requests[requests.length - 1].queryParams.nonce.values[0]
    // set up /token response while we have access to the nonce
    return token(nonceForToken).then(() => `/auth/callback?code=AUTHORIZATION_CODE&state=${stateValue}`)
  })

const createIdToken = (nonce: string) => {
  const nowTimestamp = new Date().getTime()

  const payload = {
    sub: 'user1',
    iss: 'http://localhost:9091/govukOneLogin/',
    nonce,
    aud: 'clientId',
    exp: nowTimestamp + 180 * 1000, // 3 minutes
    iat: nowTimestamp,
    sid: 'SESSION_IDENTIFIER',
  }

  const privateKey = fs.readFileSync('integration_tests/testKeys/server_private_key.pem')
  idToken = jwt.sign(payload, privateKey, { algorithm: 'ES256' })
}

const token = (nonce: string) => {
  createIdToken(nonce)

  return stubFor({
    request: {
      method: 'POST',
      url: '/govukOneLogin/token',
      headers: {
        'Content-Type': { equalTo: 'application/x-www-form-urlencoded' },
      },
      formParameters: {
        grant_type: { equalTo: 'authorization_code' },
        code: { equalTo: 'AUTHORIZATION_CODE' },
        redirect_uri: { equalTo: 'http://localhost:3007/auth/callback' },
        client_assertion_type: { equalTo: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' },
        client_assertion: { matches: '.*' },
      },
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: {
        access_token: 'ACCESS_TOKEN',
        token_type: 'Bearer',
        expiresIn: 180,
        id_token: idToken,
      },
    },
  })
}

// get the client assertion JWT used for /token request and
// verify its signature with the client's public key
const verifyJwtAssertionForToken = (): Promise<string | JwtPayload> =>
  getMatchingRequests({
    method: 'POST',
    urlPath: '/govukOneLogin/token',
  })
    .then(data => {
      const { requests } = data.body
      const clientJwtAssertion = requests[requests.length - 1].formParams.client_assertion.values[0]
      return clientJwtAssertion
    })
    .then(clientJwtAssertion => {
      return jwt.verify(clientJwtAssertion, fs.readFileSync('integration_tests/testKeys/client_public_key.pem'))
    })

const stubUserInfo = () =>
  stubFor({
    request: {
      method: 'GET',
      url: '/govukOneLogin/userinfo',
      headers: {
        Authorization: { equalTo: 'Bearer ACCESS_TOKEN' },
      },
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: {
        sub: 'user1',
        phone_number_verified: true,
        phone_number: '+440123456789',
        email_verified: true,
        email: 'user1@example.com',
      },
    },
  })

const signOut = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/govukOneLogin/logout',
      queryParameters: {
        id_token_hint: { equalTo: idToken },
        post_logout_redirect_uri: { equalTo: 'http://localhost:3007/signed-out' },
      },
    },
    response: {
      status: 302,
      headers: {
        Location: 'http://localhost:3007/signed-out',
      },
    },
  })

export default {
  getSignInUrl,
  verifyJwtAssertionForToken,
  stubSignIn: (): Promise<[Response, Response, Response, Response]> =>
    Promise.all([stubOidcDiscovery(), stubJwks(), redirect(), stubUserInfo()]),
  stubSignOut: (): Promise<Response> => signOut(),
}
