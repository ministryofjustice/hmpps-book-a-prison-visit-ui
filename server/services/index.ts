import { dataAccess } from '../data'
import BookerService from './bookerService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, orchestrationApiClientBuilder } = dataAccess()

  const bookerService = new BookerService(orchestrationApiClientBuilder, hmppsAuthClient)

  return {
    applicationInfo,
    bookerService,
  }
}

export type Services = ReturnType<typeof services>

export { BookerService }
