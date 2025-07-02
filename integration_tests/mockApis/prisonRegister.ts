import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import { PrisonNameDto } from '../../server/data/prisonRegisterApiTypes'

export default {
  stubPrisonNames: (prisons: PrisonNameDto[] = TestData.prisonNameDtos()): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/prisonRegister/prisons/names',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisons,
      },
    })
  },

  stubPrisonRegisterPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonRegister/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
