Content split for translations:

## i18next Setup & Usage

This application uses **i18next** for internationalization (i18n). Configuration is in [server/middleware/setUpI18n.ts](../middleware/setUpI18n.ts).

### Core Setup

- **Language Detection**: Detects language via query parameter (`?lng=cy`) or cookie (`lng`), with English (en) as fallback
- **Supported Locales**: English (en), Welsh (cy)
- **File Backend**: JSON files loaded from `server/locales/{lng}/{namespace}.json` at startup
- **Namespaces**: 11 feature-scoped and global namespaces (see "Namespace Overview" below)
- **Interpolation**: Disabled double-escaping (Nunjucks already escapes HTML)
- **Missing Key Handler**: Throws error in development to alert translators of missing keys

### Usage in Code

**In Controllers** (Express request handlers):
```typescript
// During validation, access translations via req.t()
body('firstName', 'First name')
  .isLength({ min: 1 })
  .withMessage((_value, { req }) => req.t('validation:firstName'))

// In route handlers, pass t() function to view context
res.render('template', {
  errorMessage: req.t('errors:someError'),
  ...
})
```

**In Nunjucks Templates**:
```nunjucks
{# Simple key reference #}
<h1>{{ t("common:applicationName") }}</h1>

{# Key with interpolation variables #}
<p>{{ t("bookVisit:checkVisitDetails.prisonerAtPrison", {
  name: prisonerName,
  prisonName: prisonLocation
}) }}</p>

{# Translation containing link token, rendered with filter #}
<p>{{ t("common:postBooking.feedback") | renderLinkTag("https://example.test") | safe }}</p>

{# Using translation in conditionals #}
{% if not email %}
  <p>{{ t("common:labels.noContactDetails") }}</p>
{% endif %}
```

Guidance:
- Avoid nested translation calls (`$t(...)`) inside locale values.
- Use interpolation placeholders (for example `{{count}}`) and plural suffix keys (`_one`, `_other`, etc.).
- Use `<link>...</link>` tokens in locale strings and render links in templates with `renderLinkTag`.

**Key Format Convention:**
- `namespace:path.to.key` - namespaces and keys are required
- Keys in JSON can be nested: `{ "checkVisitDetails": { "title": "..." } }` becomes `bookVisit:checkVisitDetails.title`
- Interpolation variables are wrapped in `{{}}` in template usage: `{{ t("key", { varName: value }) }}`

### Nunjucks Filters & Utilities

Several utilities work alongside i18n for localization:

| Filter | Purpose | Example |
|--------|---------|---------|
| `formatDate` | Format date with locale | `visit.date \| formatDate(dateFormats.DISPLAY_DATE, language)` |
| `formatTime` | Format time with locale | `visit.time \| formatTime(language)` |
| `displayAge` | Translate age phrases | `visitor.dob \| displayAge(t)` (uses `common:plurals.ageYears/ageMonths`) |
| `getPrisonName` | Lookup prison name | `prisoner.prisonId \| getPrisonName(prisonNames, language)` |
| `renderLinkTag` | Replaces a `<link>...</link>` token with a safe anchor element | `t("common:postBooking.feedback") \| renderLinkTag(url) \| safe` |

These utilities are registered in [server/utils/nunjucksSetup.ts](../utils/nunjucksSetup.ts).

### Pluralization

i18next handles plural forms via keys with `_one` and `_other` suffixes:
```json
"plurals": {
  "visitor_one": "{{count}} visitor",
  "visitor_other": "{{count}} visitors"
}
```
Usage in templates:
```nunjucks
{{ t("common:plurals.visitor", { "count": visitorList.length }) }}
```

---

## Translating to Welsh via Excel

Translators work from a single `.xlsx` workbook rather than editing JSON directly. Two scripts convert between the two formats:

- `npm run i18n:export-xlsx` - reads `server/locales/en/*.json` and writes `server/locales/translations.xlsx`, one worksheet per namespace, with columns `Translation key | English text | Welsh text`. Keys are flattened with dot-separated paths (e.g. `checkVisitDetails.title`). Any translations already present in `server/locales/cy/*.json` are carried over into the Welsh column, so re-running after adding new English keys only leaves the new rows blank.
- `npm run i18n:import-xlsx` - reads the completed `server/locales/translations.xlsx` and writes `server/locales/cy/*.json`. Only rows with a non-empty Welsh cell are written, so untranslated keys keep falling back to English. Warns if the sheet has keys missing from, or not found in, the corresponding English JSON file.

Workflow: run `i18n:export-xlsx`, send `server/locales/translations.xlsx` to the translator, then run `i18n:import-xlsx` once it's returned completed. The `.xlsx` file itself is git-ignored - it's a working file, not a source of truth.

## Checking for missing translations
Use `npm run i18n:locale-compare` to compare the set of English and Welsh translations. It will report on:
* any JSON files missing from either locale
* any translation keys missing from either locale
* any pluralised Welsh key missing one of Welsh's 6 CLDR plural categories
* any Welsh translation that may be stale because its English source text has changed since it was last translated (see below)

## Checking for stale translations

English copy sometimes gets edited after it's already been translated into Welsh, and nothing about the file structure shows that the Welsh text is now out of date. `server/locales/translation-state.json` tracks this: for every key (or, for pluralised keys, every base such as `maxAdults` covering its `_one`/`_other`/etc. forms) it stores a short hash of the English text at the point it was last translated.

* `npm run i18n:locale-compare` recomputes the current English hashes and reports any key/plural-group whose hash no longer matches what's stored - this means the Welsh text was translated against an earlier version of the English and should be reviewed. For a pluralised key, changing *either* the English `_one` or `_other` form flags *all* of that base's Welsh forms (including Welsh-only ones like `_two`/`_few`/`_many` that have no English equivalent), since they're all translations of the same underlying sentence.
* `npm run i18n:import-xlsx` automatically updates `translation-state.json` for every key it writes a Welsh translation for, recording that the Welsh now matches the current English. Nothing manual is normally needed here.
* `npm run i18n:reset-translation-state` recomputes `translation-state.json` from scratch to match whatever is currently in `en`/`cy`, treating all existing translations as up to date. Use this once when first adopting this tracking (to avoid a flood of false positives for existing translations), or any time an English change is reviewed and judged not to need a matching Welsh update (e.g. a punctuation-only tweak).

`translation-state.json` is committed to the repository, unlike `translations.xlsx` which is a git-ignored working file.

## Namespace Overview

Translator guidance:

* see `TRANSLATOR_CONTEXT.md` for key-group-to-screen mapping and interpolation variable context

* common:
  * app-wide reusable copy used across journeys and shared templates
  * includes service name, navigation/footer labels, phase banner, cookie banner, global buttons, shared labels, generic hints and back link text
* validation:
  * reusable form validation messages and field-level generic errors
* errors:
  * API/business errors and general problem states (not field validation)
  * includes copy for generic error pages and auth/service problem pages
* shared:
  * reusable domain content blocks used by multiple journeys/features
  * examples: guidance partials such as `howToChangeVisit`, `howToUpdateRequest`, `visitingInfo`
  * not for global UI chrome (use `common`) and not for a single journey (use a feature namespace)
* feature namespaces:
  * all copy specific to a journey/feature area
  * examples: staticPages, bookVisit, addPrisoner, addVisitor, visits, visitors

Conventions for key shape:

* use `title` for page-level heading text
* use `...Heading` for section headings within a page
* prefer one key name for the same concept across journeys/features

Conventions for reuse:

* if the same sentence appears in multiple features and context is identical, move it to `common`
* keep feature-specific wording in feature namespaces when context differs even if sentences are similar
