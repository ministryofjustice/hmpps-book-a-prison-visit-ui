import { RequestHandler } from 'express'
import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { PrisonService } from '../../services'
import paths from '../../constants/paths'

export default class PrisonerLocationController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const selectedPrison = req.session.addPrisonerJourney?.selectedPrison
      const prisons = await this.prisonService.getSupportedPrisons()

      req.session.addPrisonerJourney = {
        supportedPrisons: prisons,
        ...(selectedPrison && { selectedPrison }),
      }

      const formValues = {
        ...(selectedPrison && { prisonId: selectedPrison.prisonId }),
      }

      return res.render('pages/addPrisoner/prisonerLocation', {
        errors: req.flash('errors'),
        formValues,
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

      const { addPrisonerJourney } = req.session
      const { prisonId } = matchedData<{ prisonId: string }>(req)
      addPrisonerJourney.selectedPrison = addPrisonerJourney.supportedPrisons.find(
        prison => prison.prisonId === prisonId,
      )

      return res.redirect(paths.ADD_PRISONER.DETAILS)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('prisonId', 'Select a prison').custom((prisonId: string, { req }: Meta & { req: Express.Request }) => {
        const supportedPrisons = req.session.addPrisonerJourney?.supportedPrisons ?? []
        return supportedPrisons.some(prison => prison.prisonId === prisonId)
      }),
    ]
  }
}
