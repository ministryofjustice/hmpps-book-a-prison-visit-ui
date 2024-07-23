import type { Router } from 'express'
import express from 'express'
import passport from 'passport'
import flash from 'connect-flash'
import { generators } from 'openid-client'
import govukOneLogin from '../authentication/govukOneLogin'
import config from '../config'
import paths from '../constants/paths'

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

    router.get('/auth-error', (req, res) => {
      res.status(401)
      return res.render('authError')
    })

    router.get('/sign-in', (req, res, next) => {
      passport.authenticate('oidc', { nonce: generators.nonce() })(req, res, next)
    })

    router.get('/auth/callback', (req, res, next) => {
      passport.authenticate('oidc', {
        nonce: generators.nonce(),
        successReturnToOrRedirect: req.session.returnTo || '/',
        failureRedirect: '/auth-error',
      })(req, res, next)
    })

    router.use('/sign-out', async (req, res, next) => {
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
