import config from '../config'
import { dataAccess } from '../data'
import BookerService from './bookerService'
import PrisonService from './prisonService'
import RateLimitService from './rateLimitService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'

export const services = () => {
  const {
    applicationInfo,
    dataCache,
    hmppsAuthClient,
    orchestrationApiClientBuilder,
    prisonRegisterApiClientBuilder,
    rateLimitStore,
  } = dataAccess()

  const bookerService = new BookerService(
    orchestrationApiClientBuilder,
    hmppsAuthClient,
    new RateLimitService(rateLimitStore, config.rateLimit.booker),
    new RateLimitService(rateLimitStore, config.rateLimit.prisoner),
    new RateLimitService(rateLimitStore, config.rateLimit.visitor),
  )

  const prisonService = new PrisonService(
    orchestrationApiClientBuilder,
    prisonRegisterApiClientBuilder,
    hmppsAuthClient,
    dataCache,
  )

  const visitService = new VisitService(orchestrationApiClientBuilder, hmppsAuthClient)

  const visitSessionsService = new VisitSessionsService(orchestrationApiClientBuilder, hmppsAuthClient)

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
