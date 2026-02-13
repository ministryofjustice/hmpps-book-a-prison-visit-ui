import * as openidClient from 'openid-client'
import {
  Strategy,
  type AuthenticateOptions,
  type StrategyOptionsWithRequest,
  type VerifyFunctionWithRequest,
} from 'openid-client/passport'
import passport from 'passport'
import flash from 'connect-flash'
import { Request, RequestHandler, Router } from 'express'
import { createPrivateKey } from 'crypto'
import { ServiceUnavailable } from 'http-errors'
import config from '../config'
import logger from '../../logger'
import paths from '../constants/paths'

// GOV.UK One Login properties returned from /userinfo
interface GOVUKOneLoginUserInfoResponse extends openidClient.UserInfoResponse {
  email: string
  email_verified: boolean
  phone_number: string
  phone_number_verified: boolean
}

// Passport strategy for GOV.UK One Login
class GOVUKOneLoginStrategy extends Strategy {
  // Add /authorize request parameters required by GOV.UK One Login
  authorizationRequestParams<TOptions extends AuthenticateOptions>(
    _req: Request,
    _options: TOptions,
  ): Record<string, string> {
    return {
      nonce: openidClient.randomNonce(),
      state: openidClient.randomState(),
      ui_locales: 'en',
      vtr: config.apis.govukOneLogin.vtr,
    }
  }
}

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

export function setUpAuthentication(): Router {
  const router = Router()

  // GOV.UK One Login setup is async so middleware here to check that authentication is ready
  // Requests will be rejected with 503 until the discovery process completes successfully
  let isReady = false
  router.use((req, res, next) => {
    return isReady ? next() : next(new ServiceUnavailable())
  })

  // Actual authentication routes and Passport setup done after discovering the GOV.UK One Login configuration
  discoverClientConfiguration()
    .then((clientConfiguration: openidClient.Configuration) => {
      const strategyOptions: StrategyOptionsWithRequest = {
        config: clientConfiguration,
        scope: 'openid email phone',
        callbackURL: new URL(paths.AUTH_CALLBACK, config.domain),
        passReqToCallback: true,
      }

      const verify: VerifyFunctionWithRequest = async (req, tokens, verified) => {
        try {
          const { iat, sub, vot } = tokens.claims()

          // GOV.UK One Login required ID token validations that openid-client does not do by default
          // Check token issue date not in the future (plus default 30s clock tolerance)
          const nowInSeconds = Math.floor(Date.now() / 1000)
          if (iat > nowInSeconds + 30) {
            throw new Error('Token validation failed: JWT iat claim value failed validation')
          }
          // Check vector of trust (vot) matches that requested with /authorize
          if (`["${vot}"]` !== config.apis.govukOneLogin.vtr) {
            throw new Error('Token validation failed: JWT vot claim value failed validation')
          }

          const userInfo = (await openidClient.fetchUserInfo(
            clientConfiguration,
            tokens.access_token,
            sub,
          )) as GOVUKOneLoginUserInfoResponse

          const user: Express.User = {
            ...userInfo,
            idToken: tokens.id_token, // ID token stored for use in sign-out
          }

          verified(null, user)
        } catch (error) {
          verified(error)
        }
      }

      passport.use('oidc', new GOVUKOneLoginStrategy(strategyOptions, verify))

      router.use(passport.initialize())
      router.use(passport.session())
      router.use(flash())

      router.get(paths.AUTH_ERROR, (req, res) => {
        res.status(401)
        return res.render('authError')
      })

      router.get(paths.SIGN_IN, passport.authenticate('oidc'))

      router.get(paths.AUTH_CALLBACK, (req, res, next): void => {
        const authCallback: passport.AuthenticateCallback = (err, user?, info?) => {
          // Handle errors
          if (err) {
            logger.warn('Authentication error:', err)
            return res.redirect(paths.AUTH_ERROR)
          }

          // Handle authentication failure
          if (!user) {
            logger.warn('Authentication failed:', info)
            return res.redirect(paths.AUTH_ERROR)
          }

          // Successful authentication
          const returnTo = req.session.returnTo || paths.HOME
          return req.logIn(user, loginErr => {
            if (loginErr) {
              logger.warn('Login error:', loginErr)
              return res.redirect(paths.AUTH_ERROR)
            }

            return res.redirect(returnTo)
          })
        }

        passport.authenticate('oidc', authCallback)(req, res, next)
      })

      router.get(paths.SIGN_OUT, async (req, res, next) => {
        if (req.user) {
          const { idToken } = req.user

          req.logout(err => {
            if (err) return next(err)

            return req.session.destroy(() =>
              res.redirect(
                openidClient.buildEndSessionUrl(clientConfiguration, {
                  id_token_hint: idToken,
                  post_logout_redirect_uri: `${config.domain}${paths.SIGNED_OUT}`,
                }).href,
              ),
            )
          })
        } else res.redirect(openidClient.buildEndSessionUrl(clientConfiguration).href)
      })

      router.use((req, res, next) => {
        if (req.user) {
          res.locals.user = req.user
        }
        next()
      })

      isReady = true
      logger.info(`GOV.UK One Login issuer discovered: ${clientConfiguration.serverMetadata().issuer}`)
    })
    .catch(error => {
      logger.error(error, 'Failed to discover GOV.UK One Login configuration')
    })

  return router
}

// Authentication check exported separately so it can be mounted in app.ts after unauthenticated routes
export function authenticationMiddleware(): RequestHandler {
  return async (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect(paths.SIGN_IN)
  }
}

// Call the GOV.UK One Login discovery endpoint to get client configuration
async function discoverClientConfiguration(): Promise<openidClient.Configuration> {
  const server = new URL(config.apis.govukOneLogin.url)
  const { clientId } = config.apis.govukOneLogin
  const clientMetadata: openidClient.ClientMetadata = undefined // no custom metadata required

  const privateKeyPem = config.apis.govukOneLogin.privateKey
  const privateKey = await getPrivateKey(privateKeyPem)

  // Modify the audience claim and remove nbf in the private_key_jwt
  const substituteAudience: openidClient.ModifyAssertionOptions = {
    [openidClient.modifyAssertion]: (_header, payload) => {
      // eslint-disable-next-line no-param-reassign
      payload.aud = `${config.apis.govukOneLogin.url}/token`
      // eslint-disable-next-line no-param-reassign
      payload.nbf = undefined
    },
  }
  const clientAuthentication: openidClient.ClientAuth = openidClient.PrivateKeyJwt(privateKey, substituteAudience)

  const options: openidClient.DiscoveryRequestOptions = {
    execute: [
      // Allow discovery over http on localhost (i.e. when using the Simulator)
      ...(server.hostname === 'localhost' ? [openidClient.allowInsecureRequests] : []),

      // Enable validating JWS signatures
      openidClient.enableNonRepudiationChecks,
    ],
  }

  logger.info(`Attempting GOV.UK One Login metadata discovery for issuer: ${server.href}`)

  return openidClient.discovery(server, clientId, clientMetadata, clientAuthentication, options)
}

async function getPrivateKey(privateKeyPem: string): Promise<openidClient.CryptoKey> {
  // Parse PEM format key
  const privateKeyJwk = createPrivateKey(privateKeyPem).export({ format: 'jwk' })

  // Import the JWK to then return as a CryptoKey
  return crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false, // extractable
    ['sign'], // key usages
  )
}
