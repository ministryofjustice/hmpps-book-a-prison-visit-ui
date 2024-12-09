import passport from 'passport'
import { Client, Issuer, Strategy, StrategyVerifyCallbackUserInfo, UserinfoResponse } from 'openid-client'
import { RequestHandler } from 'express'
import { createPrivateKey } from 'crypto'

import config from '../config'
import logger from '../../logger'
import TokenStore from '../data/tokenStore/tokenStore'
import tokenStoreFactory from '../data/tokenStore/tokenStoreFactory'
import paths from '../constants/paths'

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

const authenticationMiddleware = (): RequestHandler => {
  return async (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect(paths.SIGN_IN)
  }
}

async function init(): Promise<{ client: Client; idTokenStore: TokenStore }> {
  const discoveryEndpoint = `${config.apis.govukOneLogin.url}/.well-known/openid-configuration`

  const issuer = await Issuer.discover(discoveryEndpoint)
  logger.info(`GOV.UK One Login issuer discovered: ${issuer.metadata.issuer}`)

  const idTokenStore = tokenStoreFactory('idToken:')

  // convert private key in PEM format to JWK
  const privateKeyJwk = createPrivateKey({
    key: config.apis.govukOneLogin.privateKey,
  }).export({ format: 'jwk' })

  const client = new issuer.Client(
    {
      client_id: config.apis.govukOneLogin.clientId,
      redirect_uris: [`${config.domain}${paths.AUTH_CALLBACK}`],
      response_types: ['code'],
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'RS256',
      id_token_signed_response_alg: 'ES256',
    },
    { keys: [privateKeyJwk] },
  )

  const verify: StrategyVerifyCallbackUserInfo<UserinfoResponse> = (tokenSet, userInfo, done) => {
    logger.info(`GOV.UK One Login user verified, sub: ${userInfo.sub}`)

    idTokenStore.setToken(encodeURIComponent(userInfo.sub), tokenSet.id_token, config.session.expiryMinutes * 60)
    return done(null, userInfo)
  }

  const strategy = new Strategy(
    {
      client,
      params: {
        scope: 'openid email phone',
        vtr: config.apis.govukOneLogin.vtr,
        ui_locales: 'en',
      },
      usePKCE: false,
      extras: {
        clientAssertionPayload: { aud: issuer.metadata.token_endpoint },
      },
    },
    verify,
  )

  passport.use('oidc', strategy)

  return { client, idTokenStore }
}

export default {
  authenticationMiddleware,
  init,
}
