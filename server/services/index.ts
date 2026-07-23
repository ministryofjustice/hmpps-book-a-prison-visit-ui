import config from '../config'
import { dataAccess } from '../data'
import BookerService from './bookerService'
import PrisonService from './prisonService'
import RateLimitService from './rateLimitService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'

export const services = () => {
  const { applicationInfo, dataCache, orchestrationApiClient, prisonRegisterApiClient, rateLimitStore } = dataAccess()

  const bookerService = new BookerService(
    orchestrationApiClient,
    new RateLimitService(rateLimitStore, config.rateLimit.booker),
    new RateLimitService(rateLimitStore, config.rateLimit.prisoner),
    new RateLimitService(rateLimitStore, config.rateLimit.visitor),
  )

  const prisonService = new PrisonService(orchestrationApiClient, prisonRegisterApiClient, dataCache)

  const visitService = new VisitService(orchestrationApiClient)

  const visitSessionsService = new VisitSessionsService(orchestrationApiClient)

  return {
    applicationInfo,
    bookerService,
    prisonService,
    visitService,
    visitSessionsService,
  }
}

export type Services = ReturnType<typeof services>

export { BookerService, PrisonService, RateLimitService, VisitService, VisitSessionsService }
