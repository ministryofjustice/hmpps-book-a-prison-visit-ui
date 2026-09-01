import { SessionData } from 'express-session'
import { param } from 'express-validator'

// eslint-disable-next-line import/prefer-default-export
export const validateVisitDisplayId = param('visitDisplayId')
  .isUUID()
  .bail()
  .custom((visitDisplayId: string, { req }) => {
    const { bookedVisits } = req.session as SessionData
    const visits = bookedVisits?.visits ?? []

    return visits.some(visit => visit.visitDisplayId === visitDisplayId)
  })
