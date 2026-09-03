import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { createMockBookerService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { MoJAlert } from '../../@types/bapv'

let app: Express

const bookerService = createMockBookerService()
let sessionData: SessionData
let flashData: FlashData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const visitor = TestData.visitor()

beforeEach(() => {
  bookerService.getVisitorRequests.mockResolvedValue([])

  flashData = {}
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
  } as SessionData
  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visitors page', () => {
  it('should redirect to Visits home page if no prisoner details in session', () => {
    sessionData.booker!.prisoners = []
    return request(app)
      .get(paths.VISITORS)
      .expect(302)
      .expect('location', paths.VISITS.HOME)
      .expect(() => {
        expect(bookerService.getVisitors).not.toHaveBeenCalled()
      })
  })

  it('should render the visitors page with all visitors associated with the booker', () => {
    bookerService.getVisitors.mockResolvedValue([visitor])

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visitors -/)
        expect($('h1').text()).toBe('Visitors')
        expect($('.moj-alert').length).toBe(0)

        expect($('[data-test="prisoner-visitors"]').text()).toBe('John Smith’s visitors')
        expect($('[data-test="visitor-name-0"]').text()).toBe('Joan Phillips')
        expect($('[data-test="visitor-dob-0"]').text()).toBe('21 February 1980')
        expect($('[data-test="visitor-availability-0"]').text()).toBe('Yes')
        expect($('[data-test=no-visitors]').length).toBe(0)
        expect($('[data-test=visitor-requests]').length).toBe(0)
        expect($('[data-test=link-a-visitor]').length).toBe(1)

        expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
        expect(bookerService.getVisitorRequests).toHaveBeenCalledWith({
          bookerReference,
          prisonerNumber: prisoner.prisonerNumber,
        })
      })
  })

  it('should render the visitor page with message when booker has no associated visitors', () => {
    bookerService.getVisitors.mockResolvedValue([])

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visitors -/)
        expect($('h1').text()).toBe('Visitors')
        expect($('[data-test="prisoner-visitors"]').text()).toBe('John Smith’s visitors')
        expect($('[data-test="visitor-name-1"]').length).toBe(0)
        expect($('[data-test=no-visitors]').text().trim()).toContain('Warning')
        expect($('[data-test=no-visitors]').text().trim()).toContain('No visitors are linked to your account')
        expect($('[data-test=link-a-visitor]').length).toBe(1)
        expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
        expect(bookerService.getVisitorRequests).toHaveBeenCalledWith({
          bookerReference,
          prisonerNumber: prisoner.prisonerNumber,
        })
      })
  })

  it('should render visitor requests section and link new visitor button', () => {
    bookerService.getVisitors.mockResolvedValue([])

    const visitorRequests = [TestData.visitorRequest()]
    bookerService.getVisitorRequests.mockResolvedValue(visitorRequests)

    app = appWithAllRoutes({ services: { bookerService }, sessionData })

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test=visitor-requests]').length).toBe(1)
        expect($('[data-test=visitor-request-name-0]').text()).toBe('Joan Phillips')
        expect($('[data-test=visitor-request-dob-0]').text()).toBe('21 February 1980')
        expect($('[data-test=visitor-request-cancel-0]').text()).toBe(
          'Cancel request to link Joan Phillips to your account',
        )
        expect($('[data-test=visitor-request-cancel-0] a').prop('href')).toBe(
          `${paths.CANCEL_VISITOR_REQUEST.CANCEL}/${visitorRequests[0].visitorRequestDisplayId}`,
        )

        expect($('[data-test=link-a-visitor]').attr('href')).toBe(paths.ADD_VISITOR.START)

        expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
        expect(bookerService.getVisitorRequests).toHaveBeenCalledWith({
          bookerReference,
          prisonerNumber: prisoner.prisonerNumber,
        })
      })
  })

  it('should render alert message if set in flash', () => {
    const alert: MoJAlert = {
      variant: 'information',
      title: 'Alert title',
      showTitleAsHeading: true,
      text: 'Alert text',
    }
    flashData = { messages: [alert] }

    bookerService.getVisitors.mockResolvedValue([])

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-alert').eq(0).text()).toContain(alert.title)
        expect($('.moj-alert').eq(0).text()).toContain(alert.text)
      })
  })
})
