import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import {
  ApplicationDto,
  AvailableVisitSessionDto,
  BookerReference,
  PrisonDto,
  PrisonerInfoDto,
  VisitDto,
  VisitorInfoDto,
} from '../../server/data/orchestrationApiTypes'

export default {
  // orchestration-visits-controller

  stubBookVisit: (visit: VisitDto): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.applicationReference}/book`,
        bodyPatterns: [
          {
            equalToJson: {
              applicationMethodType: 'WEBSITE',
              allowOverBooking: false,
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

  stubGetPrisoners: ({
    bookerReference = TestData.bookerReference(),
    prisoners = [],
  }: {
    bookerReference: BookerReference
    prisoners: PrisonerInfoDto[]
  }): SuperAgentRequest =>
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

  stubGetVisitors: ({
    bookerReference = TestData.bookerReference(),
    prisonerNumber = TestData.prisonerInfoDto().prisonerNumber,
    visitors = [TestData.visitorInfoDto()],
  }: {
    bookerReference: BookerReference
    prisonerNumber: string
    visitors: VisitorInfoDto[]
  }): SuperAgentRequest =>
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
    visitSessions,
  }: {
    prisonId: string
    prisonerId: string
    visitorIds: number[]
    visitSessions: AvailableVisitSessionDto[]
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/orchestration/visit-sessions/available`,
        queryParameters: {
          prisonId: { equalTo: prisonId },
          prisonerId: { equalTo: prisonerId },
          visitors: { equalTo: visitorIds.join(',') },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitSessions,
      },
    }),

  // orchestration-prisons-config-controller

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
