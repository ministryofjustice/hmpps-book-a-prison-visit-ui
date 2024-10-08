import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import paths from './constants/paths'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${req.user?.sub}...'`, error)

    if (error.status === 401 || error.status === 403) {
      logger.info('Logging user out')
      return res.redirect(paths.SIGN_OUT)
    }

    res.locals.message = production ? 'Sorry, there is a problem with the service.' : error.message
    res.locals.status = production ? null : error.status
    res.locals.stack = production ? null : error.stack

    res.locals.production = production

    res.status(error.status || 500)

    return res.render('pages/error')
  }
}
