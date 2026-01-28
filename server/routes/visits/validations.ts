import { Meta, param } from 'express-validator'

// eslint-disable-next-line import/prefer-default-export
export const validateVisitDisplayId = param('visitDisplayId')
  .isUUID()
  .bail()
  .custom((visitDisplayId: string, { req }: Meta & { req: Express.Request }) => {
    const { bookings } = req.session
    const visits = bookings?.visits ?? []

    return visits.some(visit => visit.visitDisplayId === visitDisplayId)
  })
