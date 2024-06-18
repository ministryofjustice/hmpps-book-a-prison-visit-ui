import { AvailableVisitSessionDto, PrisonDto } from '../data/orchestrationApiTypes'
import { Prisoner, Visitor } from '../services/bookerService'

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
