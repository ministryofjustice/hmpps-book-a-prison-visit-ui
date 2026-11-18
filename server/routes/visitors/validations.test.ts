import { Request } from 'express'
import type { UUID } from 'crypto'
import { validatePrisonerDisplayId, validateVisitorRequestDisplayId } from './validations'

const uuid = '123e4567-e89b-12d3-a456-426614174000'
let req: Request

describe('validateVisitorRequestDisplayId', () => {
  beforeEach(() => {
    req = {
      params: { visitorRequestDisplayId: uuid },
      session: {
        visitorRequests: [{ visitorRequestDisplayId: uuid }],
      },
    } as unknown as Request
  })

  it('should accept for a valid visitorRequestDisplayId in session', async () => {
    const result = await validateVisitorRequestDisplayId.run(req)
    expect(result.isEmpty()).toBe(true)
  })

  it('should reject an invalid visitorRequestDisplayId', async () => {
    req.params.visitorRequestDisplayId = 'invalid-uuid'
    const result = await validateVisitorRequestDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })

  it('should reject if visitorRequestDisplayId is not in session', async () => {
    req.session.visitorRequests![0].visitorRequestDisplayId = 'another-uuid' as UUID
    const result = await validateVisitorRequestDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })

  it('should reject if no visitor requests in session', async () => {
    delete req.session.visitorRequests
    const result = await validateVisitorRequestDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })
})

describe('validatePrisonerDisplayId', () => {
  beforeEach(() => {
    req = {
      params: { prisonerDisplayId: uuid },
      session: {
        booker: {
          prisoners: [{ prisonerDisplayId: uuid }],
        },
      },
    } as unknown as Request
  })

  it('should accept for a valid prisonerDisplayId in session', async () => {
    const result = await validatePrisonerDisplayId.run(req)
    expect(result.isEmpty()).toBe(true)
  })

  it('should reject an invalid prisonerDisplayId', async () => {
    req.params.prisonerDisplayId = 'invalid-uuid'
    const result = await validatePrisonerDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })

  it('should reject if prisonerDisplayId is not in session', async () => {
    req.session.booker!.prisoners[0].prisonerDisplayId = 'another-uuid' as UUID
    const result = await validatePrisonerDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })

  it('should reject if no booker in session', async () => {
    delete req.session.booker
    const result = await validatePrisonerDisplayId.run(req)
    expect(result.isEmpty()).toBe(false)
  })
})
