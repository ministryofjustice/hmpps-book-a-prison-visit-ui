import type { RequestHandler } from 'express'
import { ValidationChain, body, matchedData, validationResult } from 'express-validator'
import { VisitService } from '../../services'
import paths from '../../constants/paths'

export default class MainContactController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedVisitors, mainContact } = req.session.bookingJourney

      const adultVisitors = selectedVisitors.filter(visitor => visitor.adult)

      const selectedMainContact =
        mainContact !== undefined
          ? {
              contact: typeof mainContact.contact === 'string' ? 'someoneElse' : mainContact.contact.visitorDisplayId,
              someoneElseName: typeof mainContact.contact === 'string' ? mainContact.contact : '',
              hasPhoneNumber: mainContact.phoneNumber ? 'yes' : 'no',
              phoneNumber: mainContact.phoneNumber ?? '',
            }
          : {}

      const formValues = {
        ...selectedMainContact,
        ...req.flash('formValues')?.[0],
      }

      res.render('pages/bookVisit/mainContact', {
        errors: req.flash('errors'),
        formValues,
        adultVisitors,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect(paths.BOOK_VISIT.MAIN_CONTACT)
      }

      const { bookingJourney } = req.session
      const { contact, someoneElseName, hasPhoneNumber, phoneNumber } = matchedData<{
        contact?: string
        someoneElseName?: string
        hasPhoneNumber?: 'yes' | 'no'
        phoneNumber?: string
      }>(req)

      if (contact === 'someoneElse') {
        bookingJourney.mainContact = { contact: someoneElseName }
      } else {
        const contactVisitor = bookingJourney.selectedVisitors.find(
          visitor => visitor.visitorDisplayId.toString() === contact,
        )
        bookingJourney.mainContact = { contact: contactVisitor }
      }

      if (hasPhoneNumber === 'yes') {
        bookingJourney.mainContact.phoneNumber = phoneNumber
      }

      await this.visitService.changeVisitApplication({ bookingJourney })

      return res.redirect(paths.BOOK_VISIT.CHECK_DETAILS)
    }
  }

  validate(): ValidationChain[] {
    return [
      body('contact').custom((value: string) => {
        if (!value) {
          throw new Error('No main contact selected')
        }

        return true
      }),
      body('someoneElseName')
        .trim()
        .custom((value: string, { req }) => {
          if (value === '' && req.body.contact === 'someoneElse') {
            throw new Error('Enter the name of the main contact')
          }

          return true
        }),
      body('hasPhoneNumber').isIn(['yes', 'no']).withMessage('No answer selected'),
      body('phoneNumber')
        .trim()
        .custom((value: string, { req }) => {
          if (req.body.hasPhoneNumber === 'yes') {
            if (value === '') {
              throw new Error('Enter a phone number')
            }
            if (!/^(?:0|\+?44)(?:\d\s?){9,10}$/.test(value)) {
              throw new Error('Enter a UK phone number, like 07700 900 982 or 01632 960 001')
            }
          }
          return true
        }),
    ]
  }
}
