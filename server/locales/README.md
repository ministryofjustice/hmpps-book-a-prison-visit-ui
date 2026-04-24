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

{# Nested translation reference (for reusable strings) #}
<p>{{ t("bookVisit:checkVisitDetails.visitors") }}</p>
where that key value contains: "{{ t('common:plurals.visitor', { \"count\": {{ visitorCount }} }) }}"

{# Using translation in conditionals #}
{% if not email %}
  <p>{{ t("common:labels.noContactDetails") }}</p>
{% endif %}
```

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
