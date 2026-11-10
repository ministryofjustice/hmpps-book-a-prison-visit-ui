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
      let { addVisitorJourney } = req.session

      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
      const prisoner = config.features.multiplePrisoners
        ? req.session.booker!.prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)
        : req.session.booker!.prisoners[0]

      const errors = validationResult(req)

      if (config.features.multiplePrisoners && (!errors.isEmpty() || !prisoner)) {
        return res.redirect(paths.PRISONERS)
      }

      if (addVisitorJourney?.prisoner.prisonerNumber !== prisoner?.prisonerNumber) {
        delete req.session.addVisitorJourney
        addVisitorJourney = undefined
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
        prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)

      const prisoner = config.features.multiplePrisoners
        ? req.session.booker!.prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)
        : req.session.booker!.prisoners[0]

      if (!errors.isEmpty() || !prisoner) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))

        return res.redirect(
          config.features.multiplePrisoners
            ? `${paths.ADD_VISITOR.DETAILS}/${prisonerDisplayId}`
            : paths.ADD_VISITOR.DETAILS,
        )
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

      req.session.addVisitorJourney = {
        prisoner,
        visitorDetails: {
          firstName: data.firstName,
          lastName: data.lastName,
          'visitorDob-day': data['visitorDob-day'],
          'visitorDob-month': data['visitorDob-month'],
          'visitorDob-year': data['visitorDob-year'],
          visitorDob: data.visitorDob,
          languagePreference: data.languagePreference ?? 'en',
        },
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
