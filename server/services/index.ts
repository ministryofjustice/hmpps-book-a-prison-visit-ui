import { dataAccess } from '../data'
import SupportedPrisonsService from './supportedPrisonsService'
import UserService from './userService'

export const services = () => {
  const { hmppsAuthClient, applicationInfo, orchestrationApiClientBuilder } = dataAccess()

  const supportedPrisonsService = new SupportedPrisonsService(orchestrationApiClientBuilder, hmppsAuthClient)

  const userService = new UserService(hmppsAuthClient)

  return {
    applicationInfo,
    supportedPrisonsService,
    userService,
  }
}

export type Services = ReturnType<typeof services>

export { SupportedPrisonsService, UserService }
