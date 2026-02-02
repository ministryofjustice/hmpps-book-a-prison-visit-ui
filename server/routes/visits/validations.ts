import { Meta, param } from 'express-validator'

// eslint-disable-next-line import/prefer-default-export
export const validateVisitDisplayId = param('visitDisplayId')
  .isUUID()
  .bail()
  .custom((visitDisplayId: string, { req }: Meta & { req: Express.Request }) => {
    const { bookedVisits } = req.session
    const visits = bookedVisits?.visits ?? []

    return visits.some(visit => visit.visitDisplayId === visitDisplayId)
  })
