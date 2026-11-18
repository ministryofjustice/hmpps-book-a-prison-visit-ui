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
  createMockOrchestrationApiClient,
  createMockPrisonRegisterApiClient,
} from '../../data/testutils/mocks'
import { RateLimitConfig } from '../../config'
import RateLimitStore from '../../data/rateLimitStore/rateLimitStore'

jest.mock('..')

export const createMockBookerService = () =>
  new BookerService(
    createMockOrchestrationApiClient(),
    createMockRateLimitService(),
    createMockRateLimitService(),
    createMockRateLimitService(),
  ) as jest.Mocked<BookerService>

export const createMockPrisonService = () =>
  new PrisonService(
    createMockOrchestrationApiClient(),
    createMockPrisonRegisterApiClient(),
    createMockDataCache(),
  ) as jest.Mocked<PrisonService>

export const createMockRateLimitService = () =>
  new RateLimitService({} as RateLimitStore, {} as RateLimitConfig) as jest.Mocked<RateLimitService>

export const createMockVisitService = () =>
  new VisitService(createMockOrchestrationApiClient()) as jest.Mocked<VisitService>

export const createMockVisitSessionsService = () =>
  new VisitSessionsService(createMockOrchestrationApiClient()) as jest.Mocked<VisitSessionsService>
