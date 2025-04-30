const paths = {
  START: '/',
  HOME: '/home',
  RETURN_HOME: '/return-home', // used to clear session and redirect to HOME

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
  },

  BOOKINGS: {
    HOME: '/bookings',
    PAST: '/bookings/past-visits',
    CANCELLED: '/bookings/cancelled-visits',
    VISIT: '/bookings/details',
    VISIT_PAST: '/bookings/past/details',
    VISIT_CANCELLED: '/bookings/cancelled/details',

    // Cancel journey
    CANCEL_VISIT: '/bookings/cancel-booking',
    CANCEL_CONFIRMATION: '/bookings/booking-cancelled',
  },

  VISITORS: '/visitors',

  ACCESSIBILITY: '/accessibility-statement',
  COOKIES: '/cookies',
  PRIVACY: '/privacy-notice',
  TERMS: '/terms-and-conditions',
} as const

export default paths
