import RestClient from './restClient'
import config, { ApiConfig } from '../config'

export default class OrchestrationApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  async getSupportedPrisonIds(): Promise<string[]> {
    return this.restClient.get({
      path: '/config/prisons/supported',
    })
  }
}
