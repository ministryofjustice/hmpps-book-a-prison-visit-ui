import { RequestHandler } from 'express'

export default function removeLngAndRedirect(): RequestHandler {
  return (req, res, next) => {
    if (req.query.lng) {
      const currentUrl = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`)
      currentUrl.searchParams.delete('lng')
      return res.redirect(`${currentUrl.pathname}${currentUrl.search}`)
    }

    return next()
  }
}
