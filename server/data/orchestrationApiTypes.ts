import { components } from '../@types/orchestration-api'

export type AddVisitorToBookerPrisonerRequestDto = components['schemas']['AddVisitorToBookerPrisonerRequestDto']

// visitContact and visitorSupport can be 'null'
// FIXME can API annotations be updated?
export type ApplicationDto = Omit<components['schemas']['ApplicationDto'], 'visitContact' | 'visitorSupport'> & {
  visitContact: components['schemas']['ApplicationDto']['visitContact'] | null
  visitorSupport: components['schemas']['ApplicationDto']['visitorSupport'] | null
}

export type ApplicationValidationErrorResponse = components['schemas']['ApplicationValidationErrorResponse']

export type AuthDetailDto = components['schemas']['AuthDetailDto']

export type AvailableVisitSessionDto = components['schemas']['AvailableVisitSessionDto']

export type AvailableVisitSessionRestrictionDto = components['schemas']['AvailableVisitSessionRestrictionDto']

export type BookingOrchestrationRequestDto = components['schemas']['BookingOrchestrationRequestDto']

// visitorAge can be 'null'
// FIXME can API annotations be updated?
export type BookingRequestVisitorDetailsDto = Omit<
  components['schemas']['BookingRequestVisitorDetailsDto'],
  'visitorAge'
> & {
  visitorAge: components['schemas']['BookingRequestVisitorDetailsDto']['visitorAge'] | null
}

export type BookerPrisonerInfoDto = components['schemas']['BookerPrisonerInfoDto']

export type BookerPrisonerValidationErrorResponse = components['schemas']['BookerPrisonerValidationErrorResponse']

export type BookerPrisonerVisitorRequestDto = components['schemas']['BookerPrisonerVisitorRequestDto']

export type BookerReference = components['schemas']['BookerReference']

export type BookerVisitorRequestValidationErrorResponse =
  components['schemas']['BookerVisitorRequestValidationErrorResponse']

export type CancelVisitOrchestrationDto = components['schemas']['CancelVisitOrchestrationDto']

export type ChangeApplicationDto = components['schemas']['ChangeApplicationDto']

export type ConvictedStatus = BookerPrisonerInfoDto['prisoner']['convictedStatus']

export type CreateApplicationDto = components['schemas']['CreateApplicationDto']

export type CreateVisitorRequestResponseDto = components['schemas']['CreateVisitorRequestResponseDto']

// outcomeStatus can be 'null'
// FIXME can API annotations be updated?
export type OrchestrationVisitDto = Omit<components['schemas']['OrchestrationVisitDto'], 'outcomeStatus'> & {
  outcomeStatus: components['schemas']['OrchestrationVisitDto']['outcomeStatus'] | null
}

export type RegisterPrisonerForBookerDto = components['schemas']['RegisterPrisonerForBookerDto']

export type PrisonDto = components['schemas']['PrisonDto']

export type PrisonRegisterPrisonDto = components['schemas']['PrisonRegisterPrisonDto']

export type VisitDto = components['schemas']['VisitDto']

export type VisitorInfoDto = components['schemas']['VisitorInfoDto']
