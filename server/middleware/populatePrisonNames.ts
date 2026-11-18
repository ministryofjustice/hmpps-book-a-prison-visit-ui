import { RequestHandler } from 'express'
import { PrisonService } from '../services'

export default function populatePrisonNames(prisonService: PrisonService): RequestHandler {
  return async (_req, res, next) => {
    res.locals.prisonNames = await prisonService.getAllPrisonNames()
    return next()
  }
}
