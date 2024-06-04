import type { RequestHandler } from 'express'
import { ValidationChain, body, validationResult } from 'express-validator'
import { Visitor } from '../../services/bookerService'

export default class MainContactController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedVisitors } = req.session.bookingJourney

      const adults = selectedVisitors.reduce((adultVisitors: Visitor[], visitor: Visitor) => {
        if (visitor.adult ?? true) {
          adultVisitors.push(visitor)
        }

        return adultVisitors
      }, [])

      res.render('pages/bookVisit/mainContact', {
        errors: req.flash('errors'),
        adultVisitors: adults,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { bookingJourney } = req.session
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', req.body)
        return res.redirect(`/book-visit/main-contact`)
      }

      const selectedContact = bookingJourney.selectedVisitors.find(
        (visitor: Visitor) => req.body.contact === visitor.visitorDisplayId.toString(),
      )

      bookingJourney.mainContact = {
        contact: selectedContact,
        phoneNumber: req.body.phoneNumber === 'hasPhoneNumber' ? req.body.phoneNumberInput : undefined,
        contactName: selectedContact === undefined ? req.body.someoneElseName : undefined,
      }

      return res.redirect('/book-visit/check-your-booking')
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
      body('phoneNumber').isIn(['hasPhoneNumber', 'noPhoneNumber']).withMessage('No answer selected'),
      body('phoneNumberInput')
        .trim()
        .custom((value: string, { req }) => {
          if (req.body.phoneNumber === 'hasPhoneNumber') {
            if (value === '') {
              throw new Error('Enter a phone number')
            }
            if (!/^(?:0|\+?44)(?:\d\s?){9,10}$/.test(value)) {
              throw new Error('Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192')
            }
          }
          return true
        }),
    ]
  }
}
