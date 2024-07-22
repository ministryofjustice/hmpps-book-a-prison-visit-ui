(() => {
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
    banner.querySelectorAll('#cookie-banner-accepted, #cookie-banner-rejected')
      .forEach(message => message.hidden = true)

      banner.hidden = true
  }

  function setAnalyticsPreferenceCookie(acceptAnalytics) {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    const cookieValue = JSON.stringify({ acceptAnalytics })
    const cookie = `cookie_policy=${cookieValue}; expires=${expires.toUTCString()}; path=/; Secure`

    document.cookie = cookie
  }

  const cookieBanner = document.getElementById('cookie-banner')
  if (cookieBanner) {
    cookieBanner.hidden = false

    cookieBanner.querySelectorAll('#cookie-banner-main button').forEach(button => {
      button.addEventListener('click', () => confirmCookiesChoice(button.value))
    })

    cookieBanner.querySelectorAll('#cookie-banner-accepted button, #cookie-banner-rejected button')
      .forEach(button => {
        button.addEventListener('click', () => hideCookiesConfirmation(cookieBanner))
      })
  }
})()
