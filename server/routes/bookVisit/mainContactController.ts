import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, matchedData, validationResult } from 'express-validator'
import paths from '../../constants/paths'

export default class MainContactController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedVisitors, mainContact } = req.session.bookingJourney

      const adultVisitors = selectedVisitors.filter(visitor => visitor.adult)

      let contact
      let someoneElseName
      if (mainContact) {
        contact = typeof mainContact === 'string' ? 'someoneElse' : mainContact.visitorDisplayId
        someoneElseName = typeof mainContact === 'string' ? mainContact : ''
      }

      const formValues = {
        contact,
        someoneElseName,
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
      const { contact, someoneElseName } = matchedData<{
        contact?: string
        someoneElseName?: string
      }>(req)

      if (contact === 'someoneElse') {
        bookingJourney.mainContact = someoneElseName
      } else {
        const contactVisitor = bookingJourney.selectedVisitors.find(
          visitor => visitor.visitorDisplayId.toString() === contact,
        )
        bookingJourney.mainContact = contactVisitor
      }

      return res.redirect(paths.BOOK_VISIT.CONTACT_DETAILS)
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
    ]
  }
}
