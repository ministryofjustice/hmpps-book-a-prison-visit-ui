import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import type { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'
import paths from './constants/paths'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError | SanitisedError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${req.user?.sub}...'`, error)

    const status = (error as HTTPError).status ?? (error as SanitisedError).responseStatus

    if (status === 401 || status === 403) {
      logger.info('Logging user out')
      return res.redirect(paths.SIGN_OUT)
    }

    res.locals.message = production ? req.t('errors:error.message') : error.message
    res.locals.status = status
    res.locals.stack = production ? null : error.stack
    res.locals.production = production

    res.status(status || 500)

    return res.render('pages/error', { showOLServiceNav: !!req.session?.booker })
  }
}
