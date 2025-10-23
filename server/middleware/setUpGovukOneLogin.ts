import type { Router } from 'express'
import express from 'express'
import passport from 'passport'
import flash from 'connect-flash'
import { generators } from 'openid-client'
import govukOneLogin from '../authentication/govukOneLogin'
import config from '../config'
import paths from '../constants/paths'
import logger from '../../logger'

// Add property used in 'passport.authenticate(strategy, options, callback)'
// strategy options for 'oicd' that is missing from @types/passport
declare module 'passport' {
  interface AuthenticateOptions {
    nonce?: string
  }
}

const router = express.Router()

export default function setUpGovukOneLogin(): Router {
  govukOneLogin.init().then(({ client, idTokenStore }) => {
    router.use(passport.initialize())
    router.use(passport.session())
    router.use(flash())

    router.get(paths.AUTH_ERROR, (req, res) => {
      res.status(401)
      return res.render('authError')
    })

    // don't pass HTTP HEAD requests for /sign-in to oicd Passport strategy because they cause an error in openid-client
    // see - https://github.com/panva/openid-client/discussions/613
    router.head(paths.SIGN_IN, (req, res, next) => {
      res.redirect(paths.HOME)
    })

    router.get(paths.SIGN_IN, (req, res, next) => {
      passport.authenticate('oidc', { nonce: generators.nonce() })(req, res, next)
    })

    router.get(paths.AUTH_CALLBACK, (req, res, next) => {
      const authCallback: passport.AuthenticateCallback = (err, user, info) => {
        // Handle errors
        if (err) {
          logger.error('Authentication error:', err)
          return res.redirect(paths.SIGN_IN)
        }

        // Handle authentication failure
        if (!user) {
          logger.error('Authentication failed:', info)
          return res.redirect(paths.AUTH_ERROR)
        }

        // Successful authentication
        const { returnTo } = req.session
        return req.logIn(user, logInErr => {
          if (logInErr) {
            logger.error('Login error:', logInErr)
            return next(logInErr)
          }
          if (typeof returnTo === 'string' && returnTo.startsWith('/')) {
            return res.redirect(returnTo)
          }
          return res.redirect(paths.HOME)
        })
      }

      passport.authenticate('oidc', authCallback)(req, res, next)
    })

    router.use(paths.SIGN_OUT, async (req, res, next) => {
      if (req.user) {
        const idToken = await idTokenStore.getToken(encodeURIComponent(req.user.sub))
        req.logout(err => {
          if (err) return next(err)
          return req.session.destroy(() =>
            res.redirect(
              client.endSessionUrl({
                id_token_hint: idToken,
                post_logout_redirect_uri: `${config.domain}${paths.SIGNED_OUT}`,
              }),
            ),
          )
        })
      } else res.redirect(client.endSessionUrl())
    })

    router.use((req, res, next) => {
      res.locals.user = req.user
      next()
    })
  })

  return router
}
