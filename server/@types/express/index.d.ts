import { ValidationError } from 'express-validator'
import { Booker, BookingConfirmed, BookingJourney } from '../bapv'
import { VisitDto } from '../../data/orchestrationApiTypes'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number

    booker: Booker
    bookings?: VisitDto[]
    bookingJourney?: BookingJourney
    bookingConfirmed?: BookingConfirmed
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
      flash(type: 'errors'): ValidationError[]
      flash(type: 'errors', message: ValidationError[]): number
      flash(type: 'formValues'): Record<string, string | string[] | number[]>[]
      flash(type: 'formValues', message: Record<string, string | string[] | number[]>): number
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
    }
  }
}
