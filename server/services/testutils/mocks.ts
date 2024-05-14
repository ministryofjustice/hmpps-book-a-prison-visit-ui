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

import { BookerService, PrisonService } from '..'

jest.mock('..')

export const createMockBookerService = () => new BookerService(null, null) as jest.Mocked<BookerService>

export const createMockPrisonService = () => new PrisonService(null, null) as jest.Mocked<PrisonService>
