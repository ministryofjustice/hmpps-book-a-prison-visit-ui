import TestData from '../testutils/testData'
import { buildPrisonersTableRows } from './prisonersUtils'
import { GOVUKTableRow } from '../../@types/bapv'
import { mockTFunction } from '../../data/testutils/mockI18n'
import paths from '../../constants/paths'

describe('buildPrisonersTableRows', () => {
  it('should build prisoners table rows for prisoners listing pages', () => {
    const prisoners = [
      TestData.prisoner(),
      TestData.prisoner({ firstName: 'PRISONER 2', lastName: 'Last 2', dateOfBirth: '1990-01-01' }),
    ]

    const expectedTableRows: GOVUKTableRow[] = [
      [
        { text: 'John Smith', attributes: { 'data-test': 'prisoner-name-0' } },
        { text: '1 February 1980', attributes: { 'data-test': 'prisoner-dob-0' } },
        {
          html: `<a href="${paths.VISITORS}">prisoners:prisoners.viewVisitorsLink<span class="govuk-visually-hidden"> prisoners:prisoners.viewVisitorsLinkHidden|name:John Smith</span></a>`,
          attributes: { 'data-test': 'prisoner-visitors-link-0' },
        },
      ],
      [
        { text: 'Prisoner 2 Last 2', attributes: { 'data-test': 'prisoner-name-1' } },
        { text: '1 January 1990', attributes: { 'data-test': 'prisoner-dob-1' } },
        {
          html: `<a href="${paths.VISITORS}">prisoners:prisoners.viewVisitorsLink<span class="govuk-visually-hidden"> prisoners:prisoners.viewVisitorsLinkHidden|name:Prisoner 2 Last 2</span></a>`,
          attributes: { 'data-test': 'prisoner-visitors-link-1' },
        },
      ],
    ]

    expect(buildPrisonersTableRows({ prisoners, lng: 'en', t: mockTFunction })).toStrictEqual(expectedTableRows)
  })
})
