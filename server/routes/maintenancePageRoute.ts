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
        const endDate = format(parsedEndDateTime, DateFormats.DISPLAY_DATE_WITH_DAY)

        maintenanceMessage = req.t('staticPages:maintenance.availableFrom', { time: endTime, date: endDate })
      } catch {
        maintenanceMessage = req.t('staticPages:maintenance.availableLater')
      }

      // don't load analytics or display cookie banner
      res.locals.analyticsEnabled = false

      return res.render('pages/maintenancePage', { maintenanceMessage, hideFooterLinks: true })
    })
  }

  return router
}
