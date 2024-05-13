import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import { BookerReference, PrisonerInfoDto } from '../../server/data/orchestrationApiTypes'

export default {
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
        url: `/orchestration/public/booker/${bookerReference.value}/prisoners`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisoners,
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
