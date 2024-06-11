import { FieldValidationError } from 'express-validator'
import { PrisonDto } from '../data/orchestrationApiTypes'
import { Prisoner, Visitor } from '../services/bookerService'
import { SessionRestriction } from '../services/visitSessionsService'

export type Booker = {
  reference: string
  prisoners?: Prisoner[] // prisoners this booker can book for
}

// data that is built up during a booking journey
export type BookingJourney = {
  // selected prisoner for this visit
  prisoner: Prisoner

  // prison for this visit
  prison?: PrisonDto

  // all possible visitors for this visit
  allVisitors?: Visitor[]

  // selected visitors for this visit
  selectedVisitors?: Visitor[]

  // all available calendar / visit sessions (e.g. ['2024-05-28_session-ref'])
  allVisitSessionIds?: string[]

  // whether this visit will be OPEN | CLOSED
  sessionRestriction?: SessionRestriction

  // selected visit session
  selectedSessionDate?: string
  selectedSessionTemplateReference?: string

  // visit application reference
  applicationReference?: string

  // visitor additional support
  visitorSupport?: string

  // main contact
  mainContact?: {
    contact: Visitor | string // either known Visitor or 'other' name
    phoneNumber?: string
  }
}

export type BookingConfirmed = {
  prisonCode: string
  prisonName: string
  visitReference: string
}

export type FlashData = {
  errors?: FieldValidationError[]
  formValues?: Record<string, string | string[] | number[]>
}
