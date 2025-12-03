# hmpps-book-a-prison-visit-ui
[![Ministry of Justice Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/hmpps-book-a-prison-visit-ui/badge?style=flat)](https://github-community.service.justice.gov.uk/repository-standards/hmpps-book-a-prison-visit-ui)
[![pipeline](https://github.com/ministryofjustice/hmpps-book-a-prison-visit-ui/actions/workflows/pipeline.yml/badge.svg)](https://github.com/ministryofjustice/hmpps-book-a-prison-visit-ui)
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/hmpps-book-a-prison-visit-ui)

Public facing prison visits booking application.

## Running the app for development
Install dependencies using `npm run setup`, ensuring you are using `node v24.x` and `npm v11.x`

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json` and the CircleCI build config.

Using your personal client credentials, create a `.env` local settings file
```bash
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
NODE_ENV=development

SYSTEM_CLIENT_ID="<system_client_id>"
SYSTEM_CLIENT_SECRET="<system_client_secret>"

ORCHESTRATION_API_URL="https://hmpps-manage-prison-visits-orchestration-dev.prison.service.justice.gov.uk"

PRISON_REGISTER_API_URL="https://prison-register-dev.hmpps.service.justice.gov.uk"

GOVUK_ONE_LOGIN_URL=https://oidc.integration.account.gov.uk
GOVUK_ONE_LOGIN_HOME_URL=https://home.integration.account.gov.uk
GOVUK_ONE_LOGIN_VTR=LOW # LOW will skip the OTP verification during sign-in
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


## Maintenance page
The application has a maintenance page with a service unavailable message. It can also optionally show a date when the service will be available again. The maintenance page is served for all requests except the 'health check' ones (`/health, /info, /ping`).

This behaviour is controlled by two environment variables. Default values are in Helm config:
```
  MAINTENANCE_MODE: "false"
  # Optional maintenance end date (in ISO format, YYYY-MM-DDTHH:MM)
  MAINTENANCE_MODE_END_DATE_TIME: ""
```

To see the current state of these variables, use this command:
```
# example is for 'dev' namespace; replace with 'prod' as appropriate

kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/hmpps-book-a-prison-visit-ui --list
```

Maintenance mode can be turned on by either:
* changing the values for an environment (e.g. prod) in Helm config, committing and deploying
* manually changing the values for an environment and restarting the pods


### Manually enabling maintenance mode
To turn on maintenance mode, use one of these commands (depending on whether an end date and time should be shown):
```
# examples are for 'dev' namespace; replace with 'prod' as appropriate

# Enable maintenance with no end date and time displayed
kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/hmpps-book-a-prison-visit-ui MAINTENANCE_MODE=true

# Enable maintenance page that includes an end date and time
kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/hmpps-book-a-prison-visit-ui MAINTENANCE_MODE=true MAINTENANCE_MODE_END_DATE_TIME=2025-10-01T14:00
```

This will update the environment variables and restart the pods. To see the status of pods, use:
```
kubectl -n visit-someone-in-prison-frontend-svc-dev get pods
```
Once these are restarted, the maintenance page will be active.


### Manually disabling maintenance mode
To turn off maintenance mode, run this command:
```
# example is for 'dev' namespace; replace with 'prod' as appropriate

kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/hmpps-book-a-prison-visit-ui MAINTENANCE_MODE=false
```
This will update the environment variables and restart the pods. Once these are restarted, the maintenance page will be turned off.


---

This project is tested with BrowserStack
