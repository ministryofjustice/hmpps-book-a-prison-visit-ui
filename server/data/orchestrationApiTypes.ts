import { components } from '../@types/orchestration-api'

export type AddVisitorToBookerPrisonerRequestDto = components['schemas']['AddVisitorToBookerPrisonerRequestDto']

export type ApplicationDto = components['schemas']['ApplicationDto']

export type ApplicationValidationErrorResponse = components['schemas']['ApplicationValidationErrorResponse']

export type AuthDetailDto = components['schemas']['AuthDetailDto']

export type AvailableVisitSessionDto = components['schemas']['AvailableVisitSessionDto']

export type AvailableVisitSessionRestrictionDto = components['schemas']['AvailableVisitSessionRestrictionDto']

export type BookingOrchestrationRequestDto = components['schemas']['BookingOrchestrationRequestDto']

export type BookingRequestVisitorDetailsDto = components['schemas']['BookingRequestVisitorDetailsDto']

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

export type OrchestrationVisitDto = components['schemas']['OrchestrationVisitDto']

export type RegisterPrisonerForBookerDto = components['schemas']['RegisterPrisonerForBookerDto']

export type PrisonDto = components['schemas']['PrisonDto']

export type PrisonRegisterPrisonDto = components['schemas']['PrisonRegisterPrisonDto']

export type VisitDto = components['schemas']['VisitDto']

export type VisitorInfoDto = components['schemas']['VisitorInfoDto']
