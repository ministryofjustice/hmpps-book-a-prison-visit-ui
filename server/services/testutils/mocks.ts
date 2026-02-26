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

import { BookerService, PrisonService, RateLimitService, VisitService, VisitSessionsService } from '..'
import {
  createMockDataCache,
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonRegisterApiClient,
} from '../../data/testutils/mocks'
import { TokenStore } from '../../data/tokenStore/tokenStore'
import { RateLimitConfig } from '../../config'

jest.mock('..')

export const createMockBookerService = () =>
  new BookerService(
    createMockOrchestrationApiClient,
    createMockHmppsAuthClient(),
    createMockRateLimitService(),
    createMockRateLimitService(),
    createMockRateLimitService(),
  ) as jest.Mocked<BookerService>

export const createMockPrisonService = () =>
  new PrisonService(
    createMockOrchestrationApiClient,
    createMockPrisonRegisterApiClient,
    createMockHmppsAuthClient(),
    createMockDataCache(),
  ) as jest.Mocked<PrisonService>

export const createMockRateLimitService = () =>
  new RateLimitService({} as TokenStore, {} as RateLimitConfig) as jest.Mocked<RateLimitService>

export const createMockVisitService = () =>
  new VisitService(createMockOrchestrationApiClient, createMockHmppsAuthClient()) as jest.Mocked<VisitService>

export const createMockVisitSessionsService = () =>
  new VisitSessionsService(
    createMockOrchestrationApiClient,
    createMockHmppsAuthClient(),
  ) as jest.Mocked<VisitSessionsService>
