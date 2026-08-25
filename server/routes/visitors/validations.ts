import { SessionData } from 'express-session'
import { param } from 'express-validator'

// eslint-disable-next-line import/prefer-default-export
export const validateVisitorRequestDisplayId = param('visitorRequestDisplayId')
  .isUUID()
  .bail()
  .custom((visitorRequestDisplayId: string, { req }) => {
    const { visitorRequests } = req.session as SessionData
    const visitors = visitorRequests ?? []

    return visitors.some(visitor => visitor.visitorRequestDisplayId === visitorRequestDisplayId)
  })
