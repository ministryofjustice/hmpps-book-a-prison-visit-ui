import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

// TODO use controller pattern like in Admin UI?
export default function routes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  // TODO this should render a form with the Start button submitting form
  get('/', async (req, res) => {
    const { reference } = req.session.booker
    const prisoners = await service.bookerService.getPrisoners(reference)
    res.render('pages/index', { prisoners })
  })

  // TODO post route starts booking journey by clearing session and populating 'prisoner'
  return router
}
