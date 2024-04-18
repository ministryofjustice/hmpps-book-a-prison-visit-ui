# hmpps-book-a-prison-visit-ui
[![repo standards badge](https://img.shields.io/badge/dynamic/json?color=blue&style=flat&logo=github&label=MoJ%20Compliant&query=%24.result&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-book-a-prison-visit-ui)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#hmpps-book-a-prison-visit-ui "Link to report")
[![CircleCI](https://circleci.com/gh/ministryofjustice/hmpps-book-a-prison-visit-ui/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/hmpps-book-a-prison-visit-ui)

Public facing prison visits booking application.

## Running the app for development
The easiest way to run the app is to use docker compose to create the service and all dependencies. 

```bash
docker-compose pull
docker-compose up
```

Install dependencies using `npm install`, ensuring you are using `node v20.x` and `npm v10.x`

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json` and the CircleCI build config.

Using your personal client credentials, create a `.env` local settings file
```bash
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
NODE_ENV=development

SYSTEM_CLIENT_ID="<system_client_id>"
SYSTEM_CLIENT_SECRET="<system_client_secret>"

BOOKER_REGISTRY_API_URL="https://hmpps-prison-visit-booker-registry-dev.prison.service.justice.gov.uk"
ORCHESTRATION_API_URL="https://hmpps-manage-prison-visits-orchestration-dev.prison.service.justice.gov.uk"

GOVUK_ONE_LOGIN_URL=https://oidc.integration.account.gov.uk
GOVUK_ONE_LOGIN_ACCOUNT_URL=https://home.integration.account.gov.uk
GOVUK_ONE_LOGIN_CLIENT_ID="<govuk_one_login_client_id>"
GOVUK_ONE_LOGIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
<private key contents>
-----END PRIVATE KEY-----"
```

To get some of these values, you will need to speak to a team member or look within the `hmpps-book-a-prison-visit-ui` and `govuk-one-login` secrets in the `visit-someone-in-prison-frontend-svc-dev` namespace.

And then, to build the assets and start the app with nodemon:

`npm run start:dev`

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a wiremock instance by:

`docker-compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either, run tests in headless mode with:

`npm run int-test`
 
Or run tests with the cypress UI:

`npm run int-test-ui`


### Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`

## GOV.UK One Login integration
The [GOV.UK One Login](https://www.sign-in.service.gov.uk) service is used to authenticate users. Refer to the [technical documentation](https://docs.sign-in.service.gov.uk) for more details.

When running this application locally or in development environments, the GOV.UK One Login integration environment is used. This is additionally secured by HTTP Basic Auth. Ask a team member for these credentials.

This application has several changes to core files inherited from the HMPPS TypeScript Template app in order to support GOV.UK One Login. These are:

* an additional Kubernetes secret `govuk-one-login` in the namespace to store the private key, etc.
* client and server public/private key pairs (in `./integration_tests/testKeys/`) for integration testing
* a new NPM task (`oidc-wiremock`) and customisations to `start-feature` and `watch-node-feature` that ensure the OIDC Discovery Endpoint mock and a private key is available before the application starts
