import { DataCache, HmppsAuthClient, OrchestrationApiClient, PrisonRegisterApiClient, RestClientBuilder } from '../data'
import { PrisonDto } from '../data/orchestrationApiTypes'

type CacheConfig = { key: string; ttlSecs: number }

export type PrisonNames = Record<string, { name: { en: string; cy?: string } }>

export default class PrisonService {
  private readonly allPrisonNamesCache: CacheConfig = { key: 'allPrisonNames', ttlSecs: 60 * 60 * 1 } // 1 hour cache

  private readonly supportedPrisonIdsCache: CacheConfig = { key: 'supportedPrisonIds', ttlSecs: 60 * 5 } // 5 min cache

  private readonly prisonCache: CacheConfig = { key: 'prison', ttlSecs: 60 * 5 } // 5 min cache (prisonId added to key)

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly prisonRegisterApiClientFactory: RestClientBuilder<PrisonRegisterApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly dataCache: DataCache,
  ) {}

  async getAllPrisonNames(): Promise<PrisonNames> {
    const cachedAllPrisonNames = await this.dataCache.get<PrisonNames>(this.allPrisonNamesCache.key)

    if (cachedAllPrisonNames) {
      return cachedAllPrisonNames
    }

    const token = await this.hmppsAuthClient.getSystemClientToken()
    const prisonRegisterApiClient = this.prisonRegisterApiClientFactory(token)

    const allPrisonNameDtos = await prisonRegisterApiClient.getPrisonNames()

    const allPrisonNames: PrisonNames = allPrisonNameDtos.reduce((acc, prison) => {
      acc[prison.prisonId] = {
        name: {
          en: prison.prisonName,
          ...(prison.prisonNameInWelsh && { cy: prison.prisonNameInWelsh }),
        },
      }
      return acc
    }, {} as PrisonNames)

    await this.dataCache.set(this.allPrisonNamesCache.key, allPrisonNames, this.allPrisonNamesCache.ttlSecs)
    return allPrisonNames
  }

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    const cachedPrison = await this.dataCache.get<PrisonDto>(`${this.prisonCache.key}:${prisonCode}`)

    if (cachedPrison) {
      return cachedPrison
    }

    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const prison = await orchestrationApiClient.getPrison(prisonCode)

    await this.dataCache.set<PrisonDto>(`${this.prisonCache.key}:${prisonCode}`, prison, this.prisonCache.ttlSecs)
    return prison
  }

  async isSupportedPrison(prisonCode: string): Promise<boolean> {
    return (await this.getSupportedPrisonIds()).includes(prisonCode)
  }

  async getSupportedPrisonIds(): Promise<string[]> {
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
