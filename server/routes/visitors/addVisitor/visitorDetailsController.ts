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
      const errors = validationResult(req)
      const { prisoners } = req.session.booker!

      if (!errors.isEmpty()) {
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
      }
      // If prisoner doesn't exist, validation will have already caught and redirected
      const prisoner = prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)

      // Old session data won't contain prisoner (pre multiple prisoners feature)
      if (addVisitorJourney?.prisoner && addVisitorJourney?.prisoner.prisonerNumber !== prisoner?.prisonerNumber) {
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
        prisoner: prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId),
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)

      const prisoner = req.session.booker!.prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)

      if (!prisoner) {
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
      }

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))

        return res.redirect(`${paths.ADD_VISITOR.DETAILS}/${prisonerDisplayId}`)
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

      return res.redirect(`${paths.ADD_VISITOR.CHECK}/${prisonerDisplayId}`)
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
