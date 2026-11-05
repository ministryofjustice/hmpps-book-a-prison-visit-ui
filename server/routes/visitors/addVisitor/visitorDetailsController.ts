import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { UUID } from 'crypto'
import paths from '../../../constants/paths'
import { dateOfBirthValidationChain } from '../../../utils/validations'
import config from '../../../config'
import { validatePrisonerDisplayId } from '../validations'

export default class VisitorDetailsController {
  public view(): RequestHandler {
    return async (req, res) => {
      req.session.addVisitorJourney = req.session.addVisitorJourney ?? {}
      const { addVisitorJourney } = req.session

      if (config.features.multiplePrisoners) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          return res.redirect(paths.PRISONERS)
        }
        const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: string }>(req)
        const prisoner = req.session.booker!.prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)
        if (!prisoner) {
          return res.redirect(paths.PRISONERS)
        }

        addVisitorJourney.prisoner = prisoner
      } else {
        ;[addVisitorJourney.prisoner] = req.session.booker!.prisoners
      }

      const formValues: Record<string, string> = {
        ...(addVisitorJourney?.visitorDetails && { ...addVisitorJourney.visitorDetails }),
        ...req.flash('formValues')?.[0],
      }

      // Default to updates in Welsh on initial form load if user language is Welsh
      if (req.language === 'cy' && Object.keys(formValues).length === 0) {
        formValues.languagePreference = 'cy'
      }

      return res.render('pages/visitors/addVisitor/visitorDetails', {
        showOLServiceNav: true,
        errors: req.flash('errors'),
        formValues,
        prisoner: addVisitorJourney.prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))

        if (config.features.multiplePrisoners) {
          const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
          return res.redirect(`${paths.ADD_VISITOR.DETAILS}/${prisonerDisplayId}`)
        }
        return res.redirect(paths.ADD_VISITOR.DETAILS)
      }

      const data = <
        {
          firstName: string
          lastName: string
          'visitorDob-day': string
          'visitorDob-month': string
          'visitorDob-year': string
          visitorDob: string
          languagePreference?: 'cy'
        }
      >matchedData(req)

      req.session.addVisitorJourney = req.session.addVisitorJourney ?? {}
      req.session.addVisitorJourney.visitorDetails = {
        firstName: data.firstName,
        lastName: data.lastName,
        'visitorDob-day': data['visitorDob-day'],
        'visitorDob-month': data['visitorDob-month'],
        'visitorDob-year': data['visitorDob-year'],
        visitorDob: data.visitorDob,
        languagePreference: data.languagePreference ?? 'en',
      }

      return res.redirect(paths.ADD_VISITOR.CHECK)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('firstName')
        .trim()
        .isLength({ min: 1, max: 250 })
        .withMessage((_value, { req }) => req.t('validation:firstName')),

      body('lastName')
        .trim()
        .isLength({ min: 1, max: 250 })
        .withMessage((_value, { req }) => req.t('validation:lastName')),

      ...dateOfBirthValidationChain('visitorDob'),

      body('languagePreference').optional().isIn(['cy']),
    ]
  }

  public validatePrisonerDisplayId(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
