import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubPvbRequestPage: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/pvb/en/request',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
        body: '<html><body><h1>PVB request page</h1></body></html>',
      },
    })
  },
}
