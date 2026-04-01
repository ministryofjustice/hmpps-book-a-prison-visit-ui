Content split for translations:

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
