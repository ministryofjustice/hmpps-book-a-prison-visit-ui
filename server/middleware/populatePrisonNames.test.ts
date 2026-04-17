import { Request, Response } from 'express'
import populatePrisonNames from './populatePrisonNames'
import { createMockPrisonService } from '../services/testutils/mocks'
import TestData from '../routes/testutils/testData'

describe('populatePrisonNames', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  const prisonService = createMockPrisonService()
  const prisonNames = TestData.prisonNames()

  beforeEach(() => {
    jest.resetAllMocks()

    req = { path: '/test', session: {} } as Request
    res = { locals: {} } as Response
  })

  it('should populate res.locals.prisonNames with prison names from the PrisonService', async () => {
    prisonService.getAllPrisonNames.mockResolvedValue(prisonNames)

    await populatePrisonNames(prisonService)(req, res, next)

    expect(prisonService.getAllPrisonNames).toHaveBeenCalled()
    expect(res.locals.prisonNames).toStrictEqual(prisonNames)
    expect(next).toHaveBeenCalled()
  })
})
