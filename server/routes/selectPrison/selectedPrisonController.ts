import type { RequestHandler } from 'express'
import { PrisonService } from '../../services'
import paths from '../../constants/paths'

export default class SelectedPrisonController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedPrisonId } = req.session

      if (!selectedPrisonId) {
        return res.redirect(paths.SELECT_PRISON)
      }

      const { prisonName } = await this.prisonService.getPrison(selectedPrisonId)

      return res.render('pages/selectPrison/selectedPrison', { prisonName })
    }
  }
}
