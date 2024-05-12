import { stubFor } from './wiremock'

const stubHmppsAuthToken = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        access_token: 'hmpps-auth-token',
        token_type: 'bearer',
        expires_in: 599,
        scope: 'read write',
        sub: 'system_client_id',
        auth_source: 'none',
        jti: 'NBmv9IH_xw89YFE_tFoBwI1zo9Y',
        iss: 'http://localhost:9091/auth/auth/issuer',
      },
    },
  })

export default { stubHmppsAuthToken }
