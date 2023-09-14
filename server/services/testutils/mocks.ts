import { SupportedPrisonsService } from '..'

jest.mock('..')

// eslint-disable-next-line import/prefer-default-export
export const createMockSupportedPrisonsService = () =>
  new SupportedPrisonsService(null, null) as jest.Mocked<SupportedPrisonsService>
