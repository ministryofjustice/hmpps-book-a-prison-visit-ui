/* eslint-disable import/first */
/*
 * Import from '..' (server/data/index.ts) fails if applicationInfo not mocked first. This is
 * because paths in it differ between running app (in 'dist') and where ts-jest runs.
 */
import type { ApplicationInfo } from '../../applicationInfo'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  productId: 'UNASSIGNED',
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import { DataCache, HmppsAuthClient, OrchestrationApiClient, PrisonRegisterApiClient } from '..'
import { TokenStore } from '../tokenStore/tokenStore'

jest.mock('..')

export const createMockDataCache = () => ({ set: jest.fn(), get: jest.fn() }) as jest.Mocked<DataCache>

export const createMockHmppsAuthClient = () => new HmppsAuthClient({} as TokenStore) as jest.Mocked<HmppsAuthClient>

export const createMockOrchestrationApiClient = () =>
  new OrchestrationApiClient('token') as jest.Mocked<OrchestrationApiClient>

export const createMockPrisonRegisterApiClient = () =>
  new PrisonRegisterApiClient('token') as jest.Mocked<PrisonRegisterApiClient>
