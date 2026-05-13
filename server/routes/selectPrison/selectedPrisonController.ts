import type { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class SelectedPrisonController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (!req.session.selectedPrison) {
        return res.redirect(paths.SELECT_PRISON)
      }

      const { prisonId, hasDigitalService } = req.session.selectedPrison

      return res.render('pages/selectPrison/selectedPrison', {
        prisonId,
        hasDigitalService,
      })
    }
  }
}
