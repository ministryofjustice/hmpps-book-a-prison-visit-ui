const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  // Sets the working socket to timeout after timeout milliseconds of inactivity on the working socket.
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    // sets maximum time to wait for the first byte to arrive from the server, but it does not limit how long the
    // entire download can take.
    response: number
    // sets a deadline for the entire request (including all uploads, redirects, server processing time) to complete.
    // If the response isn't fully downloaded within that time, the request will be aborted.
    deadline: number
  }
  agent: AgentConfig
}

export type RateLimitConfig = {
  keyPrefix: string
  maxRequests: number
  windowSeconds: number
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    enabled: get('REDIS_ENABLED', 'false', requiredInProduction) === 'true',
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 20)),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    govukOneLogin: {
      url: get('GOVUK_ONE_LOGIN_URL', 'http://localhost:9090', requiredInProduction),
      homeUrl: get('GOVUK_ONE_LOGIN_HOME_URL', '', requiredInProduction),
      clientId: get('GOVUK_ONE_LOGIN_CLIENT_ID', 'oneLoginClientId', requiredInProduction),
      privateKey: get('GOVUK_ONE_LOGIN_PRIVATE_KEY', 'privateKey', requiredInProduction),
      vtr: process.env.GOVUK_ONE_LOGIN_VTR === 'LOW' ? '["Cl"]' : '["Cl.Cm"]',
    },
    orchestration: {
      url: get('ORCHESTRATION_API_URL', 'http://localhost:8080', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('ORCHESTRATION_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('ORCHESTRATION_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('ORCHESTRATION_API_TIMEOUT_RESPONSE', 10000))),
    },
    prisonRegister: {
      url: get('PRISON_REGISTER_API_URL', 'http://localhost:8080', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('PRISON_REGISTER_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISON_REGISTER_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISON_REGISTER_API_TIMEOUT_RESPONSE', 10000))),
    },
  },
  // include short Git ref in dataCache prefix to invalidate data cache on deploy of new build
  // DATA_CACHE_PREFIX overrides for integration tests
  dataCachePrefix: `dataCache_${get('DATA_CACHE_PREFIX', '') || get('GIT_REF', 'local').slice(0, 7)}:`,
  rateLimit: <Record<string, RateLimitConfig>>{
    // Rate limit config for Add a prisoner journey
    booker: {
      keyPrefix: 'booker',
      maxRequests: Number(get('ADD_PRISONER_RATE_LIMIT_BOOKER_MAX_REQUESTS', 50)),
      windowSeconds: Number(get('ADD_PRISONER_RATE_LIMIT_BOOKER_WINDOW_SECS', 60 * 60 * 24)), // 24 hours
    },
    prisoner: {
      keyPrefix: 'prisoner',
      maxRequests: Number(get('ADD_PRISONER_RATE_LIMIT_PRISONER_MAX_REQUESTS', 50)),
      windowSeconds: Number(get('ADD_PRISONER_RATE_LIMIT_PRISONER_WINDOW_SECS', 60 * 60 * 24)), // 24 hours
    },
    // Rate limit config for Add a visitor journey (add visitor requests per booker)
    visitor: {
      keyPrefix: 'visitor',
      maxRequests: Number(get('ADD_VISITOR_RATE_LIMIT_BOOKER_MAX_REQUESTS', 50)),
      windowSeconds: Number(get('ADD_VISITOR_RATE_LIMIT_BOOKER_WINDOW_SECS', 60 * 60 * 24)), // 24 hours
    },
  },
  analytics: {
    googleAnalyticsId: get('GOOGLE_ANALYTICS_ID', 'G-SSLMWLQYHQ', requiredInProduction),
  },
  features: {},
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  environmentName: get('ENVIRONMENT_NAME', ''),
  pvbUrl: get('PVB_URL', 'https://dev.prisonvisits.prison.service.justice.gov.uk/en/request', requiredInProduction),
  rootPathRedirect: get('ROOT_PATH_REDIRECT', '/home'), // Where to redirect unauthenticated users to for requests to '/'
  maintenance: {
    enabled: get('MAINTENANCE_MODE', 'false') === 'true',
    endDateTime: get('MAINTENANCE_MODE_END_DATE_TIME', ''), // ISO format e.g. YYYY-MM-DDTHH:MM
  },
}
