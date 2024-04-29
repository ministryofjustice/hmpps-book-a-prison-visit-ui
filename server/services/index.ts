import { dataAccess } from '../data'
import UserService from './userService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, orchestrationApiClientBuilder } = dataAccess()

  const userService = new UserService(orchestrationApiClientBuilder, hmppsAuthClient)

  return {
    applicationInfo,
    userService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
