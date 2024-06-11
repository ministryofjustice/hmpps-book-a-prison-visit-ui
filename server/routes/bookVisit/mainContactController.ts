import type { RequestHandler } from 'express'
import { ValidationChain, body, validationResult } from 'express-validator'
import { VisitService } from '../../services'

export default class MainContactController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedVisitors } = req.session.bookingJourney

      const adultVisitors = selectedVisitors.filter(visitor => visitor.adult)

      res.render('pages/bookVisit/mainContact', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0] || {},
        adultVisitors,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', req.body)
        return res.redirect(`/book-visit/main-contact`)
      }

      const { bookingJourney } = req.session
      const { contact }: { contact: string } = req.body

      if (contact === 'someoneElse') {
        bookingJourney.mainContact = { contact: req.body.someoneElseName }
      } else {
        const contactVisitor = bookingJourney.selectedVisitors.find(
          visitor => visitor.visitorDisplayId.toString() === contact,
        )
        bookingJourney.mainContact = { contact: contactVisitor }
      }

      if (req.body.hasPhoneNumber === 'yes') {
        bookingJourney.mainContact.phoneNumber = req.body.phoneNumber
      }

      await this.visitService.changeVisitApplication({ bookingJourney })

      return res.redirect('/book-visit/check-visit-details')
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
