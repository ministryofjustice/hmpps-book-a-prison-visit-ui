import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ supportedPrisonsService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res, next) => {
    res.render('pages/index')
  })

  get('/prisons', async (req, res, next) => {
    const prisonIds = await supportedPrisonsService.getSupportedPrisonIds()
    res.render('pages/prisons', { prisonIds })
  })

  return router
}
