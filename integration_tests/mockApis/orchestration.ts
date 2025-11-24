import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import {
  ApplicationDto,
  AvailableVisitSessionDto,
  BookerReference,
  PrisonDto,
  BookerPrisonerInfoDto,
  VisitDto,
  VisitorInfoDto,
  RegisterPrisonerForBookerDto,
  BookingRequestVisitorDetailsDto,
  BookerVisitorRequestValidationErrorResponse,
  AddVisitorToBookerPrisonerRequestDto,
} from '../../server/data/orchestrationApiTypes'
import { SessionRestriction } from '../../server/data/orchestrationApiClient'

export default {
  // orchestration-visits-controller

  stubBookVisit: ({
    visit,
    bookerReference,
    isRequestBooking,
    visitorDetails,
  }: {
    visit: VisitDto
    bookerReference: string
    isRequestBooking: boolean
    visitorDetails: BookingRequestVisitorDetailsDto[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.applicationReference}/book`,
        bodyPatterns: [
          {
            equalToJson: {
              applicationMethodType: 'WEBSITE',
              allowOverBooking: false,
              actionedBy: bookerReference,
              userType: 'PUBLIC',
              isRequestBooking,
              visitorDetails,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },

  stubCancelVisit: ({
    reference,
    bookerReference,
  }: {
    reference: string
    bookerReference: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${reference}/cancel`,
        bodyPatterns: [
          {
            equalToJson: {
              cancelOutcome: {
                outcomeStatus: 'BOOKER_CANCELLED',
              },
              applicationMethodType: 'WEBSITE',
              actionedBy: bookerReference,
              userType: 'PUBLIC',
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },

  stubGetFuturePublicVisits: ({
    bookerReference = TestData.bookerReference(),
    visits = [],
  }: {
    bookerReference: BookerReference
    visits: VisitDto[]
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${bookerReference}/visits/booked/future`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visits,
      },
    }),

  stubGetPastPublicVisits: ({
    bookerReference = TestData.bookerReference(),
    visits = [],
  }: {
    bookerReference: BookerReference
    visits: VisitDto[]
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${bookerReference}/visits/booked/past`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visits,
      },
    }),

  stubGetCancelledPublicVisits: ({
    bookerReference = TestData.bookerReference(),
    visits = [],
  }: {
    bookerReference: BookerReference
    visits: VisitDto[]
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${bookerReference}/visits/cancelled`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visits,
      },
    }),

  // orchestration-applications-controller

  stubChangeVisitApplication: (application: ApplicationDto): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/application/${application.reference}/slot/change`,
        bodyPatterns: [
          {
            equalToJson: {
              applicationRestriction: application.visitRestriction,
              sessionTemplateReference: application.sessionTemplateReference,
              sessionDate: application.startTimestamp.split('T')[0],
              visitContact: application.visitContact,
              visitors: application.visitors,
              visitorSupport: application.visitorSupport,
              allowOverBooking: false,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: application,
      },
    })
  },

  stubCreateVisitApplication: ({
    application,
    bookerReference,
  }: {
    application: ApplicationDto
    bookerReference: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/orchestration/visits/application/slot/reserve',
        bodyPatterns: [
          {
            equalToJson: {
              prisonerId: application.prisonerId,
              sessionTemplateReference: application.sessionTemplateReference,
              sessionDate: application.startTimestamp.split('T')[0],
              applicationRestriction: application.visitRestriction,
              visitors: application.visitors,
              userType: 'PUBLIC',
              actionedBy: bookerReference,
              allowOverBooking: false,
            },
          },
        ],
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: application,
      },
    })
  },

  stubCreateVisitApplicationFail: (statusCode = 400): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/orchestration/visits/application/slot/reserve',
      },
      response: {
        status: statusCode,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },

  // public-booker-controller

  stubGetBookerReference: (bookerReference = TestData.bookerReference()): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        url: '/orchestration/public/booker/register/auth',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: bookerReference,
      },
    }),

  stubAddVisitorRequest: ({
    bookerReference = TestData.bookerReference().value,
    prisonerId = TestData.bookerPrisonerInfoDto().prisoner.prisonerNumber,
    addVisitorRequest = TestData.addVisitorRequest(),
  }: {
    bookerReference?: string
    prisonerId?: string
    addVisitorRequest?: AddVisitorToBookerPrisonerRequestDto
  } = {}): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: `/orchestration/public/booker/${bookerReference}/permitted/prisoners/${prisonerId}/permitted/visitors/request`,
        bodyPatterns: [
          {
            equalToJson: addVisitorRequest,
          },
        ],
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubAddVisitorRequestFail: ({
    bookerReference = TestData.bookerReference().value,
    prisonerId = TestData.bookerPrisonerInfoDto().prisoner.prisonerNumber,
    addVisitorRequest = TestData.addVisitorRequest(),
    validationError = 'REQUEST_ALREADY_EXISTS',
  }: {
    bookerReference?: string
    prisonerId?: string
    addVisitorRequest?: AddVisitorToBookerPrisonerRequestDto
    validationError?: BookerVisitorRequestValidationErrorResponse['validationError']
  } = {}): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: `/orchestration/public/booker/${bookerReference}/permitted/prisoners/${prisonerId}/permitted/visitors/request`,
        bodyPatterns: [
          {
            equalToJson: addVisitorRequest,
          },
        ],
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 422,
          errorCode: null,
          userMessage: 'Error',
          developerMessage: null,
          validationError,
        },
      },
    }),

  stubRegisterPrisoner: ({
    bookerReference = TestData.bookerReference(),
    prisoner = TestData.registerPrisonerForBookerDto(),
    fail = false,
  }: {
    bookerReference?: BookerReference
    prisoner?: RegisterPrisonerForBookerDto
    fail?: boolean
  } = {}): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: `/orchestration/public/booker/${bookerReference.value}/permitted/prisoners/register`,
        bodyPatterns: [
          {
            equalToJson: prisoner,
          },
        ],
      },
      response: {
        status: fail ? 422 : 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubGetPrisoners: ({
    bookerReference = TestData.bookerReference(),
    prisoners = [],
  }: {
    bookerReference?: BookerReference
    prisoners?: BookerPrisonerInfoDto[]
  } = {}): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${bookerReference.value}/permitted/prisoners`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisoners,
      },
    }),

  stubValidatePrisonerPass: ({
    bookerReference = TestData.bookerReference(),
    prisonerNumber = TestData.bookerPrisonerInfoDto().prisoner.prisonerNumber,
  }: {
    bookerReference?: BookerReference
    prisonerNumber?: string
  } = {}): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${bookerReference.value}/permitted/prisoners/${prisonerNumber}/validate`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubValidatePrisonerFail: ({
    bookerReference = TestData.bookerReference(),
    prisonerNumber = TestData.bookerPrisonerInfoDto().prisoner.prisonerNumber,
    validationError = 'PRISONER_RELEASED',
  }: {
    bookerReference?: BookerReference
    prisonerNumber?: string
    validationError?: BookerVisitorRequestValidationErrorResponse['validationError'][number]
  } = {}): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${bookerReference.value}/permitted/prisoners/${prisonerNumber}/validate`,
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 422,
          errorCode: null,
          userMessage: 'Prisoner validation failed',
          developerMessage: null,
          validationError,
        },
      },
    }),

  stubGetVisitors: ({
    bookerReference = TestData.bookerReference(),
    prisonerNumber = TestData.bookerPrisonerInfoDto().prisoner.prisonerNumber,
    visitors = [TestData.visitorInfoDto()],
  }: {
    bookerReference?: BookerReference
    prisonerNumber?: string
    visitors?: VisitorInfoDto[]
  } = {}): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${bookerReference.value}/permitted/prisoners/${prisonerNumber}/permitted/visitors`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitors,
      },
    }),

  // orchestration-sessions-controller

  stubGetVisitSessions: ({
    prisonId,
    prisonerId,
    visitorIds,
    bookerReference = 'aaaa-bbbb-cccc',
    visitSessions,
    excludedApplicationReference = '',
  }: {
    prisonId: string
    prisonerId: string
    visitorIds: number[]
    bookerReference: string
    visitSessions: AvailableVisitSessionDto[]
    excludedApplicationReference?: string
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/orchestration/visit-sessions/public/available',
        queryParameters: {
          prisonId: { equalTo: prisonId },
          prisonerId: { equalTo: prisonerId },
          visitors: { equalTo: visitorIds.join(',') },
          username: { equalTo: bookerReference },
          excludedApplicationReference: {
            or: [
              {
                equalTo: excludedApplicationReference,
              },
              {
                absent: true,
              },
            ],
          },
          userType: { equalTo: 'PUBLIC' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitSessions,
      },
    }),

  stubGetSessionRestriction: ({
    prisonerId,
    visitorIds,
    sessionRestriction = 'OPEN',
  }: {
    prisonerId: string
    visitorIds: number[]
    sessionRestriction: SessionRestriction
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/orchestration/visit-sessions/available/restriction',
        queryParameters: {
          prisonerId: { equalTo: prisonerId },
          visitors: { equalTo: visitorIds.join(',') },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { sessionRestriction },
      },
    }),

  // orchestration-prisons-config-controller

  stubGetSupportedPrisonIds: (prisonIds = TestData.prisonIds()): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: '/orchestration/config/prisons/user-type/PUBLIC/supported',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonIds,
      },
    }),

  stubGetSupportedPrisons: (prisons = [TestData.prisonRegisterPrisonDto()]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: '/orchestration/config/prisons/user-type/PUBLIC/supported/detailed',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisons,
      },
    }),

  stubGetPrison: (prisonDto: PrisonDto = TestData.prisonDto()): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/config/prisons/prison/${prisonDto.code}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonDto,
      },
    }),

  // health check

  stubOrchestrationPing: (status = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/orchestration/health/ping',
      },
      response: {
        status,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    }),
}
