import { RequestHandler } from 'express'
import logger from '../../logger'
import BookerService from '../services/bookerService'
import { AuthDetailDto } from '../data/orchestrationApiTypes'

// TODO add tests
export default function populateCurrentBooker(bookerService: BookerService): RequestHandler {
  return async (req, res, next) => {
    // TODO if there is no SUB and EMAIL then log user out?
    try {
      if (!req.session.booker) {
        const authDetailDto: AuthDetailDto = {
          oneLoginSub: res.locals.user.sub,
          email: res.locals.user.email,
          phoneNumber: res.locals.user.phone_number,
        }
        const reference = await bookerService.getBookerReference(authDetailDto)

        req.session.booker = { reference }
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve booker reference for: ${res.locals.user?.sub}`)
      // TODO Here it should log out user? e.g. if 404 from getBookerReference()
      next(error)
    }
  }
}
