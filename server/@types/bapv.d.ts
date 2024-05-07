import { PrisonerBasicInfoDto, VisitorBasicInfoDto } from '../data/orchestrationApiTypes'

export type Booker = {
  reference: string
  prisoners?: PrisonerBasicInfoDto[] // prisoners this booker can book for
}

// data that is built up during a booking journey
export type BookingJourneyData = {
  // selected prisoner for this visit
  prisoner: PrisonerBasicInfoDto
  // all possible visitors for this visit
  allVisitors?: VisitorBasicInfoDto[]
  // selected visitors for this visit
  selectedVisitors?: VisitorBasicInfoDto[]
}
