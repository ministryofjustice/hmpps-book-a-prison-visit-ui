import { SessionData } from 'express-session'
import { param } from 'express-validator'

export const validateVisitorRequestDisplayId = param('visitorRequestDisplayId')
  .isUUID()
  .bail()
  .custom((visitorRequestDisplayId: string, { req }) => {
    const { visitorRequests } = req.session as SessionData
    const visitors = visitorRequests ?? []

    return visitors.some(visitor => visitor.visitorRequestDisplayId === visitorRequestDisplayId)
  })

export const validatePrisonerDisplayId = param('prisonerDisplayId')
  .isUUID()
  .bail()
  .custom((prisonerDisplayId: string, { req }) => {
    const { booker } = req.session as SessionData
    const prisonerList = booker?.prisoners ?? []

    return prisonerList.some(prisoner => prisoner.prisonerDisplayId === prisonerDisplayId)
  })
