import type { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { BookerService, PrisonService } from '../../services'
import paths from '../../constants/paths'
import config from '../../config'

export default class MovedPrisonController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly prisonService: PrisonService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const booker = req.session.booker!
      const prisoner = booker.prisoners?.length ? booker.prisoners[0] : null

      return res.render('pages/confirmLocation/selectPrison', {
        errors: req.flash('errors'),
        prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const booker = req.session.booker!
      const prisoner = booker.prisoners[0]

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(paths.PRISONER_MOVED.CONFIRM_LOCATION)
      }

      const { prisonId } = matchedData<{ prisonId: string }>(req)
      req.session.confirmLocationSelectedPrison = prisonId

      if (prisoner.prisonId !== prisonId) {
        return res.redirect(paths.PRISONER_MOVED.INCORRECT_LOCATION)
      }

      const isSupportedPrison = await this.prisonService.isSupportedPrison(prisonId)

      if (isSupportedPrison) {
        await this.bookerService.updatePrisonersRegisteredPrison({
          bookerReference: booker.reference,
          prisonerId: prisoner.prisonerNumber,
          prisonId,
        })
        return res.redirect(paths.PRISONER_MOVED.LOCATION_UPDATED)
      }

      const hasNoDigitalService = config.noDigitalServicePrisonIds.includes(prisonId)

      if (hasNoDigitalService) {
        return res.redirect(paths.PRISONER_MOVED.UNSUPPORTED_PRISON)
      }

      return res.redirect(paths.PRISONER_MOVED.PVB_PRISON)
    }
  }

  public viewResult(result: 'prisonUpdated' | 'incorrectLocation' | 'pvbPrison' | 'unsupportedPrison'): RequestHandler {
    return async (req, res) => {
      const booker = req.session.booker!
      const prisoner = booker.prisoners?.length ? booker.prisoners[0] : null
      const { confirmLocationSelectedPrison } = req.session

      if (!confirmLocationSelectedPrison) {
        return res.redirect(paths.PRISONER_MOVED.CONFIRM_LOCATION)
      }

      return res.render(`pages/confirmLocation/${result}`, {
        confirmLocationSelectedPrison,
        prisoner,
        pvbUrl: config.pvbUrl,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('prisonId', (_value, { req }) => req.t('validation:prisonSelectNone'))
        .isLength({ min: 3, max: 3 })
        .bail()
        .isAlpha(),
    ]
  }
}
