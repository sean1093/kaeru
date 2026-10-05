/**
 * Message bundle for content-layer chrome: fixed strings the content screens render
 * around the data, not prose that lives inside a `GuideArticle` or `FaqEntry`.
 *
 * `content.operators.disclaimer` is the association's own caveat (`DR-053`): the operator
 * list is a declaration of intent, not an approval or guarantee. `OperatorDirectory`
 * carries its key rather than its text so the directory screen renders it the same way
 * regardless of which operators are in the list.
 */
import { defineMessages } from '../i18n/index.ts';

export const messages = defineMessages({
  'zh-TW': {
    'content.operators.disclaimer':
      '以下業者已向日本全國免稅店協會表示將提供退款服務。協會明確說明，該名單僅是業者自行申報，不代表認可或保證；Kaeru 與日本政府同樣不為任何一家背書。通常要等到付完錢，你才會知道這家店用哪一家業者——收據上的 QR Code 才是可靠答案。',
  },
  en: {
    'content.operators.disclaimer':
      'These companies have told the National Tax-Free Shop Association they intend to handle refunds. The association is clear that this is a list of declarations, not an approval or guarantee — and neither Kaeru nor the Japanese government endorses any of them. You usually cannot tell which one a shop uses until you have paid; the QR code on your receipt is the reliable answer.',
  },
});
