import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import {
  ApplicationDto,
  AvailableVisitSessionDto,
  BookerReference,
  PrisonDto,
  PrisonerInfoDto,
  VisitorInfoDto,
} from '../../server/data/orchestrationApiTypes'

export default {
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
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: application,
      },
    })
  },

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
