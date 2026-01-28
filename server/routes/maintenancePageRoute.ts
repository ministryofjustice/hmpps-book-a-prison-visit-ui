import { Router } from 'express'
import { format, parseISO } from 'date-fns'
import config from '../config'
import { DateFormats } from '../constants/dateFormats'

export default function maintenancePage(): Router {
  const router = Router()
  const { enabled, endDateTime } = config.maintenance

  if (enabled) {
    router.use((req, res) => {
      let maintenanceMessage: string
      try {
        const parsedEndDateTime = parseISO(endDateTime)
        const timeFormat = parsedEndDateTime.getMinutes() === 0 ? 'haaa' : 'h:mmaaa' // 2pm instead of 2:00pm
        const endTime = format(parsedEndDateTime, timeFormat)
        const endDate = format(parsedEndDateTime, DateFormats.PRETTY_DATE)

        maintenanceMessage = `You will be able to use the service from ${endTime} on ${endDate}.`
      } catch {
        maintenanceMessage = 'You will be able to use the service later.'
      }

      // don't load analytics or display cookie banner
      res.locals.analyticsConsentGiven = false

      return res.render('pages/maintenancePage', { maintenanceMessage, hideFooterLinks: true })
    })
  }

  return router
}
