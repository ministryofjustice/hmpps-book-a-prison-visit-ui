import { HmppsAuthClient, RestClientBuilder } from '../data'
import BookerRegistryApiClient from '../data/bookerRegistryApiClient'
import { AuthDetailDto, BookerReference } from '../data/bookerRegistryApiTypes'

export interface UserDetails {
  bookerReference: string
}

export default class UserService {
  constructor(
    private readonly bookerRegistryApiClientFactory: RestClientBuilder<BookerRegistryApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  // TODO add tests!
  async getBookerReference(authDetailDto: AuthDetailDto): Promise<BookerReference> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const bookerRegistryApiClient = this.bookerRegistryApiClientFactory(token)

    // TODO try/catch for non-200 and log user out
    return bookerRegistryApiClient.getBookerReference(authDetailDto)
  }
}
