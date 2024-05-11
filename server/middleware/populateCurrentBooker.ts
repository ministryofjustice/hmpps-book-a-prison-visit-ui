import { RequestHandler } from 'express'
import logger from '../../logger'
import BookerService from '../services/bookerService'
import { AuthDetailDto } from '../data/orchestrationApiTypes'

export default function populateCurrentBooker(bookerService: BookerService): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!res.locals.user || !res.locals.user.sub || !res.locals.user.email) {
        return res.redirect('/sign-out')
      }

      if (!req.session.booker) {
        const authDetailDto: AuthDetailDto = {
          oneLoginSub: res.locals.user.sub,
          email: res.locals.user.email,
          phoneNumber: res.locals.user.phone_number,
        }

        const reference = await bookerService.getBookerReference(authDetailDto)
        req.session.booker = { reference }
      }
      return next()
    } catch (error) {
      if (error.status === 404) {
        logger.info(`Failed to retrieve booker reference for: ${res.locals.user.sub}`)
        return res.redirect('/autherror')
      }

      return next(error)
    }
  }
}
