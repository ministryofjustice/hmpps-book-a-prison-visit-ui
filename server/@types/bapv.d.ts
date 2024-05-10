import { PrisonerInfoDto, VisitorInfoDto } from '../data/orchestrationApiTypes'

export type Booker = {
  reference: string
  prisoners?: PrisonerInfoDto[] // prisoners this booker can book for
}

// data that is built up during a booking journey
export type BookingJourneyData = {
  // selected prisoner for this visit
  prisoner: PrisonerInfoDto
  // all possible visitors for this visit
  allVisitors?: VisitorInfoDto[]
  // selected visitors for this visit
  selectedVisitors?: VisitorInfoDto[]
}
