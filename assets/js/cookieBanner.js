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

  function getMatomoCookieNames() {
    try {
      return document.cookie.split('; ')
        .map(cookie => cookie.split('=')[0])
        .filter(cookieName => cookieName.startsWith('_pk_id') || cookieName.startsWith('_pk_ses'))
    } catch (e) {
      return []
    }
  }

  function removeAnalyticsCookies() {
    const expires = new Date(0).toUTCString()
    const matomoCookies = getMatomoCookieNames()
    console.log(matomoCookies)

    matomoCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; domain=${location.hostname}; expires=${expires}; path=/;`
    })
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
