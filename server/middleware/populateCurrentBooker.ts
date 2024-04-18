import { RequestHandler } from 'express'
import logger from '../../logger'
import UserService from '../services/userService'
import { AuthDetailDto } from '../data/bookerRegistryApiTypes'

// TODO add tests
export default function populateCurrentBooker(userService: UserService): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.session.bookerReference) {
        const authDetailDto: AuthDetailDto = {
          oneLoginSub: res.locals.user.sub,
          email: res.locals.user.email,
          phoneNumber: res.locals.user.phone_number,
        }
        const { value: bookerReference } = await userService.getBookerReference(authDetailDto)
        req.session.bookerReference = bookerReference
        res.locals.user.bookerReference = bookerReference
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve booker reference for: ${res.locals.user && res.locals.user.sub}`)
      // TODO Here it should log out user?
      next(error)
    }
  }
}
