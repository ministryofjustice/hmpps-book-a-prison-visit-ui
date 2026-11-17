import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import TestData from '../routes/testutils/testData'

describe('prisonRegisterApiClient', () => {
  let fakePrisonRegisterApi: nock.Scope
  let prisonRegisterApiClient: PrisonRegisterApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  const token = 'test-system-token'

  beforeEach(() => {
    fakePrisonRegisterApi = nock(config.apis.prisonRegister.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue(token),
    } as unknown as jest.Mocked<AuthenticationClient>
    prisonRegisterApiClient = new PrisonRegisterApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  afterAll(() => {
    nock.restore()
  })

  describe('getPrisonNames', () => {
    it('should return all prisons from the Prison Register', async () => {
      const prisonNames = TestData.prisonNameDtos()

      fakePrisonRegisterApi
        .get('/prisons/names')
        .query({ active: true })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisonNames)

      const output = await prisonRegisterApiClient.getPrisonNames()
      expect(output).toEqual(prisonNames)
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })
})
