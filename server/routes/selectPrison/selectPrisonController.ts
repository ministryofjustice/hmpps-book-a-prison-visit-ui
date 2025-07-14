import type { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { PrisonService } from '../../services'
import paths from '../../constants/paths'
import config from '../../config'

export default class SelectPrisonController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      delete req.session.selectedPrisonId

      const prisons = await this.prisonService.getAllPrisonNames()

      return res.render('pages/selectPrison/selectPrison', {
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
        return res.redirect(paths.SELECT_PRISON)
      }

      const { prisonId } = matchedData<{ prisonId: string }>(req)
      const isSupportedPrison = await this.prisonService.isSupportedPrison(prisonId)

      if (isSupportedPrison) {
        req.session.selectedPrisonId = prisonId
        return res.redirect(paths.SELECTED_PRISON)
      }

      return res.redirect(config.pvbUrl)
    }
  }

  public validate(): ValidationChain[] {
    return [body('prisonId').isLength({ min: 3, max: 3 }).withMessage('No prison selected')]
  }
}
