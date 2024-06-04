import { ValidationError } from 'express-validator'
import { Booker, BookingJourney } from '../bapv'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number

    booker: Booker
    bookingJourney: BookingJourney
  }
}

export declare global {
  namespace Express {
    interface User {
      sub: string
      email: string
      email_verified?: boolean
      phone_number?: string
      phone_number_verified?: boolean
    }

    interface Request {
      id: string
      flash(type: 'errors', message: ValidationError[]): number
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
    }
  }
}
