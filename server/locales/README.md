Content split for translations:

Translator guidance:

* see `server/locales/TRANSLATOR_CONTEXT.md` for key-group-to-screen mapping and interpolation variable context

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
