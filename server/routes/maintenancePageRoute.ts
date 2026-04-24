import { Router } from 'express'
import config from '../config'
import { DateFormats } from '../constants/dateFormats'
import { formatDate, formatTimeFromDateTime } from '../utils/utils'
import { Locale } from '../constants/locales'

export default function maintenancePage(): Router {
  const router = Router()
  const { enabled, endDateTime } = config.maintenance

  if (enabled) {
    router.use((req, res) => {
      const endTime = formatTimeFromDateTime(endDateTime, req.language as Locale)
      const endDate = formatDate(endDateTime, DateFormats.DISPLAY_DATE_WITH_DAY, req.language as Locale)

      const maintenanceMessage =
        endTime && endDate
          ? req.t('staticPages:maintenance.availableFrom', { time: endTime, date: endDate })
          : req.t('staticPages:maintenance.availableLater')

      // don't load analytics or display cookie banner
      res.locals.analyticsEnabled = false

      return res.render('pages/maintenancePage', { maintenanceMessage, hideFooterLinks: true })
    })
  }

  return router
}
