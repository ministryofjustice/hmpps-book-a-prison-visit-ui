import jwt from 'jsonwebtoken'

import { stubFor } from './wiremock'

const createToken = () => {
  const payload = {
    sub: 'system_client_id',
    grant_type: 'client_credentials',
    scope: ['read', 'write'],
    auth_source: 'none',
    iss: 'http://localhost:9091/auth/auth/issuer',
    authorities: ['ROLE_VISIT_SCHEDULER'],
    jti: 'NBmv9IH_xw89YFE_tFoBwI1zo9Y',
    client_id: 'system_client_id',
  }
  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

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
        Location: 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: createToken(),
        token_type: 'bearer',
        expires_in: 599,
        scope: 'read',
        sub: 'system_client_id',
        auth_source: 'none',
        jti: 'NBmv9IH_xw89YFE_tFoBwI1zo9Y',
        iss: 'http://localhost:9091/auth/auth/issuer',
      },
    },
  })

export default { stubHmppsAuthToken }
