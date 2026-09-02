import { RequestHandler } from 'express'
import paths from '../../../constants/paths'

export default class AddVisitorStartController {
  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session
      const prisoner = booker?.prisoners?.[0]
      if (!prisoner) {
        return res.redirect(paths.VISITS.HOME)
      }

      // if prisoner is not currently in registered prison, send to confirm location route
      if (prisoner.prisonId !== prisoner.registeredPrisonId) {
        return res.redirect(paths.PRISONER_MOVED.CONFIRM_LOCATION)
      }

      delete req.session.addVisitorJourneyResult
      return res.render('pages/visitors/addVisitor/addVisitorStart', { showOLServiceNav: true })
    }
  }
}
