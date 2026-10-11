// Two languages, English source strings and an Arabic dictionary keyed by them. Numbers are never
// localised: both versions print Latin digits, as the spec's tables do.

export const LANGUAGES = Object.freeze(['en', 'ar']);
export const DEFAULT_LANGUAGE = 'en';

export const UI = Object.freeze({
  en: Object.freeze({
    title: '6.15 × 7.20 m two-storey house',
    both: 'Both levels',
    ground: 'Ground only',
    first: 'First only',
    section: 'Section',
    cutaway: 'Cutaway',
    full: 'Full',
    exploded: 'Side by side',
    assembled: 'Whole house',
    roof: 'Roof',
    labels: 'Labels',
    dimensions: 'Dimensions',
    reset: 'Reset view',
    language: 'العربية',
    hint: 'Drag to orbit, scroll to zoom. Section drops the walls facing you to 1.20 m and follows the camera; Cutaway lowers every wall; Full shows the whole envelope with glazing. Whole house stacks the levels and seats the roof.',
  }),
  ar: Object.freeze({
    title: 'منزل من طابقين 6.15 × 7.20 م',
    both: 'الطابقان',
    ground: 'الأرضي فقط',
    first: 'الأول فقط',
    section: 'مقطع',
    cutaway: 'قصّ',
    full: 'كامل',
    exploded: 'جنبًا إلى جنب',
    assembled: 'المنزل كاملًا',
    roof: 'السقف',
    labels: 'التسميات',
    dimensions: 'الأبعاد',
    reset: 'إعادة العرض',
    language: 'English',
    hint: 'اسحب للدوران ومرّر للتكبير. «مقطع» يخفض الجدران المواجهة لك إلى 1.20 م ويتبع الكاميرا؛ «قصّ» يخفض كل الجدران؛ «كامل» يعرض الغلاف كله بالزجاج. «المنزل كاملًا» يرصّ الطابقين ويضع السقف.',
  }),
});

// Scene strings: level names, captions, pins, room names, units. Missing entries fall back to English.
const SCENE_AR = Object.freeze({
  'Ground level': 'الطابق الأرضي',
  'First level': 'الطابق الأول',
  gross: 'إجمالي',
  net: 'صافي',
  m: 'م',
  'm²': 'م²',
  'Living / dining': 'الصالون وغرفة الطعام',
  'WC + laundry · window': 'المرحاض والغسيل · نافذة',
  'Hall · WC door, shoe cabinet': 'الممر · باب المرحاض وخزانة الأحذية',
  'Kitchen · door under the stair': 'المطبخ · الباب تحت الدرج',
  'Stair · kitchen door beneath': 'الدرج · باب المطبخ تحته',
  'Main entrance door': 'باب المدخل الرئيسي',
  'Bedroom 1 · master': 'غرفة النوم 1 · الرئيسية',
  Dressing: 'غرفة الملابس',
  'Bedroom 2': 'غرفة النوم 2',
  'Landing · stair arrival': 'البسطة · وصول الدرج',
  Landing: 'البسطة',
  'Shower room · stack in the corner duct': 'غرفة الاستحمام · المجرى في زاوية القناة',
  'Shower room': 'غرفة الاستحمام',
  'Stair void': 'فراغ الدرج',
  Kitchen: 'المطبخ',
  'WC + laundry': 'المرحاض والغسيل',
  Stair: 'الدرج',
  'Bedroom 1': 'غرفة النوم 1',
});

const SCENE = Object.freeze({ en: Object.freeze({}), ar: SCENE_AR });

/** Scene string in the given language; English strings are their own source. */
export function t(text, language) {
  return SCENE[language]?.[text] ?? text;
}

export function ui(key, language) {
  const table = UI[language] ?? UI[DEFAULT_LANGUAGE];
  const value = table[key];
  if (value === undefined) throw new Error(`No UI string "${key}"`);
  return value;
}

export function isRightToLeft(language) {
  return language === 'ar';
}

/** Metres with two decimals and the language's unit, Latin digits in both languages. */
export function metres(value, language) {
  return `${value.toFixed(2)} ${t('m', language)}`;
}

/** Every scene string that must have an Arabic entry, for the completeness test. */
export function sceneDictionary(language) {
  return SCENE[language] ?? {};
}
