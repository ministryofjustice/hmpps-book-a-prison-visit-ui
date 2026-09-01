import { RequestHandler } from 'express'
import paths from '../../../constants/paths'

export default class AddVisitorStartController {
  public view(): RequestHandler {
    return async (req, res) => {
      // if prisoner is not currently in registered prison, send to confirm location route
      const booker = req.session.booker!
      const prisoner = booker.prisoners[0]

      if (prisoner.prisonId !== prisoner.registeredPrisonId) {
        return res.redirect(paths.PRISONER_MOVED.CONFIRM_LOCATION)
      }

      delete req.session.addVisitorJourneyResult
      return res.render('pages/visitors/addVisitor/addVisitorStart', { showOLServiceNav: true })
    }
  }
}
