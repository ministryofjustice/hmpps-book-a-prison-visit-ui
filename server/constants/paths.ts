const paths = {
  HOME: '/',

  BOOK_VISIT: {
    ROOT: '/book-visit',
    SELECT_PRISONER: '/book-visit/select-prisoner',
    SELECT_VISITORS: '/book-visit/select-visitors',
    CHOOSE_TIME: '/book-visit/choose-visit-time',
    ADDITIONAL_SUPPORT: '/book-visit/additional-support',
    MAIN_CONTACT: '/book-visit/main-contact',
    CHECK_DETAILS: '/book-visit/check-visit-details',
    BOOKED: '/book-visit/visit-booked',
  },

  // Footer links
  ACCESSIBILITY: '/accessibility-statement',
  COOKIES: '/cookies-policy',
  PRIVACY: '/privacy-policy',
} as const

export default paths
