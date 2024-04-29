import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

// TODO use controller pattern like in Admin UI?
export default function routes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { bookerReference } = res.locals.user
    const prisoner = await service.userService.getPrisoner(bookerReference)

    res.render('pages/index', { prisoner })
  })

  return router
}
