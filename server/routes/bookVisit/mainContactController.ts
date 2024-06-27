import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, matchedData, validationResult } from 'express-validator'
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
      body('contact', 'No main contact selected')
        // filter invalid values - it should be a selected adult visitor or 'someoneElse'
        .customSanitizer((contact: string, { req }: Meta & { req: Express.Request }) => {
          if (contact === 'someoneElse') {
            return contact
          }

          const selectedAdultVisitorIds = req.session.bookingJourney.selectedVisitors
            .filter(visitor => visitor.adult)
            .map(visitor => visitor.visitorDisplayId.toString())

          return selectedAdultVisitorIds.includes(contact) ? contact : undefined
        })
        .notEmpty(),
      body('someoneElseName', 'Enter the name of the main contact')
        .if(body('contact').equals('someoneElse'))
        .trim()
        .notEmpty(),
      body('hasPhoneNumber', 'No answer selected').isIn(['yes', 'no']),
      body('phoneNumber', 'Enter a phone number')
        .if(body('hasPhoneNumber').equals('yes'))
        .trim()
        .notEmpty()
        .bail()
        .matches(/^(?:0|\+?44)(?:\d\s?){9,10}$/)
        .withMessage('Enter a UK phone number, like 07700 900 982 or 01632 960 001'),
    ]
  }
}
