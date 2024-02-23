import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import config from '../config'

export default function routes({ supportedPrisonsService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const { oneLoginLink } = config

  get('/', (req, res, next) => {
    res.render('pages/index', { user: req.user, oneLoginLink })
  })

  get('/prisons', async (req, res, next) => {
    const prisonIds = await supportedPrisonsService.getSupportedPrisonIds()
    res.render('pages/prisons', { prisonIds })
  })

  return router
}
