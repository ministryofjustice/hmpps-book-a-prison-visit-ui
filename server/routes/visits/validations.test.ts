import { Request } from 'express'
import type { UUID } from 'crypto'
import { validateVisitDisplayId } from './validations'

const uuid = '123e4567-e89b-12d3-a456-426614174000'
let req: Request

describe('validateVisitDisplayId', () => {
  beforeEach(() => {
    req = {
      params: { visitDisplayId: uuid },
      session: {
        bookedVisits: {
          visits: [{ visitDisplayId: uuid }],
        },
      },
    } as unknown as Request
  })

  it('should accept for a valid visitDisplayId in session', async () => {
    const result = await validateVisitDisplayId.run(req)
    expect(result.isEmpty()).toBe(true)
  })

  it('should reject an invalid visitDisplayId', async () => {
    req.params.visitDisplayId = 'invalid-uuid'
    const result = await validateVisitDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })

  it('should reject if visitDisplayId is not in session', async () => {
    req.session.bookedVisits!.visits[0].visitDisplayId = 'another-uuid' as UUID
    const result = await validateVisitDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })

  it('should reject if no visits in session', async () => {
    delete req.session.bookedVisits
    const result = await validateVisitDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })
})
