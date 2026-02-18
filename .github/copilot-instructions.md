# Copilot Instructions for hmpps-book-a-prison-visit-ui

This is a public-facing prison visits booking application built with Express.js, TypeScript, and GOV.UK Frontend components. Below are essential patterns and workflows for productive development.

## Architecture Overview

**Application Structure:**
- **Controllers** (`server/routes/*/controller.ts`) - Handle HTTP requests with `view()`, `validate()`, `submit()` methods
- **Services** (`server/services/`) - Business logic: BookerService, PrisonService, VisitService, VisitSessionsService
- **Data Layer** (`server/data/`) - API clients (OrchestrationApiClient, PrisonRegisterApiClient, HmppsAuthClient) + caching
- **Middleware** (`server/middleware/`) - Authentication, CSRF, session validation, analytics consent
- **Routes** (`server/routes/`) - Organized by feature (bookVisit/, addVisitor/, visitors/, visits/)

**Request Flow:** Security middleware → Authentication → Session validation (`bookVisitSessionValidator`) → Route handler → Controller

**Authentication:** GOV.UK One Login (OIDC) for local development and production, with GOV.UK One Login Simulator for integration tests.

## Key Patterns

**Form Validation Pattern:**
Controllers use `express-validator` with custom chains. Example from [server/routes/addVisitor/visitorDetailsController.ts](server/routes/addVisitor/visitorDetailsController.ts):
```typescript
validate(): ValidationChain[] {
  return [
    body('firstName', 'Enter a first name').trim().isLength({ min: 1, max: 250 }),
    ...dateOfBirthValidationChain('visitorDob'),
  ]
}
submit(): RequestHandler {
  return async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array())
      req.flash('formValues', matchedData(req, { onlyValidData: false }))
      return res.redirect(paths.ADD_VISITOR.DETAILS)  // Return to form with errors
    }
    // ... process validated data
  }
}
```
**Always use `matchedData(req, { onlyValidData: false })` for form re-population** on validation failure.

**Journey Session Validation:**
Multi-step journeys enforce a strict order via [server/middleware/bookVisitSessionValidator.ts](server/middleware/bookVisitSessionValidator.ts). This middleware redirects if users attempt to skip or revisit steps out of order. The journey order is defined as an array of paths—be aware when adding new steps.

**Data Caching:**
Abstracted via `DataCache` interface implemented by `RedisDataCache` (production) or `InMemoryDataCache` (development). Check `config.redis.enabled` to understand which is active. See [server/data/index.ts](server/data/index.ts).

**API Client Builder Pattern:**
Services receive `RestClientBuilder<T>` functions (lambdas) that create fresh API clients with user tokens. This keeps authentication token scoping clean. Example:
```typescript
new BookerService(orchestrationApiClientBuilder, ...)
// Inside service methods:
const client = orchestrationApiClientBuilder(userToken)
```

**Nunjucks Error Handling:**
View templates use two custom filters for errors:
- `errors | errorSummaryList` → Converts error array to GOV.UK error summary structure
- `findError(errors, 'fieldName')` → Retrieves error for a specific field

See [server/utils/nunjucksSetup.ts](server/utils/nunjucksSetup.ts) for filter implementation.

## Rate Limiting

Three separate rate limits protect against abuse:
- **Booker limit** (ADD_PRISONER_RATE_LIMIT_BOOKER_*): Controls prisoner registration attempts per booker
- **Prisoner limit** (ADD_PRISONER_RATE_LIMIT_PRISONER_*): Prevents spam registrations for specific prisoners
- **Visitor limit** (ADD_VISITOR_RATE_LIMIT_BOOKER_*): Limits visitor requests per booker

**Implementation Pattern** from [server/services/bookerService.ts](server/services/bookerService.ts):
```typescript
async registerPrisoner(bookerReference: string, prisoner: RegisterPrisonerForBookerDto): Promise<boolean> {
  const [withinBookerLimit, withinPrisonerLimit] = await Promise.all([
    this.bookerRateLimit.incrementAndCheckLimit(bookerReference),
    this.prisonerRateLimit.incrementAndCheckLimit(prisoner.prisonerId),
  ])

  if (!withinBookerLimit || !withinPrisonerLimit) {
    logger.info(`Rate limit exceeded for booker ${bookerReference}`)
    throw new TooManyRequests()
  }
  // ... proceed with request
}
```

**Configuration** via environment variables (defaults in [server/config.ts](server/config.ts)):
- `windowSeconds`: Sliding window duration (default 24 hours = 86400 seconds)
- `maxRequests`: Request quota within window (default 50)

Limits are stored in Redis (or in-memory if disabled) with key format: `{keyPrefix}:{identifier}`.

## API Client Error Handling

**RestClient** ([server/data/restClient.ts](server/data/restClient.ts)) standardizes HTTP client behavior:
- Uses `superagent` with automatic retry (2 retries) for transient errors
- Sanitizes all errors via [server/sanitisedError.ts](server/sanitisedError.ts) to extract meaningful fields
- Logs all errors before throwing

**SanitisedError structure:**
```typescript
interface SanitisedError {
  status?: number       // HTTP status code
  data?: unknown        // Parsed response body
  text?: string         // Raw response text
  message: string
  stack: string
}
```

**Status-Specific Handling** in API clients (e.g., [server/data/orchestrationApiClient.ts](server/data/orchestrationApiClient.ts)):
```typescript
async addVisitorRequest(...): Promise<...> {
  try {
    const result = await this.restClient.post({ ... })
    return result.status
  } catch (error) {
    // 422 = validation error - return error code instead of throwing
    if ((<SanitisedError>error)?.status === 422) {
      return error?.data?.validationError  // e.g., 'VISITOR_ALREADY_EXISTS'
    }
    // Other errors (4xx, 5xx) propagate to controller
    throw error
  }
}
```

**In Controllers:**
- Catch expected business errors (e.g., validation failures) and set flash errors
- Re-throw unexpected errors (5xx, network) to global error handler via next(error)
- Always log context when catching API errors

## Critical Commands

| Task | Command |
|------|---------|
| **Setup** | `npm run setup` (must be Node 24.x, npm 11.x) |
| **Dev (with auto-rebuild)** | `npm run start:dev` (concurrent: views, TS, Node, Sass) |
| **Build** | `npm run build` (SASS + TypeScript + copy views) |
| **Unit Tests** | `npm run test` (Jest, runs *.test.ts files) |
| **Integration Tests (headless)** | `npm run int-test` (Cypress) |
| **Integration Tests (UI)** | `npm run int-test-ui` (Cypress UI) |
| **Feature Testing Setup** | `docker-compose -f docker-compose-test.yml up` (WireMock, Redis, OIDC simulator) |
| **Feature Tests (dev mode)** | `npm run start-feature:dev` + `npm run int-test` in another terminal |
| **Lint** | `npm run lint` (ESLint, zero warnings policy) |
| **Type Check** | `npm run typecheck` (tsc for server + integration_tests) |

## Session & Journey Objects

Sessions store multi-step journeys as plain objects. Key session objects:
- `session.bookVisitJourney` - Holds selected prisoner, visitors, times, contact details across the booking flow
- `session.addPrisonerJourney` - Temporarily stores prisoner details during add prisoner flow
- `session.addVisitorJourney` - Temporarily stores visitor details during add visitor flow
- `session.booker` - Current user's booker reference (set by [server/middleware/populateCurrentBooker.ts](server/middleware/populateCurrentBooker.ts))

Type definitions are in [server/@types/bapv.d.ts](server/@types/bapv.d.ts).

## Environment Setup

**Dev Environment Variables** (see README.md for full list):
```
NODE_ENV=development
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
ORCHESTRATION_API_URL=https://hmpps-manage-prison-visits-orchestration-dev...
GOVUK_ONE_LOGIN_VTR=LOW  # Skips OTP verification locally
```

**Redis:** Enabled via `REDIS_ENABLED=true`. Falls back to in-memory cache otherwise.

**Maintenance Mode:** Controlled by `MAINTENANCE_MODE` and `MAINTENANCE_MODE_END_DATE_TIME` env vars (Helm config). All requests except `/health, /info, /ping` are served the maintenance page.

## Testing Patterns

**Unit Tests:**
- Controllers tested via `supertest` with mock session data
- Use `appWithAllRoutes()` helper from [server/routes/testutils/appSetup.ts](server/routes/testutils/appSetup.ts) to create Express app with route handlers
- Mock services injected via Services object
- Use `flashProvider` mock to assert flash message calls

**Integration Tests:**
- Located in [integration_tests/e2e/](integration_tests/e2e/)
- Mock APIs via WireMock + custom simulators (govukOneLoginSimulator, hmppsAuth, etc.)
- Redis helpers available for test data setup
- Run against feature.env configuration

Example unit test pattern:
```typescript
let app: Express
let sessionData: SessionData
let flashData: FlashData

beforeEach(() => {
  sessionData = {} as SessionData
  app = appWithAllRoutes({ sessionData })
  flashData = {}
  flashProvider.mockImplementation((key) => flashData[key])
})
```

## Common Development Workflows

**Adding a new form step to the booking journey:**
1. Create controller class with `view()` / `validate()` / `submit()` in new folder under [server/routes/bookVisit/](server/routes/bookVisit/)
2. Define path constant in [server/constants/paths.ts](server/constants/paths.ts)
3. Add route in [server/routes/bookVisit/index.ts](server/routes/bookVisit/index.ts)
4. **Add journey step to array in bookVisitSessionValidator middleware** (critical!)
5. Create session object property in [server/@types/bapv.d.ts](server/@types/bapv.d.ts)
6. Create view template in [server/views/bookVisit/](server/views/bookVisit/)

**Adding validation:**
Use `express-validator` body() chains. For complex validation (e.g., date of birth), extract to [server/utils/validations.ts](server/utils/validations.ts) and reuse via `dateOfBirthValidationChain()` pattern.

**Debugging API Integration:**
- Services use API client builders to scope tokens correctly
- Check [server/data/orchestrationApiClient.ts](server/data/orchestrationApiClient.ts) for request/response handling
- Integration tests mock API responses via [integration_tests/mockApis/orchestration.ts](integration_tests/mockApis/orchestration.ts)

## Notes

- **GOV.UK One Login:** Test keys stored in [integration_tests/testKeys/](integration_tests/testKeys/). Private key in Kubernetes secret for production.
- **Zero-warning linting policy:** Fix all ESLint warnings—CI will fail otherwise.
- **Date handling:** Use `date-fns` library throughout (not moment or native Date).
- **Phone number validation:** Uses `libphonenumber-js` for UK phone validation.
- **Assets:** SCSS files auto-compile to CSS, views auto-copy during dev mode.
