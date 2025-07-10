import { DataCache, HmppsAuthClient, OrchestrationApiClient, PrisonRegisterApiClient, RestClientBuilder } from '../data'
import { PrisonDto, PrisonRegisterPrisonDto } from '../data/orchestrationApiTypes'
import { PrisonNameDto } from '../data/prisonRegisterApiTypes'

type CacheConfig = { key: string; ttlSecs: number }

export default class PrisonService {
  private readonly allPrisonNamesCache: CacheConfig = { key: 'prisonNames', ttlSecs: 60 * 60 * 24 } // 24 hour cache

  private readonly supportedPrisonIdsCache: CacheConfig = { key: 'supportedPrisonIds', ttlSecs: 60 * 5 } // 5 min cache

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly prisonRegisterApiClientFactory: RestClientBuilder<PrisonRegisterApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly dataCache: DataCache,
  ) {}

  async getAllPrisonNames(): Promise<PrisonNameDto[]> {
    const cachedAllPrisonNames = await this.dataCache.get<PrisonNameDto[]>(this.allPrisonNamesCache.key)

    if (cachedAllPrisonNames) {
      return cachedAllPrisonNames
    }

    const token = await this.hmppsAuthClient.getSystemClientToken()
    const prisonRegisterApiClient = this.prisonRegisterApiClientFactory(token)

    const allPrisonNames = await prisonRegisterApiClient.getPrisonNames()

    await this.dataCache.set(this.allPrisonNamesCache.key, allPrisonNames, this.allPrisonNamesCache.ttlSecs)
    return allPrisonNames
  }

  async getSupportedPrisons(): Promise<PrisonRegisterPrisonDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getSupportedPrisons()
  }

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getPrison(prisonCode)
  }

  async isSupportedPrison(prisonCode: string): Promise<boolean> {
    return (await this.getSupportedPrisonIds()).includes(prisonCode)
  }

  private async getSupportedPrisonIds(): Promise<string[]> {
    const cachedSupportedPrisonIds = await this.dataCache.get<string[]>(this.supportedPrisonIdsCache.key)

    if (cachedSupportedPrisonIds) {
      return cachedSupportedPrisonIds
    }

    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const supportedPrisonIds = await orchestrationApiClient.getSupportedPrisonIds()

    await this.dataCache.set(this.supportedPrisonIdsCache.key, supportedPrisonIds, this.supportedPrisonIdsCache.ttlSecs)
    return supportedPrisonIds
  }
}
