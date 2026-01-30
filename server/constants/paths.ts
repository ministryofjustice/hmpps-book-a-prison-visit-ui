const paths = {
  GOVUK_START_PAGE: 'https://www.gov.uk/prison-visits',

  ROOT: '/',
  HOME: '/home',
  RETURN_HOME: '/return-home', // used to clear session and redirect to HOME

  SELECT_PRISON: '/select-prison',
  SELECTED_PRISON: '/visiting-selected-prison',

  AUTH_CALLBACK: '/auth/callback',
  AUTH_ERROR: '/auth-error',
  SIGN_IN: '/sign-in',
  SIGN_OUT: '/sign-out',
  SIGNED_OUT: '/signed-out',

  ADD_PRISONER: {
    LOCATION: '/location',
    DETAILS: '/prisoner',
    SUCCESS: '/prisoner-added',
    FAIL: '/prisoner-incorrect',
  },

  ADD_VISITOR: {
    START: '/providing-visitor-information',
    DETAILS: '/visitor',
    CHECK: '/check-visitor-request',
    SUCCESS: '/visitor-requested',
    AUTO_APPROVED: '/visitor-approved',
    FAIL_ALREADY_REQUESTED: '/visitor-already-requested',
    FAIL_ALREADY_LINKED: '/visitor-already-linked',
    FAIL_TOO_MANY_REQUESTS: '/too-many-visitor-requests',
  },

  BOOK_VISIT: {
    ROOT: '/book-visit',
    SELECT_PRISONER: '/book-visit/select-prisoner',
    CANNOT_BOOK: '/book-visit/visit-cannot-be-booked',
    SELECT_VISITORS: '/book-visit/select-visitors',
    CLOSED_VISIT: '/book-visit/closed-visit',
    CHOOSE_TIME: '/book-visit/choose-visit-time',
    ADDITIONAL_SUPPORT: '/book-visit/additional-support',
    MAIN_CONTACT: '/book-visit/main-contact',
    CONTACT_DETAILS: '/book-visit/contact-details',
    CHECK_DETAILS: '/book-visit/check-visit-details',
    BOOKED: '/book-visit/visit-booked',
    REQUESTED: '/book-visit/visit-requested',
  },

  VISITS: {
    HOME: '/visits',
    PAST: '/visits/past-visits',
    CANCELLED: '/visits/cancelled-visits',
    DETAILS: '/visits/details',
    VISIT_PAST: '/visits/past/details',
    VISIT_CANCELLED: '/visits/cancelled/details',

    // Cancel journey
    CANCEL_VISIT: '/visits/cancel-visit',
    CANCEL_CONFIRMATION: '/visits/visit-cancelled',
  },

  VISITORS: '/visitors',

  ACCESSIBILITY: '/accessibility-statement',
  COOKIES: '/cookies',
  PRIVACY: '/privacy-notice',
  TERMS: '/terms-and-conditions',
} as const

export default paths
