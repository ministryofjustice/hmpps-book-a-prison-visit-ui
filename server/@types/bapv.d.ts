import { SessionRestriction } from '../data/orchestrationApiClient'
import { AvailableVisitSessionDto, PrisonDto } from '../data/orchestrationApiTypes'
import { Prisoner, Visitor } from '../services/bookerService'

export type Booker = {
  reference: string
  prisoners: Prisoner[] // prisoners this booker can book for
}

// data that is built up during an add prisoner journey
export type AddPrisonerJourney = {
  supportedPrisonIds: string[]
  selectedPrisonId?: string
}

// data that is built up during a booking journey
export type BookingJourney = {
  // selected prisoner for this visit
  prisoner: Prisoner

  // may be set during journey to flag why a visit cannot be booked
  cannotBookReason?: CannotBookReason

  // prison for this visit
  prison?: PrisonDto

  // all eligible visitors for this visit
  eligibleVisitors?: Visitor[]

  // selected visitors for this visit
  selectedVisitors?: Visitor[]

  // session restriction (OPEN/CLOSED) for this visit
  sessionRestriction?: SessionRestriction

  // all available visit sessions
  allVisitSessionIds?: string[] // e.g. ['2024-05-28_session-ref']
  allVisitSessions?: AvailableVisitSessionDto[]

  // selected visit session
  selectedVisitSession?: AvailableVisitSessionDto

  // visit application reference
  applicationReference?: string

  // visitor additional support
  visitorSupport?: string

  // main contact
  mainContact?: Visitor | string // either known Visitor or 'other' name

  // contact details
  mainContactEmail?: string
  mainContactPhone?: string
}

export type BookingConfirmed = {
  prison: PrisonDto
  visitReference: string
  hasEmail: boolean
  hasMobile: boolean
}

export type BookingCancelled = {
  hasEmail: boolean
  hasMobile: boolean
}

export type CannotBookReason =
  | 'NO_VO_BALANCE'
  | 'TRANSFER_OR_RELEASE'
  | 'UNSUPPORTED_PRISON'
  | 'NO_ELIGIBLE_ADULT_VISITOR'
