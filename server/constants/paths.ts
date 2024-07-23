const paths = {
  HOME: '/',

  ACCESS_DENIED: '/access-denied',
  SIGN_IN: '/sign-in',
  SIGN_OUT: '/sign-out',
  SIGNED_OUT: '/signed-out',

  BOOKINGS: {
    HOME: '/bookings',
    VISIT: '/bookings/details',
  },

  BOOK_VISIT: {
    ROOT: '/book-visit',
    SELECT_PRISONER: '/book-visit/select-prisoner',
    CANNOT_BOOK: '/book-visit/visit-cannot-be-booked',
    SELECT_VISITORS: '/book-visit/select-visitors',
    CHOOSE_TIME: '/book-visit/choose-visit-time',
    ADDITIONAL_SUPPORT: '/book-visit/additional-support',
    MAIN_CONTACT: '/book-visit/main-contact',
    CHECK_DETAILS: '/book-visit/check-visit-details',
    BOOKED: '/book-visit/visit-booked',
  },

  ACCESSIBILITY: '/accessibility-statement',
  COOKIES: '/cookies',
  PRIVACY: '/privacy-notice',
  TERMS: '/terms-and-conditions',
} as const

export default paths
