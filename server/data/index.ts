/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import HmppsAuthClient from './hmppsAuthClient'
import OrchestrationApiClient from './orchestrationApiClient'
import tokenStoreFactory from './tokenStore/tokenStoreFactory'
import PrisonRegisterApiClient from './prisonRegisterApiClient'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(tokenStoreFactory('systemToken')),
  orchestrationApiClientBuilder: ((token: string) =>
    new OrchestrationApiClient(token)) as RestClientBuilder<OrchestrationApiClient>,
  prisonRegisterApiClientBuilder: ((token: string) =>
    new PrisonRegisterApiClient(token)) as RestClientBuilder<PrisonRegisterApiClient>,
  rateLimitStore: tokenStoreFactory('rateLimit'),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { HmppsAuthClient, OrchestrationApiClient, PrisonRegisterApiClient, type RestClientBuilder }
