import { FieldValidationError } from 'express-validator'
import { PrisonDto, PrisonerInfoDto, VisitorInfoDto } from '../data/orchestrationApiTypes'

export type Booker = {
  reference: string
  prisoners?: PrisonerInfoDto[] // prisoners this booker can book for
}

// data that is built up during a booking journey
export type BookingJourneyData = {
  // selected prisoner for this visit
  prisoner: PrisonerInfoDto

  // prison for this visit
  prison?: PrisonDto

  // all possible visitors for this visit
  allVisitors?: VisitorInfoDto[]

  // selected visitors for this visit
  selectedVisitors?: VisitorInfoDto[]
}

export type FlashData = {
  errors?: FieldValidationError[]
  formValues?: Record<string, string | string[] | number[]>
}

// available visit sessions formatted in months/days for calendar component
export type VisitSessionsCalendar = {
  selectedDate: string // TODO consider removing this from here and defaulting/validating in route?
  months: Record<
    string,
    {
      startDayColumn: number // the day column first date should start on (1 = Monday)
      dates: Record<string, { reference: string; time: string; duration: string }[]>
    }
  >
}
