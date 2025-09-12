import type { RequestHandler } from 'express'
import { ValidationChain, body, matchedData, validationResult } from 'express-validator'
import { VisitService } from '../../services'
import paths from '../../constants/paths'
import { getMainContactName } from '../../utils/utils'

export default class ContactDetailsController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { mainContact, mainContactEmail, mainContactPhone } = req.session.bookingJourney

      const formValues = {
        mainContactEmail,
        mainContactPhone,
        getUpdatesBy: [...(mainContactEmail ? ['email'] : []), ...(mainContactPhone ? ['phone'] : [])],
        ...req.flash('formValues')?.[0],
      }

      res.render('pages/bookVisit/contactDetails', {
        errors: req.flash('errors'),
        mainContactName: getMainContactName(mainContact),
        formValues,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect(paths.BOOK_VISIT.CONTACT_DETAILS)
      }

      const { bookingJourney } = req.session
      const { getUpdatesBy, mainContactEmail, mainContactPhone } = matchedData<{
        getUpdatesBy?: string[]
        mainContactEmail?: string
        mainContactPhone?: string
      }>(req)

      bookingJourney.mainContactEmail = getUpdatesBy.includes('email') ? mainContactEmail : undefined
      bookingJourney.mainContactPhone = getUpdatesBy.includes('phone') ? mainContactPhone : undefined

      await this.visitService.changeVisitApplication({ bookingJourney })

      return res.redirect(paths.BOOK_VISIT.CHECK_DETAILS)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('getUpdatesBy', 'Select at least one contact method')
        .toArray()
        .isArray({ min: 1, max: 2 })
        .isIn(['email', 'phone']),
      body('mainContactEmail')
        .if(body('getUpdatesBy').custom((value: string[]) => value.includes('email')))
        .trim()
        .isEmail()
        .withMessage('Enter a valid email address'),
      body('mainContactPhone')
        .if(body('getUpdatesBy').custom((value: string[]) => value.includes('phone')))
        .trim()
        .matches(/^(?:0|\+?44)(?:\d\s?){9,10}$/)
        .withMessage('Enter a UK phone number, like 07700 900 982 or 01632 960 001'),
    ]
  }
}
