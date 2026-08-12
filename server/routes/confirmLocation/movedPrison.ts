import type { RequestHandler } from 'express'
import { body, matchedData, ValidationChain } from 'express-validator'
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

      const { prisonId } = matchedData<{ prisonId: string }>(req)

      if (prisoner.prisonId !== prisonId) {
        return res.redirect(paths.INCORRECT_LOCATION)
      }

      const isSupportedPrison = await this.prisonService.isSupportedPrison(prisonId)

      if (isSupportedPrison) {
        await this.bookerService.updatePrisonersRegisteredPrison({
          bookerReference: booker.reference,
          prisonerId: prisoner.prisonerNumber,
          prisonId,
        })
        return res.redirect(paths.LOCATION_UPDATED)
      }

      const hasNoDigitalService = config.noDigitalServicePrisonIds.includes(prisonId)

      if (hasNoDigitalService) {
        return res.redirect(paths.UNSUPPORTED_PRISON)
      }

      return res.redirect(paths.PVB_PRISON)
    }
  }

  public updated(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/confirmLocation/prisonUpdated')
    }
  }

  public incorrectLocation(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/confirmLocation/incorrectLocation')
    }
  }

  public pvbPrison(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/confirmLocation/pvbPrison')
    }
  }

  public unsupportedPrison(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/confirmLocation/unsupportedPrison')
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('prisonId')
        .isLength({ min: 3, max: 3 })
        .withMessage((_value, { req }) => req.t('validation:prisonSelectNone')),
    ]
  }
}
