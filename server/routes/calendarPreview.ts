import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

type CalendarData = {
  selectedDate: string
  months: Record<
    string,
    {
      startDayColumn: number
      dates: Record<string, { reference: string; time: string; duration: string }[]>
    }
  >
}

const calendarData: CalendarData = {
  selectedDate: '2024-02-24',
  months: {
    'February 2024': {
      startDayColumn: 4, // 1 = first date is a Monday
      dates: {
        '2024-02-22': [],
        '2024-02-23': [],
        '2024-02-24': [
          { reference: 'a', time: '10am to 11:30am', duration: '1 hour and 30 minutes' },
          { reference: 'b', time: '4:30pm to 6:30am', duration: '2 hours' },
        ],
        '2024-02-25': [],
        '2024-02-26': [{ reference: 'c', time: '11am to 12:30am', duration: '1 hour and 30 minutes' }],
        '2024-02-27': [
          { reference: 'd', time: '9:30am to 10:30am', duration: '1 hour' },
          { reference: 'e', time: '1pm to 3pm', duration: '2 hours' },
        ],
        '2024-02-28': [],
        '2024-02-29': [
          { reference: 'f', time: '10am to 11:30am', duration: '1 hour and 30 minutes' },
          { reference: 'g', time: '4:30pm to 6:30am', duration: '2 hours' },
        ],
      },
    },

    'March 2024': {
      startDayColumn: 5,
      dates: {
        '2024-03-01': [],
        '2024-03-02': [{ reference: 'h', time: '11am to 12:30am', duration: '1 hour and 30 minutes' }],
        '2024-03-03': [
          { reference: 'i', time: '9:30am to 10:30am', duration: '1 hour' },
          { reference: 'j', time: '1pm to 3pm', duration: '2 hours' },
        ],
        '2024-03-04': [],
        '2024-03-05': [],
        '2024-03-06': [
          { reference: 'k', time: '10am to 11:30am', duration: '1 hour and 30 minutes' },
          { reference: 'l', time: '4:30pm to 6:30am', duration: '2 hours' },
        ],
        '2024-03-07': [],
        '2024-03-08': [],
        '2024-03-09': [{ reference: 'm', time: '11am to 12:30am', duration: '1 hour and 30 minutes' }],
        '2024-03-10': [
          { reference: 'n', time: '9:30am to 10:30am', duration: '1 hour' },
          { reference: 'o', time: '1pm to 3pm', duration: '2 hours' },
        ],
        '2024-03-11': [],
        '2024-03-12': [],
        '2024-03-13': [
          { reference: 'p', time: '10am to 11:30am', duration: '1 hour and 30 minutes' },
          { reference: 'q', time: '4:30pm to 6:30am', duration: '2 hours' },
        ],
        '2024-03-14': [{ reference: 'r', time: '11am to 12:30am', duration: '1 hour and 30 minutes' }],
        '2024-03-15': [],
        '2024-03-16': [
          { reference: 'd', time: '9:30am to 10:30am', duration: '1 hour' },
          { reference: 't', time: '1pm to 3pm', duration: '2 hours' },
        ],
        '2024-03-17': [
          { reference: 'u', time: '10am to 11:30am', duration: '1 hour and 30 minutes' },
          { reference: 'v', time: '4:30pm to 6:30am', duration: '2 hours' },
        ],
        '2024-03-18': [{ reference: 'w', time: '11am to 12:30am', duration: '1 hour and 30 minutes' }],
      },
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/calendar-preview', (req, res, next) => {
    res.render('pages/calendarPreview', { calendarData })
  })

  return router
}
