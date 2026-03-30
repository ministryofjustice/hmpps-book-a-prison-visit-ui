import i18next from 'i18next'
import setUpI18n from './setUpI18n'

describe('i18next setup', () => {
  it('should throw an error when a translation key is missing in non-production mode', () => {
    setUpI18n(false)

    expect(() => i18next.t('common:this.translation.key.does.not.exist')).toThrow(
      "Missing translation for key 'this.translation.key.does.not.exist' in namespace 'common' and language 'en'",
    )
  })

  it('should render the missing translation key in production mode', () => {
    setUpI18n(true)

    expect(i18next.t('common:this.translation.key.does.not.exist')).toBe('this.translation.key.does.not.exist')
  })
})
