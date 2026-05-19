import { RequestHandler } from 'express'

export default function setCurrentUrl(): RequestHandler {
  return (req, res, next) => {
    const currentUrl = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`)

    res.locals.currentUrlEn = new URL(currentUrl)
    res.locals.currentUrlEn.searchParams.set('lng', 'en')

    res.locals.currentUrlCy = new URL(currentUrl)
    res.locals.currentUrlCy.searchParams.set('lng', 'cy')
    next()
  }
}
