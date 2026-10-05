import { defineMessages } from '../../i18n/index.ts';

export const messages = defineMessages({
  'zh-TW': {
    'settings.nav': '設定',
    'settings.title': '設定',
    'settings.language.title': '語言',
    'settings.language.body': '選擇介面語言，之後會記住你的選擇。',
    'settings.theme.title': '外觀',
    'settings.theme.system': '跟隨系統',
    'settings.theme.light': '淺色',
    'settings.theme.dark': '深色',
    'settings.data.title': '資料備份',
    'settings.data.body':
      '資料只存在這台裝置上。匯出一份備份，換手機或清除瀏覽器資料時才不會遺失。',
    'settings.data.export': '匯出備份',
    'settings.data.import': '匯入備份',
    'settings.data.schema': '資料格式版本：{version}',
    'settings.data.imported': '已匯入備份。',
    'settings.error.invalid-json': '這個檔案不是有效的 JSON。',
    'settings.error.not-a-backup': '這個檔案不是 Kaeru 的備份。',
    'settings.error.unsupported-version': '這份備份來自較新版本的 Kaeru，請先更新。',
  },
  en: {
    'settings.nav': 'Settings',
    'settings.title': 'Settings',
    'settings.language.title': 'Language',
    'settings.language.body': 'Choose the interface language. Your choice is remembered.',
    'settings.theme.title': 'Appearance',
    'settings.theme.system': 'Match system',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.data.title': 'Backup',
    'settings.data.body':
      'Your data lives only on this device. Export a backup so you do not lose it when you change phone or clear browser data.',
    'settings.data.export': 'Export backup',
    'settings.data.import': 'Import backup',
    'settings.data.schema': 'Data format version: {version}',
    'settings.data.imported': 'Backup imported.',
    'settings.error.invalid-json': 'That file is not valid JSON.',
    'settings.error.not-a-backup': 'That file is not a Kaeru backup.',
    'settings.error.unsupported-version':
      'That backup comes from a newer version of Kaeru. Update the app first.',
  },
});
