export type Lang = 'ar' | 'en';

export interface Seo {
  title?: string;
  description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  og_site_name?: string;
  og_url?: string;
  article_tag?: string;
  canonical?: string;
  /** one or more JSON-LD blocks, separated by "\n<!--split-->\n" */
  schema?: string;
  hreflang_default?: string;
}

export interface TocEntry {
  id: string;
  text: string;
}

export interface ItemExtra {
  toc?: { title: string; entries: TocEntry[] };
  contact_box?: { title: string; text: string; button: string };
  sidebar_title?: string;
  detail_image_style?: 'plain' | 'w-100' | 'before_after';
  home_order?: number;
  link_title?: string;
  title_raw?: string;
  date_text?: string;
  width?: string;
  overlay?: string;
  category?: string;
  image_link?: string;
  article_class?: string;
  title_class?: string;
  youtube_id?: string;
  fancybox?: string;
  [key: string]: unknown;
}

export interface Item {
  id: string;
  type: string;
  lang: Lang;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  image_alt: string;
  detail_image: string;
  detail_image_alt: string;
  detail_image_title: string;
  body_html: string;
  link: string;
  extra: ItemExtra;
  seo: Seo;
  sort_order: number;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageRow<T = Record<string, unknown>> {
  key: string;
  lang: Lang;
  data: T;
  seo: Seo;
}

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

export interface SocialLink {
  url: string;
  icon?: string;
  label?: string;
}

export interface Address {
  name: string;
  text: string;
  map_menu: string;
  map_footer: string;
  footer_sep?: string;
}

export interface Settings {
  schema_global?: string;
  whatsapp?: { number: string; cta: string; color: string; position: string };
  gtm_id?: string;
  logo_text: string;
  logo_light: string;
  logo_dark: string;
  menu_title: string;
  menu: NavLink[];
  address_title: string;
  addresses: Address[];
  contact_title: string;
  phones: string[];
  email: string;
  follow_title: string;
  menu_socials: SocialLink[];
  toggle: { menu: string; open: string; close: string };
  lang_switch: { label: string; text: string };
  footer_logo_text: string;
  footer_socials: SocialLink[];
  footer_nav_title: string;
  footer_nav: NavLink[];
  footer_contact_title: string;
  footer_address_title: string;
  footer_bottom_html: string;
  side_socials: SocialLink[];
  side_title: string;
  hero_socials: SocialLink[];
  labels?: Record<string, string>;
}
