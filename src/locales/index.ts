import i18next from 'i18next'
import en from './en.json' with { type: 'json' }
import ru from './ru.json' with { type: 'json' }
import zh from './zh.json' with { type: 'json' }

const i18n = i18next
const defaultLanguage = 'zh'
export const languages = [
  {
    code: 'zh',
    name: '简体中文',
    file: zh,
  },
  {
    code: 'en',
    name: 'English',
    file: en,
  },
  {
    code: 'ru',
    name: 'Russian',
    file: ru,
  },
] as const

export function setupI18n() {
  return i18next.init({
    lng: defaultLanguage,
    fallbackLng: defaultLanguage,
    interpolation: {
      prefix: '{',
      suffix: '}',
      escapeValue: false,
    },
    resources: Object.fromEntries(languages.map(language => [language.code, { translation: language.file }])),
  })
}

export default i18n
