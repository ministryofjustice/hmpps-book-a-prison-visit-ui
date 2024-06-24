import type { Router } from 'express'
import express from 'express'
import passport from 'passport'
import flash from 'connect-flash'
import { generators } from 'openid-client'
import govukOneLogin from '../authentication/govukOneLogin'

// Add property used in 'passport.authenticate(strategy, options, callback)'
// strategy options for 'oicd' that is missing from @types/passport
declare module 'passport' {
  interface AuthenticateOptions {
    nonce?: string
  }
}

const router = express.Router()

export default function setUpGovukOneLogin(): Router {
  govukOneLogin.init().then(client => {
    router.use(passport.initialize())
    router.use(passport.session())
    router.use(flash())

    router.get('/autherror', (req, res) => {
      res.status(401)
      return res.render('autherror')
    })

    router.get('/sign-in', (req, res, next) => {
      passport.authenticate('oidc', { nonce: generators.nonce() })(req, res, next)
    })

    router.get('/auth/callback', (req, res, next) => {
      passport.authenticate('oidc', {
        nonce: generators.nonce(),
        successReturnToOrRedirect: req.session.returnTo || '/',
        failureRedirect: '/autherror',
      })(req, res, next)
    })

    router.use('/sign-out', (req, res, next) => {
      if (req.user) {
        req.logout(err => {
          if (err) return next(err)
          return req.session.destroy(() => res.redirect(client.endSessionUrl()))
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
