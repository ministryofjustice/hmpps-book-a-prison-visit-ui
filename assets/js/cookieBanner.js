;(() => {
  function confirmCookiesChoice(acceptAnalytics) {
    document.getElementById('cookie-banner-main').hidden = true

    const confirmationMessage =
      acceptAnalytics === 'yes'
        ? document.getElementById('cookie-banner-accepted')
        : document.getElementById('cookie-banner-rejected')

    confirmationMessage.hidden = false
    confirmationMessage.tabIndex = -1
    confirmationMessage.role = 'alert'
    confirmationMessage.focus()

    const cookiePageRadio = document.querySelector(`input[name=acceptAnalytics][value=${acceptAnalytics}]`)
    if (cookiePageRadio) {
      cookiePageRadio.checked = true
    }

    setAnalyticsPreferenceCookie(acceptAnalytics)
  }

  function hideCookiesConfirmation(banner) {
    banner
      .querySelectorAll('#cookie-banner-accepted, #cookie-banner-rejected')
      .forEach(message => (message.hidden = true))

    banner.hidden = true
  }

  function removeAnalyticsCookies() {
    const domain = location.hostname === 'localhost' ? 'localhost' : 'justice.gov.uk'
    const expires = new Date(0).toUTCString()
    const gaID = document
      .querySelector('[data-google-analytics-id]')
      ?.getAttribute('data-google-analytics-id')
      .replace('G-', '')
    document.cookie = `_ga=; domain=${domain}; expires=${expires}; path=/;`
    document.cookie = `_ga_${gaID}=; domain=${domain}; expires=${expires}; path=/;`
  }

  function setAnalyticsPreferenceCookie(acceptAnalytics) {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    const cookieValue = encodeURIComponent(JSON.stringify({ acceptAnalytics }))
    const cookie = `cookie_policy=${cookieValue}; expires=${expires.toUTCString()}; path=/; Secure`

    document.cookie = cookie

    if (acceptAnalytics === 'no') {
      removeAnalyticsCookies()
    }
  }

  const cookieBanner = document.getElementById('cookie-banner')
  if (cookieBanner) {
    cookieBanner.hidden = false

    cookieBanner.querySelectorAll('#cookie-banner-main button').forEach(button => {
      button.addEventListener('click', () => confirmCookiesChoice(button.value))
    })

    cookieBanner.querySelectorAll('#cookie-banner-accepted button, #cookie-banner-rejected button').forEach(button => {
      button.addEventListener('click', () => hideCookiesConfirmation(cookieBanner))
    })
  }
})()
