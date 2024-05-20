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

  visitorSupport?: string
}

export type FlashData = {
  errors?: FieldValidationError[]
  formValues?: Record<string, string | string[] | number[]>
}
