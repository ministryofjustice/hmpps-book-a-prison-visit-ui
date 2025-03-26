import { RequestHandler } from 'express'
import { PrisonService } from '../../services'

export default class PrisonerLocationController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res, next) => {
      const prisons = await this.prisonService.getSupportedPrisons()

      const supportedPrisonIds = prisons.map(prison => prison.prisonId)
      req.session.addPrisonerJourney = { supportedPrisonIds }

      return res.render('pages/addPrisoner/prisonerLocation', {
        errors: req.flash('errors'),
        prisons,
      })
    }
  }
}
