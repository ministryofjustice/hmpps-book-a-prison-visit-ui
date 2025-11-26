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
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import { BookerService, PrisonService, RateLimitService, VisitService, VisitSessionsService } from '..'

jest.mock('..')

export const createMockBookerService = () =>
  new BookerService(null, null, null, null, null) as jest.Mocked<BookerService>

export const createMockPrisonService = () => new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

export const createMockRateLimitService = () => new RateLimitService(null, null) as jest.Mocked<RateLimitService>

export const createMockVisitService = () => new VisitService(null, null) as jest.Mocked<VisitService>

export const createMockVisitSessionsService = () =>
  new VisitSessionsService(null, null) as jest.Mocked<VisitSessionsService>
