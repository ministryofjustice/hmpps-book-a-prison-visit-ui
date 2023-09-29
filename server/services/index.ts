import { dataAccess } from '../data'
import SupportedPrisonsService from './supportedPrisonsService'

export const services = () => {
  const { hmppsAuthClient, applicationInfo, orchestrationApiClientBuilder } = dataAccess()

  const supportedPrisonsService = new SupportedPrisonsService(orchestrationApiClientBuilder, hmppsAuthClient)

  return {
    applicationInfo,
    supportedPrisonsService,
  }
}

export type Services = ReturnType<typeof services>

export { SupportedPrisonsService }
