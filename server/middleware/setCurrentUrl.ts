import { RequestHandler } from 'express'
import config from '../config'

export default function setCurrentUrl(): RequestHandler {
  return (req, res, next) => {
    const currentUrl = new URL(req.originalUrl, config.domain)

    res.locals.currentUrlEn = new URL(currentUrl)
    res.locals.currentUrlEn.searchParams.set('lng', 'en')

    res.locals.currentUrlCy = new URL(currentUrl)
    res.locals.currentUrlCy.searchParams.set('lng', 'cy')
    next()
  }
}
