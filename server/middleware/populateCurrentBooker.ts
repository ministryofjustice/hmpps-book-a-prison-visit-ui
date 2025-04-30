import { RequestHandler } from 'express'
import BookerService from '../services/bookerService'
import { AuthDetailDto } from '../data/orchestrationApiTypes'
import paths from '../constants/paths'

export default function populateCurrentBooker(bookerService: BookerService): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!res.locals.user || !res.locals.user.sub || !res.locals.user.email) {
        return res.redirect(paths.SIGN_OUT)
      }

      if (!req.session.booker) {
        const authDetailDto: AuthDetailDto = {
          oneLoginSub: res.locals.user.sub,
          email: res.locals.user.email,
          phoneNumber: res.locals.user.phone_number,
        }

        const reference = await bookerService.getBookerReference(authDetailDto)
        // Prisoner details loaded on home page to refresh so don't auto-populate here
        const prisoners = req.path !== paths.HOME ? await bookerService.getPrisoners(reference) : []
        req.session.booker = { reference, prisoners }
      }
      return next()
    } catch (error) {
      return next(error)
    }
  }
}
