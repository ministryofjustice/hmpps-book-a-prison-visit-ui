import { SessionData } from 'express-session'
import { param } from 'express-validator'

export const validateVisitDisplayId = param('visitDisplayId')
  .isUUID()
  .bail()
  .custom((visitDisplayId: string, { req }) => {
    const { bookedVisits } = req.session as SessionData
    const visits = bookedVisits?.visits ?? []

    return visits.some(visit => visit.visitDisplayId === visitDisplayId)
  })

export const validatePendingVisitorDisplayId = param('visitorDisplayId')
  .isUUID()
  .bail()
  .custom((visitorDisplayId: string, { req }) => {
    const { pendingVisitors } = req.session as SessionData
    const visitors = pendingVisitors ?? []

    return visitors.some(visitor => visitor.visitorDisplayId === visitorDisplayId)
  })
