import { dataAccess } from '../data'
import BookerService from './bookerService'
import PrisonService from './prisonService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, orchestrationApiClientBuilder } = dataAccess()

  const bookerService = new BookerService(orchestrationApiClientBuilder, hmppsAuthClient)

  const prisonService = new PrisonService(orchestrationApiClientBuilder, hmppsAuthClient)

  return {
    applicationInfo,
    bookerService,
    prisonService,
  }
}

export type Services = ReturnType<typeof services>

export { BookerService, PrisonService }
