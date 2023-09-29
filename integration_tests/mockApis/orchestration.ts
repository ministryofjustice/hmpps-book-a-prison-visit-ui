import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'

export default {
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
  stubSupportedPrisonIds: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/orchestration/config/prisons/supported',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportedPrisonIds(),
      },
    })
  },
}