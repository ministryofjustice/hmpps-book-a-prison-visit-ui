# Translator Context (UI + Locale Keys)

This page gives translation context for locale namespaces in `server/locales/*`.
Use it with English source files in `server/locales/en`.

## 1) Namespace to Screen Map

| Namespace | Main key groups | Main screens/templates |
|---|---|---|
| `common` | navigation, footer, cookieBanner, buttons, labels, hints, plurals, shared visitor labels | Global layout and shared components: `server/views/partials/layout.njk`, `server/views/partials/cookieBanner.njk`, multiple page templates |
| `errors` | authError, error, summary labels | `server/views/authError.njk`, `server/views/pages/error.njk`, `server/views/partials/errorSummary.njk` |
| `validation` | reusable form validation messages | Used by controllers and rendered on form pages across journeys |
| `addPrisoner` | prisonerLocation, prisonerDetails, prisonerAdded, prisonerNotMatched | `server/views/pages/addPrisoner/*` |
| `addVisitor` | addVisitorStart, visitorDetails, checkVisitorDetails, success/failure states, actions | `server/views/pages/addVisitor/*` |
| `bookVisit` | cannotBook, selectVisitors, closedVisit, chooseVisitTime, additionalSupport, contact/check/confirmation pages | `server/views/pages/bookVisit/*` |
| `selectPrison` | selectPrison, selectedPrison | `server/views/pages/selectPrison/*` |
| `shared` | howToChangeVisit, howToUpdateRequest, visitingInfo | Shared partials: `server/views/partials/howToChangeVisit.njk`, `server/views/partials/howToUpdateRequest.njk`, `server/views/partials/visitingInfo.njk` |
| `visitors` | availability, visitors page labels/headings | `server/views/pages/visitors/visitors.njk` |
| `visits` | shared list labels, alerts, future/past/cancelled lists, visit details, cancel journey | `server/views/pages/visits/*` |
| `staticPages` | accessibility, cookies, maintenance, privacy, signedOut, terms | `server/views/pages/staticPages/*`, `server/views/pages/cookies/cookies.njk`, `server/views/pages/maintenancePage.njk` |

## 2) Interpolation Variables (Do Not Translate Variable Names)

Keep placeholders exactly as written, including braces and spacing style.
Example: `{{prisonName}}` must stay unchanged in translated text.

| Variable | Meaning | Typical namespaces |
|---|---|---|
| `url` | Link target injected at runtime | many, especially `staticPages`, `shared`, `errors`, `addVisitor`, `bookVisit`, `selectPrison`, `visits` |
| `name` | Person name (context-specific: prisoner/booker/visitor) | `bookVisit`, `common` |
| `prisonName` | Human-readable prison name | `addPrisoner`, `bookVisit`, `selectPrison`, `shared`, `visits` |
| `date` | Formatted date string | `bookVisit`, `common`, `staticPages`, `visitors`, `visits` |
| `time` | Formatted time string | `staticPages` |
| `startTime` / `endTime` | Visit start/end time strings | `common`, `visits` |
| `count` | Pluralization count | `common.plurals`, `bookVisit`, `validation` |
| `age` / `adultAgeYears` | Age threshold/count context | `validation`, `bookVisit` |
| `maxVisitors` / `maxAdultVisitors` / `maxChildVisitors` | Visit capacity values | `bookVisit.selectVisitors` |
| `phoneNumber` | Prison contact phone number | `shared` |
| `visitReference` | Booking/request reference | `shared` |
| `visitorName` / `prisonerName` | Display names in confirmation/status copy | `addVisitor`, `visits` |

## 3) Content Conventions for Translators

- Keys ending in `title` are page-level headings (usually H1).
- Keys ending in `Heading` are section headings within a page.
- Strings may contain inline HTML (for example `<a href="{{url}}">...</a>`). Keep HTML tags and attributes intact.
- Strings may contain nested translation references (for example `$t(common:plurals.visitor, {"count": {{count}} })`). Do not alter key names inside `$t(...)`.
- Some short labels intentionally repeat across screens (for example "Visitors", "Date and time").

## 4) Quick QA Checklist Before Submitting Translations

- JSON remains valid.
- Placeholder names are unchanged.
- HTML tags are preserved and balanced.
- Apostrophes/quotes are valid JSON-escaped where needed.
- Tone remains plain, service-style GOV.UK English equivalent in target language.
