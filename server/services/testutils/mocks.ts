import { BookerService } from '..'

jest.mock('..')

// eslint-disable-next-line import/prefer-default-export
export const createMockBookerService = () => new BookerService(null, null) as jest.Mocked<BookerService>
