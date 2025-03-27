import { RequestHandler } from 'express'
import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { PrisonService } from '../../services'
import paths from '../../constants/paths'

export default class PrisonerLocationController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const prisons = await this.prisonService.getSupportedPrisons()

      const supportedPrisonIds = prisons.map(prison => prison.prisonId)
      req.session.addPrisonerJourney = { supportedPrisonIds }

      return res.render('pages/addPrisoner/prisonerLocation', {
        errors: req.flash('errors'),
        prisons,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(paths.ADD_PRISONER.LOCATION)
      }

      const { prisonId } = matchedData<{ prisonId: string }>(req)
      req.session.addPrisonerJourney.selectedPrisonId = prisonId

      return res.redirect(paths.ADD_PRISONER.DETAILS)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('prisonId', 'Select a prison').custom((prisonId: string, { req }: Meta & { req: Express.Request }) => {
        const { addPrisonerJourney } = req.session
        const supportedPrisonIds = addPrisonerJourney?.supportedPrisonIds ?? []

        if (supportedPrisonIds.includes(prisonId)) {
          return true
        }
        return false
      }),
    ]
  }
}
