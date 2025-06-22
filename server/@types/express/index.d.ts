import { ValidationError } from 'express-validator'
import {
  AddPrisonerJourney,
  Booker,
  BookingCancelled,
  BookingConfirmed,
  BookingJourney,
  FlashFormValues,
  MoJAlert,
} from '../bapv'
import { VisitDetails } from '../../services/visitService'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number

    booker: Booker

    addPrisonerJourney?: AddPrisonerJourney

    bookingJourney?: BookingJourney
    bookingConfirmed?: BookingConfirmed

    bookings?: {
      type: 'future' | 'past' | 'cancelled'
      visits: VisitDetails[]
    }

    bookingCancelled?: BookingCancelled
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
      flash(type: 'errors'): ValidationError[]

      flash(type: 'formValues', message: FlashFormValues): number
      flash(type: 'formValues'): FlashFormValues[]

      flash(type: 'messages', message: MoJAlert): number
      flash(type: 'messages'): MoJAlert[]

      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
      analyticsEnabled?: boolean
    }
  }
}
