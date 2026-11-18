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

Keep placeholders exactly as written.
Use i18next interpolation style with no spaces inside braces, for example `{{prisonName}}`.

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
| `phoneNumber` | Prison contact phone number | `shared` |
| `visitReference` | Booking/request reference | `shared` |
| `visitorName` / `prisonerName` | Display names in confirmation/status copy | `addVisitor`, `visits` |

## 3) Content Conventions for Translators

- Keys ending in `title` are page-level headings (usually H1).
- Keys ending in `Heading` are section headings within a page.
- Locale values should not contain nested translation references (for example `$t(...)`). Use plain text with placeholders and plural suffix keys (`_one`, `_other`, etc.) instead.
- For links, use a `<link>...</link>` token in locale values. Templates render this with the `renderLinkTag` filter.
- Some short labels intentionally repeat across screens (for example "Visitors", "Date and time").

### Welsh plurals need more forms than English

English only has two plural categories: `_one` (exactly 1) and `_other` (everything else,
including 0). Welsh (`cy`) has six CLDR plural categories, selected by count:

| Suffix | Welsh rule | Example counts |
|---|---|---|
| `_zero` | n == 0 | 0 |
| `_one` | n == 1 | 1 |
| `_two` | n == 2 | 2 |
| `_few` | n == 3 | 3 |
| `_many` | n == 6 | 6 |
| `_other` | anything else | 4, 5, 7, 8, 9, 10... |

If `cy/*.json` only defines `_one`/`_other` for a pluralised key, i18next has no
Welsh translation for counts that map to `_zero`/`_two`/`_few`/`_many` and silently
falls back to the English string for those counts. **Every pluralised key in `cy`
must define all six suffixes** - `_two`/`_few`/`_many`/`_zero` can reuse the same
wording as `_other` where the Welsh phrasing doesn't change with the count.

Do not add these extra suffixes (`_zero`/`_two`/`_few`/`_many`) to the English
locale files - i18next only ever looks up `_one`/`_other` for `en`, so they would
be unused, dead keys there.

Run `npm run i18n:locale-compare` to check for missing Welsh plural forms (as well
as missing keys/files between `en` and `cy`).


## 4) Quick QA Checklist Before Submitting Translations

- JSON remains valid.
- Placeholder names are unchanged.
- Link tokens (`<link>...</link>`) are preserved and balanced.
- Apostrophes/quotes are valid JSON-escaped where needed.
- Tone remains plain, service-style GOV.UK English equivalent in target language.
