import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { PrisonService } from '../../services'
import paths from '../../constants/paths'

export default class PrisonerLocationController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const selectedPrisonId = req.session.addPrisonerJourney?.selectedPrisonId
      const prisonerDetails = req.session.addPrisonerJourney?.prisonerDetails
      const supportedPrisonIds = await this.prisonService.getSupportedPrisonIds()

      req.session.addPrisonerJourney = {
        supportedPrisonIds,
        ...(selectedPrisonId && { selectedPrisonId }),
        ...(prisonerDetails && { prisonerDetails }),
      }

      const formValues = {
        ...(selectedPrisonId && { prisonId: selectedPrisonId }),
      }

      return res.render('pages/addPrisoner/prisonerLocation', {
        showOLServiceNav: true,
        errors: req.flash('errors'),
        formValues,
        supportedPrisonIds,
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

      const addPrisonerJourney = req.session.addPrisonerJourney!
      const { prisonId } = matchedData<{ prisonId: string }>(req)
      addPrisonerJourney.selectedPrisonId = prisonId

      return res.redirect(paths.ADD_PRISONER.DETAILS)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('prisonId')
        .custom((prisonId: string, { req }) => {
          const supportedPrisonIds = (req as Express.Request).session.addPrisonerJourney?.supportedPrisonIds ?? []
          return supportedPrisonIds.includes(prisonId)
        })
        .withMessage((_value, { req }) => req.t('validation:prisonSelectRequired')),
    ]
  }
}
