/**
 * Registry of everything the dashboard can manage.
 * The public site and the admin dashboard both read from here.
 */

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'html' // rich text editor
  | 'image' // path or URL of an image (media picker)
  | 'file' // path or URL of a file (PDF …)
  | 'url'
  | 'number'
  | 'boolean'
  | 'list' // list of strings
  | 'json'; // anything else (edited as JSON)

export interface FieldDef {
  /** column name, or "extra.xxx" for keys inside the extra jsonb column, or a key inside page data */
  name: string;
  label: string;
  kind: FieldKind;
  help?: string;
  /** for kind "json": list of sub-fields when the value is an array of objects */
  itemFields?: FieldDef[];
}

export interface ItemTypeDef {
  type: string;
  label: string; // English label shown in the dashboard
  labelAr: string;
  /** public detail route prefix, e.g. "/bariatricsurgeryDetail" (undefined = no detail page) */
  detailPath?: string;
  /** public listing page */
  listPath?: { ar: string; en: string };
  hasSeo: boolean;
  /** whether the slug is part of a public URL (otherwise generated automatically) */
  slugInUrl: boolean;
  fields: FieldDef[];
  group: 'services' | 'articles' | 'media' | 'home' | 'about' | 'other';
}

const detailFields: FieldDef[] = [
  { name: 'title', label: 'Title', kind: 'text' },
  { name: 'excerpt', label: 'Short description (listing)', kind: 'textarea', help: 'Shown on the listing cards. Leave empty to use the start of the body.' },
  { name: 'image', label: 'Listing image', kind: 'image' },
  { name: 'image_alt', label: 'Listing image alt text', kind: 'text' },
  { name: 'detail_image', label: 'Page image (top of the article)', kind: 'image' },
  { name: 'detail_image_alt', label: 'Page image alt text', kind: 'text' },
  { name: 'detail_image_title', label: 'Page image title', kind: 'text' },
  { name: 'body_html', label: 'Content', kind: 'html' },
  {
    name: 'extra.toc',
    label: 'Table of contents',
    kind: 'json',
    help: 'Links to headings. Each heading in the content must be wrapped like <span id="0"><h2>…</h2></span>.',
  },
  { name: 'extra.sidebar_title', label: 'Sidebar title (e.g. Services / الخدمات)', kind: 'text' },
  { name: 'extra.contact_box', label: 'Contact box (title, text, button)', kind: 'json' },
];

export const ITEM_TYPES: ItemTypeDef[] = [
  {
    type: 'bariatric',
    label: 'Bariatric surgeries',
    labelAr: 'جراحات السمنة',
    detailPath: '/bariatricsurgeryDetail',
    listPath: { ar: '/bariatricsurgeries/جراحات السمنة', en: '/bariatricsurgeries/Bariatric Surgeries' },
    hasSeo: true,
    slugInUrl: true,
    group: 'services',
    fields: [
      ...detailFields,
      { name: 'featured', label: 'Show in the home page slider', kind: 'boolean' },
      { name: 'extra.home_order', label: 'Order in the home slider', kind: 'number' },
    ],
  },
  {
    type: 'general',
    label: 'General surgeries',
    labelAr: 'جراحات عامة',
    detailPath: '/GeneralSurgeryDetail',
    listPath: { ar: '/generalsurgeries/جراحات عامة', en: '/generalsurgeries/General Surgeries' },
    hasSeo: true,
    slugInUrl: true,
    group: 'services',
    fields: detailFields,
  },
  {
    type: 'story',
    label: 'Success stories',
    labelAr: 'قصص نجاح',
    detailPath: '/SuccessStoryDetail',
    listPath: { ar: '/successstories', en: '/successstories' },
    hasSeo: true,
    slugInUrl: true,
    group: 'articles',
    fields: detailFields.filter((f) => f.name !== 'excerpt'),
  },
  {
    type: 'tip',
    label: 'Surgery tips',
    labelAr: 'نصائح العمليات',
    detailPath: '/SurgeryTipDetail',
    listPath: { ar: '/surgerytips', en: '/surgerytips' },
    hasSeo: true,
    slugInUrl: true,
    group: 'articles',
    fields: detailFields.filter((f) => f.name !== 'excerpt'),
  },
  {
    type: 'faq',
    label: 'FAQs',
    labelAr: 'أسئلة وأجوبة',
    detailPath: '/FAQDetail',
    listPath: { ar: '/faqs', en: '/faqs' },
    hasSeo: true,
    slugInUrl: true,
    group: 'articles',
    fields: [
      { name: 'title', label: 'Question', kind: 'text' },
      { name: 'body_html', label: 'Answer', kind: 'html' },
    ],
  },
  {
    type: 'video',
    label: 'Videos',
    labelAr: 'الفيديوهات',
    listPath: { ar: '/videos', en: '/videos' },
    hasSeo: false,
    slugInUrl: false,
    group: 'media',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'link', label: 'YouTube embed link', kind: 'url', help: 'e.g. https://www.youtube.com/embed/VIDEO_ID' },
      { name: 'image', label: 'Thumbnail', kind: 'image', help: 'Leave empty to use the YouTube thumbnail.' },
    ],
  },
  {
    type: 'gallery',
    label: 'Photo gallery',
    labelAr: 'معرض الصور',
    listPath: { ar: '/gallery', en: '/gallery' },
    hasSeo: false,
    slugInUrl: false,
    group: 'media',
    fields: [
      { name: 'image', label: 'Photo', kind: 'image' },
      { name: 'image_alt', label: 'Alt text', kind: 'text' },
      { name: 'title', label: 'Caption', kind: 'text' },
    ],
  },
  {
    type: 'testimonial',
    label: 'Testimonials',
    labelAr: 'التعليقات',
    listPath: { ar: '/testimonials', en: '/testimonials' },
    hasSeo: false,
    slugInUrl: false,
    group: 'other',
    fields: [
      { name: 'title', label: 'Name', kind: 'text' },
      { name: 'body_html', label: 'Comment', kind: 'textarea' },
    ],
  },
  {
    type: 'team',
    label: 'Medical team (About us)',
    labelAr: 'الفريق الطبي',
    hasSeo: false,
    slugInUrl: false,
    group: 'about',
    fields: [
      { name: 'title', label: 'Name', kind: 'text' },
      { name: 'excerpt', label: 'Position', kind: 'text' },
      { name: 'image', label: 'Photo', kind: 'image' },
      { name: 'body_html', label: 'Text', kind: 'textarea' },
    ],
  },
  {
    type: 'why_us',
    label: 'Why choose us (About us)',
    labelAr: 'لماذا نحن',
    hasSeo: false,
    slugInUrl: false,
    group: 'about',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'image', label: 'Icon', kind: 'image' },
      { name: 'image_alt', label: 'Icon alt text', kind: 'text' },
    ],
  },
  {
    type: 'news',
    label: 'News & events (Home)',
    labelAr: 'الأخبار والأحداث',
    hasSeo: false,
    slugInUrl: false,
    group: 'home',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'extra.date_text', label: 'Date (as shown)', kind: 'text', help: 'e.g. 01 Jan 2018' },
      { name: 'excerpt', label: 'Text', kind: 'textarea' },
    ],
  },
  {
    type: 'home_skill',
    label: 'Clinic numbers bars (Home)',
    labelAr: 'أرقام المركز',
    hasSeo: false,
    slugInUrl: false,
    group: 'home',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'extra.width', label: 'Bar value', kind: 'text', help: 'e.g. 100%' },
    ],
  },
  {
    type: 'home_card',
    label: 'Link cards (Home)',
    labelAr: 'روابط الصفحة الرئيسية',
    hasSeo: false,
    slugInUrl: false,
    group: 'home',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'excerpt', label: 'Text', kind: 'textarea' },
      { name: 'image', label: 'Image', kind: 'image' },
      { name: 'image_alt', label: 'Image alt text', kind: 'text' },
      { name: 'link', label: 'Link', kind: 'text' },
      { name: 'extra.image_link', label: 'Image link (if different)', kind: 'text' },
      { name: 'extra.category', label: 'Small label above the title', kind: 'text' },
      { name: 'extra.overlay', label: 'Image darkness (0-9)', kind: 'text' },
    ],
  },
];

export const ITEM_TYPE_MAP: Record<string, ItemTypeDef> = Object.fromEntries(ITEM_TYPES.map((t) => [t.type, t]));

/** Public detail routes (lower-cased first path segment) → item type */
export const DETAIL_ROUTE_TYPES: Record<string, string> = {
  bariatricsurgerydetail: 'bariatric',
  generalsurgerydetail: 'general',
  successstorydetail: 'story',
  surgerytipdetail: 'tip',
  faqdetail: 'faq',
};

export interface PageDef {
  key: string;
  label: string;
  /** public url (per language when it differs) */
  path: { ar: string; en: string };
  fields: FieldDef[];
}

const formFields: FieldDef = {
  name: 'form',
  label: 'Contact form texts',
  kind: 'json',
};

export const PAGES: PageDef[] = [
  {
    key: 'home',
    label: 'Home page',
    path: { ar: '/', en: '/?clang=2' },
    fields: [
      { name: 'hero_image', label: 'Banner image', kind: 'image' },
      { name: 'hero_alt', label: 'Banner image alt', kind: 'text' },
      { name: 'hero_title', label: 'Banner title', kind: 'text' },
      { name: 'hero_words', label: 'Banner rotating words', kind: 'list' },
      { name: 'hero_email_label', label: 'Banner "E-mail" label', kind: 'text' },
      { name: 'hero_phone_label', label: 'Banner "Phone" label', kind: 'text' },
      { name: 'hero_phone', label: 'Banner phone', kind: 'text' },
      { name: 'scroll_text', label: 'Scroll button text', kind: 'text' },
      { name: 'welcome_title_html', label: 'Welcome title (HTML)', kind: 'textarea' },
      { name: 'welcome_text', label: 'Welcome text', kind: 'textarea' },
      { name: 'welcome_images', label: 'Welcome images (2)', kind: 'list' },
      { name: 'numbers_title', label: '"In numbers" title', kind: 'text' },
      { name: 'numbers_text', label: '"In numbers" text', kind: 'textarea' },
      { name: 'numbers_button', label: '"In numbers" button', kind: 'json' },
      { name: 'news_title', label: 'News title', kind: 'text' },
      { name: 'news_text', label: 'News text', kind: 'textarea' },
      { name: 'news_button', label: 'News button', kind: 'json' },
      { name: 'contact_title', label: 'Contact section title', kind: 'text' },
      { name: 'contact_text', label: 'Contact section text', kind: 'textarea' },
      formFields,
    ],
  },
  {
    key: 'aboutus',
    label: 'About us',
    path: { ar: '/aboutus', en: '/aboutus' },
    fields: [
      { name: 'top_image', label: 'Top image', kind: 'image' },
      { name: 'top_image_alt', label: 'Top image alt', kind: 'text' },
      { name: 'top_title', label: 'Top title', kind: 'text' },
      { name: 'top_text', label: 'Top text', kind: 'textarea' },
      { name: 'sections', label: 'Sections (title + content)', kind: 'json', itemFields: [
        { name: 'title', label: 'Title', kind: 'text' },
        { name: 'html', label: 'Content', kind: 'html' },
      ] },
      { name: 'after_sections_html', label: 'Extra HTML after the sections', kind: 'html' },
      { name: 'team_label', label: 'Team small label', kind: 'text' },
      { name: 'team_title', label: 'Team title', kind: 'text' },
      { name: 'team_text', label: 'Team text', kind: 'textarea' },
      { name: 'why_label', label: '"Why us" small label', kind: 'text' },
      { name: 'why_title', label: '"Why us" title', kind: 'text' },
      { name: 'why_right_title', label: '"Why us" right title', kind: 'text' },
      { name: 'why_right_html', label: '"Why us" right text', kind: 'html' },
      { name: 'experience_number', label: 'Years of experience', kind: 'text' },
      { name: 'experience_label_html', label: 'Experience label (HTML)', kind: 'text' },
    ],
  },
  { key: 'cv', label: 'Dr. Ahmed El Masry CV', path: { ar: '/cv', en: '/cv' }, fields: [{ name: 'body_html', label: 'Content', kind: 'html' }] },
  { key: 'privacypolicy', label: 'Privacy policy', path: { ar: '/privacypolicy', en: '/privacypolicy' }, fields: [{ name: 'body_html', label: 'Content', kind: 'html' }] },
  {
    key: 'contactus',
    label: 'Contact us',
    path: { ar: '/contactus', en: '/contactus' },
    fields: [
      { name: 'form_title', label: 'Form title', kind: 'text' },
      { name: 'ph_name', label: 'Name placeholder', kind: 'text' },
      { name: 'ph_email', label: 'E-mail placeholder', kind: 'text' },
      { name: 'ph_phone', label: 'Phone placeholder', kind: 'text' },
      { name: 'ph_message', label: 'Message placeholder', kind: 'text' },
      { name: 'submit', label: 'Submit button', kind: 'text' },
      { name: 'messages', label: 'Validation messages', kind: 'json' },
      { name: 'info_titles', label: 'Info box titles', kind: 'list' },
      { name: 'addresses', label: 'Addresses', kind: 'json', itemFields: [
        { name: 'text', label: 'Address', kind: 'text' },
        { name: 'map', label: 'Google maps link', kind: 'url' },
      ] },
    ],
  },
  {
    key: 'book_nutrition',
    label: 'Nutrition book page',
    path: { ar: '/download_free_book_nutrition_after_bariatric_surgeries_ar', en: '/download_free_book_nutrition_after_bariatric_surgeries_en' },
    fields: [
      { name: 'body_html', label: 'Content', kind: 'html' },
      { name: 'sidebar_title', label: 'Sidebar title', kind: 'text' },
      { name: 'pdf', label: 'PDF file', kind: 'file' },
      { name: 'pdf_label', label: 'Download button text', kind: 'text' },
      { name: 'button_text', label: 'Button hover text', kind: 'text' },
    ],
  },
  {
    key: 'book_ramadan',
    label: 'Together in Ramadan page',
    path: { ar: '/download_free_book_nutrition_for_ramadan_surgeries_ar', en: '/download_free_book_nutrition_for_ramadan_surgeries_en' },
    fields: [
      { name: 'body_html', label: 'Content', kind: 'html' },
      { name: 'sidebar_title', label: 'Sidebar title', kind: 'text' },
      { name: 'pdf', label: 'PDF file', kind: 'file' },
      { name: 'pdf_label', label: 'Download button text', kind: 'text' },
      { name: 'button_text', label: 'Button hover text', kind: 'text' },
    ],
  },
  { key: 'taketour', label: 'Take a tour (360°)', path: { ar: '/TakeTour', en: '/TakeTour' }, fields: [{ name: 'iframe_src', label: '360° tour link', kind: 'url' }] },
  { key: 'bariatricsurgeries', label: 'Bariatric surgeries list', path: { ar: '/bariatricsurgeries/جراحات السمنة', en: '/bariatricsurgeries/Bariatric Surgeries' }, fields: [] },
  { key: 'generalsurgeries', label: 'General surgeries list', path: { ar: '/generalsurgeries/جراحات عامة', en: '/generalsurgeries/General Surgeries' }, fields: [] },
  { key: 'successstories', label: 'Success stories list', path: { ar: '/successstories', en: '/successstories' }, fields: [] },
  { key: 'surgerytips', label: 'Surgery tips list', path: { ar: '/surgerytips', en: '/surgerytips' }, fields: [] },
  { key: 'faqs', label: 'FAQs list', path: { ar: '/faqs', en: '/faqs' }, fields: [] },
  { key: 'videos', label: 'Videos list', path: { ar: '/videos', en: '/videos' }, fields: [] },
  { key: 'gallery', label: 'Gallery', path: { ar: '/gallery', en: '/gallery' }, fields: [] },
  { key: 'testimonials', label: 'Testimonials list', path: { ar: '/testimonials', en: '/testimonials' }, fields: [] },
  { key: 'notfound', label: '"Not found" page', path: { ar: '/ItemNotFound', en: '/ItemNotFound' }, fields: [{ name: 'text', label: 'Text', kind: 'text' }] },
];

export const PAGE_MAP: Record<string, PageDef> = Object.fromEntries(PAGES.map((p) => [p.key, p]));

export const SEO_FIELDS: FieldDef[] = [
  { name: 'title', label: 'Page title (<title>)', kind: 'text' },
  { name: 'description', label: 'Meta description', kind: 'textarea' },
  { name: 'keywords', label: 'Meta keywords', kind: 'textarea' },
  { name: 'og_title', label: 'Social share title (og:title)', kind: 'text' },
  { name: 'og_description', label: 'Social share description', kind: 'textarea' },
  { name: 'og_image', label: 'Social share image', kind: 'image' },
  { name: 'og_type', label: 'og:type', kind: 'text' },
  { name: 'og_site_name', label: 'og:site_name', kind: 'text' },
  { name: 'article_tag', label: 'article:tag', kind: 'textarea' },
  { name: 'canonical', label: 'Canonical URL', kind: 'url' },
  { name: 'schema', label: 'Structured data (JSON-LD)', kind: 'textarea', help: 'Several blocks can be separated with <!--split-->' },
];
