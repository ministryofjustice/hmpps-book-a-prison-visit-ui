import { dataAccess } from '../data'
import BookerService from './bookerService'
import PrisonService from './prisonService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, orchestrationApiClientBuilder } = dataAccess()

  const bookerService = new BookerService(orchestrationApiClientBuilder, hmppsAuthClient)

  const prisonService = new PrisonService(orchestrationApiClientBuilder, hmppsAuthClient)

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

export { BookerService, PrisonService, VisitService, VisitSessionsService }
