"""Extract structured content from the crawled site into seed.json.

Usage: python3 -I extract.py <work_dir containing crawl_ar/ and crawl_en/> <out.json>
"""
import sys, os, re, json, hashlib, urllib.parse
from bs4 import BeautifulSoup, NavigableString

ROOT = sys.argv[1]
OUT = sys.argv[2]
HOST = "https://www.doctorahmedelmasry.com"

idx = {l: json.load(open(f"{ROOT}/crawl_{l}/index.json"))["pages"] for l in ("ar", "en")}


def load(lang, path):
    fn = idx[lang].get(path)
    if not fn:
        return None
    return open(f"{ROOT}/crawl_{lang}/{fn}", encoding="utf-8").read()


def soup(html):
    return BeautifulSoup(html, "html.parser")


def inner(el):
    if el is None:
        return ""
    return "".join(str(c) for c in el.contents)


def txt(el):
    return el.get_text(" ", strip=True) if el else ""


def norm_img(src):
    """Turn any image reference into a root-relative path (/ApplicationImages/..)."""
    if not src:
        return ""
    src = src.strip()
    if src.startswith("http") and "doctorahmedelmasry.com" not in src:
        return src
    m = re.search(r"/?(ApplicationImages|assets|Content)/.*", src)
    if m:
        p = m.group(0)
        return p if p.startswith("/") else "/" + p
    return src


def norm_link(href):
    if not href:
        return ""
    href = href.strip()
    if href.startswith(("http://", "https://")) and "doctorahmedelmasry.com" not in href:
        return href
    if href.startswith(("mailto:", "tel:", "#")):
        return href
    u = urllib.parse.urlparse(urllib.parse.urljoin(HOST + "/x/y", href))
    p = urllib.parse.unquote(u.path)
    return p + ("?" + u.query if u.query else "")


def html_lang(html):
    m = re.search(r"<html dir=([a-z]*)", html)
    return "ar" if m and m.group(1) == "rtl" else "en"


def seo(html):
    head = html[: html.find("<body")]
    s = soup(head)
    out = {}
    t = s.find("title")
    out["title"] = t.get_text().strip() if t else ""

    def meta(attr, name):
        # attributes may be unquoted in the source; regex is more robust
        m = re.search(r'<meta\s+%s="%s"\s+content=("([^"]*)"|([^>]*))\s*/?>' % (attr, re.escape(name)), head, re.S)
        if not m:
            return ""
        v = m.group(2) if m.group(2) is not None else m.group(3)
        return v.strip().rstrip("/").strip()

    out["description"] = meta("name", "description")
    out["keywords"] = meta("name", "keywords")
    out["og_title"] = meta("property", "og:title")
    out["og_description"] = meta("property", "og:description")
    out["og_image"] = meta("property", "og:image")
    out["og_type"] = meta("property", "og:type")
    out["og_site_name"] = meta("property", "og:site_name")
    out["og_url"] = meta("property", "og:url")
    out["article_tag"] = meta("property", "article:tag")
    m = re.search(r'<link rel="canonical" href="([^"]*)"', head)
    out["canonical"] = m.group(1) if m else ""
    # page specific JSON-LD (everything except the global organization graph)
    schemas = []
    for sc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', head, re.S):
        schemas.append(sc.strip())
    out["schema"] = "\n<!--split-->\n".join(schemas)
    m = re.search(r'<link rel="alternate" hreflang="x-default" href="([^"]*)"', head)
    out["hreflang_default"] = m.group(1) if m else ""
    return {k: v for k, v in out.items() if v}


def global_schema(html):
    head = html[: html.find("<body")]
    for sc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', head, re.S):
        if '"MedicalOrganization"' in sc and '"@type": "WebSite"' in sc:
            return sc.strip()
    return ""


def page_header(html):
    """The title banner shown above the content on inner pages."""
    m = re.search(r'</header>\s*(<header class="p-relative pt-header[^"]*">.*?</header>)', html, re.S)
    if not m:
        return None
    h = soup(m.group(1))
    out = {}
    crumb = h.find("p", class_="p2n-heading-title")
    if crumb and crumb.find("a"):
        a = crumb.find("a")
        out["crumb_label"] = a.get_text().strip()
        out["crumb_href"] = norm_link(a.get("href", ""))
    h1 = h.find("h1")
    out["title"] = h1.get_text() if h1 else ""
    p = h.find("p", class_="max-w750")
    if p is not None:
        out["text_html"] = inner(p).strip()
        out["has_text"] = True
    out["has_br"] = h.find("br", recursive=True) is not None and (p is None or h.find("div", class_="hero-content").find("br", recursive=False) is not None)
    return out


def wrapper(html):
    a = html.find('<div id="page_wrapper"')
    b = html.find("<!-- ========== Footer")
    return soup(html[a:b])


items = []
pages = []
seen_items = {}


def add_item(it):
    key = (it["type"], it["slug"])
    if key in seen_items:
        # merge (listing info + detail info)
        seen_items[key].update({k: v for k, v in it.items() if v not in (None, "", [], {})})
        return seen_items[key]
    seen_items[key] = it
    items.append(it)
    return it


# ---------------------------------------------------------------- settings
def settings_for(lang):
    html = load(lang, "/")
    s = soup(html)
    st = {}
    st["schema_global"] = global_schema(html)
    m = re.search(r'whatsapp: "([^"]*)".*?call_to_action: "([^"]*)".*?button_color: "([^"]*)".*?position: "([^"]*)"', html, re.S)
    if m:
        st["whatsapp"] = {"number": m.group(1), "cta": m.group(2), "color": m.group(3), "position": m.group(4)}
    m = re.search(r"'GTM-[A-Z0-9]+'", html)
    st["gtm_id"] = m.group(0).strip("'") if m else ""
    hdr = s.find("header", id="site_menu_header")
    st["logo_text"] = hdr.find("a", class_="custom-logo-link")["data-dsn-text"]
    st["logo_light"] = norm_img(hdr.find("img", class_="logo-light")["src"])
    st["logo_dark"] = norm_img(hdr.find("img", class_="logo-dark")["src"])
    st["menu_title"] = txt(hdr.find(class_="menu-cover-title"))
    # menu
    menu = []
    for li in hdr.find("ul", id="dsn-primary-list").find_all("li", recursive=False):
        a = li.find("a", recursive=False)
        entry = {"label": txt(a), "href": norm_link(a["href"]) if a["href"] != "#0" else ""}
        sub = li.find("ul", recursive=False)
        if sub:
            entry["children"] = [
                {"label": txt(x.find("a")), "href": norm_link(x.find("a")["href"])}
                for x in sub.find_all("li", class_="nav-item", recursive=False)
            ]
        menu.append(entry)
    st["menu"] = menu
    info = hdr.find(class_="nav__info")
    blocks = info.find_all(class_="nav-content")
    st["address_title"] = txt(blocks[0].find("h5"))
    st["addresses"] = []
    for p in blocks[0].find_all("p"):
        a = p.find("a")
        strong = a.find("strong")
        name = txt(strong)
        rest = a.get_text().replace(strong.get_text(), "", 1)
        rest = re.sub(r"^\s*:\s*", "", rest).strip()
        st["addresses"].append({"name": name, "text": rest, "map_menu": a["href"]})
    st["contact_title"] = txt(blocks[1].find("h5"))
    st["phones"] = [a.get_text().strip() for a in blocks[1].find_all("a", href=re.compile("^tel:"))]
    st["email"] = blocks[1].find("a", href=re.compile("^mailto:"))["href"][7:]
    soc = hdr.find(class_="nav-social")
    st["follow_title"] = txt(soc.find("h5"))
    st["menu_socials"] = [{"label": a.get_text().strip(), "url": a["href"]} for a in soc.find_all("a")]
    tog = hdr.find(class_="toggle-text")
    st["toggle"] = {k: txt(tog.find(class_="text-" + k)) for k in ("menu", "open", "close")}
    lang_a = hdr.find(class_="main-lang").find("a")
    st["lang_switch"] = {"label": lang_a.get_text().strip(), "text": lang_a.get("data-dsn-text", "")}
    # footer
    foot = s.find("footer", id="dsn_footer")
    st["footer_logo_text"] = foot.find("a", class_="custom-logo-link")["data-dsn-text"]
    st["footer_socials"] = []
    for a in foot.find("ul", class_="dsn-socials").find_all("a"):
        st["footer_socials"].append({"url": a["href"], "icon": " ".join(a.find("i")["class"]), "label": a.find_all("span")[-1].get_text()})
    cols = foot.find_all(class_=re.compile(r"^grid-col-"))
    st["footer_nav_title"] = txt(cols[1].find("h4"))
    st["footer_nav"] = [{"label": a.get_text().strip(), "href": norm_link(a["href"])} for a in cols[1].find_all("a")]
    st["footer_contact_title"] = txt(cols[2].find("h4"))
    st["footer_address_title"] = txt(cols[3].find("h4"))
    for i, p in enumerate(cols[3].find_all("p")):
        if i < len(st["addresses"]):
            st["addresses"][i]["map_footer"] = p.find("a")["href"]
            st["addresses"][i]["footer_sep"] = ":" if ":" in p.get_text() else ""
    bottom = foot.find(class_="footer-bottom")
    st["footer_bottom_html"] = inner(bottom.find("p")).strip()
    # side socials
    side = s.find(class_="social-side")
    st["side_socials"] = [
        {"url": a["href"], "icon": " ".join(a.find("i")["class"]), "label": a.find("span").get_text()}
        for a in side.find_all("a")
    ]
    st["side_title"] = txt(side.find(class_="icon"))
    # hero socials (home header)
    hero = s.find("header", id="dsn_header")
    st["hero_socials"] = [{"url": a["href"], "icon": " ".join(a.find("i")["class"])} for a in hero.find_all("a", class_="dsn-icon")]
    # labels used in templates
    lab = {}
    lab["services_box"] = ""
    st["labels"] = lab
    return st


settings = {l: settings_for(l) for l in ("ar", "en")}


# ---------------------------------------------------------------- generic helpers for detail pages
def sidebar_title(w):
    box = w.find(class_="box-info")
    if box:
        h = box.find("h4", class_="service_title")
        return txt(h)
    return ""


def contact_box(w):
    b = w.find(class_="box-04")
    if not b:
        return None
    return {
        "title": txt(b.find("h5")),
        "text": txt(b.find("p")),
        "button": txt(b.find(class_="title-btn")),
    }


def extract_toc(tc):
    """Remove the generated table of contents from body and return entries."""
    toc = None
    art = tc.find("div", class_="article-content")
    if art:
        toc = {"title": txt(art.find("h5")), "entries": []}
        for a in art.find_all("a", class_="art-link"):
            m = re.search(r"scrollToElement\('([^']*)'\)", a.get("onclick", ""))
            toc["entries"].append({"id": m.group(1) if m else "", "text": a.get_text()})
        art.decompose()
    return toc


def detail_body(tc):
    """text-content div: '<p> [toc] <div>&nbsp;</div> BODY </p>'"""
    toc = extract_toc(tc)
    # unwrap the outer <p> the template adds
    kids = [c for c in tc.contents if not (isinstance(c, NavigableString) and not c.strip())]
    if len(kids) == 1 and getattr(kids[0], "name", None) == "p":
        body = inner(kids[0])
        wrapped_p = True
    else:
        body = inner(tc)
        wrapped_p = False
    body = body.strip()
    if toc is not None:
        # drop the spacer the template adds right after the toc
        body = re.sub(r"^<div>(&nbsp;|\xa0)</div>\s*", "", body)
    return body, toc, wrapped_p


DETAIL_ROUTES = {
    "bariatricsurgerydetail": "bariatric",
    "generalsurgerydetail": "general",
    "successstorydetail": "story",
    "surgerytipdetail": "tip",
    "faqdetail": "faq",
}


def parse_detail(lang_session, path):
    html = load(lang_session, path)
    if html is None:
        return None
    if 'لا توجد هذة البيانات</h1>' in html or "This item can&#39;t be found</h1>" in html:
        return None
    if 'text-content' not in html:
        print('SKIP (no text-content):', lang_session, path)
        return None
    seg, slug = path.split("/", 2)[1:]
    typ = DETAIL_ROUTES[seg.lower()]
    w = wrapper(html)
    if w.find("h1") and len(w.get_text(strip=True)) < 40:
        return None
    it = {"type": typ, "lang": html_lang(html), "slug": slug, "seo": seo(html)}
    ph = page_header(html)
    pc = w.find(class_="post-content")
    if typ == "faq":
        tc = w.find(class_="text-content")
        body, toc, wrapped = detail_body(tc)
        # FAQ template: <p class="mt-50"> BODY </p>
        it["body_html"] = body
        it["extra"] = {}
    else:
        first = pc.find(["img", "div"], recursive=False)
        if first is not None and first.name == "div" and "before_after" in first.get("class", []):
            img = first.find("img")
            it["extra"] = {"detail_image_style": "before_after"}
        else:
            img = first if first is not None and first.name == "img" else pc.find("img")
            it["extra"] = {"detail_image_style": "w-100" if img is not None and "w-100" in (img.get("class") or []) else "plain"}
        if img is not None:
            it["detail_image"] = norm_img(img.get("src"))
            it["detail_image_alt"] = img.get("alt", "")
            it["detail_image_title"] = img.get("title", "")
        tc = w.find(class_="text-content")
        body, toc, wrapped = detail_body(tc)
        it["body_html"] = body
        if toc:
            it["extra"]["toc"] = toc
        cb = contact_box(w)
        if cb:
            it["extra"]["contact_box"] = cb
        it["extra"]["sidebar_title"] = sidebar_title(w)
    if ph:
        it["extra"]["page_header"] = ph
    return it


# ---------------------------------------------------------------- listings
def listing_services(lang, path, typ):
    html = load(lang, path)
    w = wrapper(html)
    out = []
    for i, sl in enumerate(w.select(".service-item")):
        a = sl.find("a")
        href = norm_link(a["href"])
        slug = href.split("/", 2)[2]
        img = sl.find("img")
        it = add_item({
            "type": typ, "lang": lang, "slug": slug,
            "title": txt(sl.find("h4")) if sl.find("h4") else a.get("title", "").strip(),
            "title_raw": sl.find("h4").get_text() if sl.find("h4") else "",
            "link_title": a.get("title", ""),
            "image": norm_img(img["src"]) if img else "",
            "image_alt": img.get("alt", "") if img else "",
            "excerpt": sl.find(class_="service_description").find("p").get_text(),
            "sort_order": i,
        })
        out.append(it)
    return out, seo(html)


def listing_cards(lang, path, typ):
    """success stories / surgery tips listing"""
    html = load(lang, path)
    w = wrapper(html)
    for i, art in enumerate(w.select("article.dsn-item-post")):
        a = art.find("a", href=True)
        href = norm_link(a["href"])
        slug = href.split("/", 2)[2]
        img = art.find("img")
        title_el = art.find(["h5", "h3"])
        add_item({
            "type": typ, "lang": lang, "slug": slug,
            "title": txt(title_el),
            "image": norm_img(img["src"]) if img else "",
            "image_alt": img.get("alt", "") if img else "",
            "sort_order": i,
        })
    return seo(html)


def listing_faq(lang):
    html = load(lang, "/faqs")
    w = wrapper(html)
    for i, art in enumerate(w.select("article.blog-item")):
        a = art.find("a")
        slug = norm_link(a["href"]).split("/", 2)[2]
        add_item({"type": "faq", "lang": lang, "slug": slug, "title": a.find("h4").get_text().strip(),
                  "sort_order": i, "extra": {"rel": a.get("rel", [""])[0] if isinstance(a.get("rel"), list) else a.get("rel", "")}})
    return seo(html)


def listing_videos(lang):
    html = load(lang, "/videos")
    w = wrapper(html)
    for i, art in enumerate(w.select("article")):
        a = art.find("a", class_="vid")
        img = art.find("img")
        url = a["href"]
        m = re.search(r"embed/([A-Za-z0-9_-]+)", url)
        add_item({"type": "video", "lang": lang, "slug": f"{lang}-video-{i+1}",
                  "title": art.find("p").get_text().strip(), "link": url,
                  "image": img["src"], "sort_order": i,
                  "extra": {"youtube_id": m.group(1) if m else ""}})
    return seo(html)


def listing_gallery(lang):
    html = load(lang, "/gallery")
    w = wrapper(html)
    for i, d in enumerate(w.select(".grid-item.has-popup")):
        pop = d.find(class_="effect-popup")
        img = d.find("img")
        add_item({"type": "gallery", "lang": lang, "slug": f"{lang}-photo-{i+1}",
                  "title": pop.get("data-caption", ""), "image": norm_img(img["src"]),
                  "image_alt": img.get("alt", ""), "sort_order": i,
                  "extra": {"fancybox": pop.get("data-fancybox", "")}})
    return seo(html)


def listing_testimonials(lang):
    html = load(lang, "/testimonials")
    w = wrapper(html)
    for i, d in enumerate(w.select(".testimonial-inner-item")):
        p = d.find("p")
        add_item({"type": "testimonial", "lang": lang, "slug": f"{lang}-testimonial-{i+1}",
                  "title": d.find("h4").get_text().strip(),
                  "body_html": inner(p).strip(), "sort_order": i})
    return seo(html)


# ---------------------------------------------------------------- static pages
def page_home(lang):
    html = load(lang, "/")
    s = soup(html)
    hero = s.find("header", id="dsn_header")
    d = {}
    img = hero.find(id="hero_image").find("img")
    d["hero_image"] = norm_img(img["src"])
    d["hero_alt"] = img.get("alt", "")
    h1 = hero.find("h1")
    d["hero_title"] = h1.find("div").get_text()
    d["hero_words"] = [b.get_text() for b in h1.find_all("b")]
    fl = hero.find(class_="footer-head")
    lis = fl.find_all("li")
    d["hero_email_label"] = txt(lis[0].find("strong"))
    d["hero_phone_label"] = txt(lis[1].find("strong"))
    d["hero_phone"] = lis[1].find("a").get_text().strip()
    d["scroll_text"] = txt(hero.find(class_="dsn-scroll-bottom"))
    w = wrapper(html)
    ab = w.find(class_="about-section")
    d["welcome_title_html"] = inner(ab.find("h2")).strip()
    d["welcome_text"] = ab.find("p").get_text()
    d["welcome_images"] = [norm_img(i["src"]) if i["src"].startswith(("/", "http", "..")) else i["src"] for i in ab.find_all("img")]
    # services slider -> featured bariatric items
    for i, sl in enumerate(w.select(".dsn-service .swiper-slide")):
        href = norm_link(sl.find("a")["href"])
        d.setdefault("featured_services", []).append(href.split("/", 2)[2])
    sections = w.find_all(class_="pinned-scroll")
    # numbers
    sk = sections[0]
    d["numbers_title"] = inner(sk.find("h2")).strip()
    d["numbers_text"] = sk.find("p").get_text()
    btn = sk.find("a", class_="dsn-btn")
    d["numbers_button"] = {"label": txt(btn.find(class_="title-btn")), "href": norm_link(btn["href"]), "text": btn.get("data-dsn-text", "")}
    for i, it in enumerate(w.select(".dsn-skills-item")):
        add_item({"type": "home_skill", "lang": lang, "slug": f"{lang}-skill-{i+1}", "title": it.find("h6").get_text(),
                  "sort_order": i, "extra": {"width": it.find(class_="fill")["data-dsn-width"]}})
    nw = sections[1]
    d["news_title"] = inner(nw.find("h2")).strip()
    d["news_text"] = nw.find("p").get_text()
    btn = nw.find("a", class_="dsn-btn")
    d["news_button"] = {"label": txt(btn.find(class_="title-btn")), "href": norm_link(btn["href"]), "text": btn.get("data-dsn-text", "")}
    for i, it in enumerate(w.select(".resume-item")):
        desc = it.find(class_="resume-description").find("p").get_text()
        add_item({"type": "news", "lang": lang, "slug": f"{lang}-news-{i+1}", "title": it.find("h5").get_text(),
                  "excerpt": desc, "sort_order": i, "extra": {"date_text": it.find("h6").get_text()}})
    for i, art in enumerate(w.select(".v-dark-head .box-image-transform article")):
        a = art.find("a", class_="box-image-link")
        img = art.find("img")
        cat = art.find(class_="dsn-category")
        h2 = art.find("h2")
        title_a = h2.find("a")
        add_item({"type": "home_card", "lang": lang, "slug": f"{lang}-card-{i+1}", "title": title_a.get_text(),
                  "image": norm_img(img["src"]), "image_alt": img.get("alt", ""),
                  "link": norm_link(title_a["href"]),
                  "excerpt": art.find("p", class_="section_description").get_text(),
                  "sort_order": i,
                  "extra": {"image_link": a["href"] if not a["href"].startswith("../") else norm_link(a["href"]),
                            "overlay": art.find(class_="box-image-bg").get("data-overlay", "2"),
                            "category": cat.find("span").get_text() if cat else "",
                            "article_class": " ".join(c for c in art["class"] if c in ("production", "photography")),
                            "title_class": " ".join(c for c in h2["class"] if c not in ("post-title", "title-block"))}})
    ct = sections[2]
    d["contact_title"] = inner(ct.find("h2")).strip()
    d["contact_text"] = ct.find("p").get_text()
    return d


def contact_form_labels(lang, w):
    f = w.find("form", id="contact-form")
    box = f.find_parent(class_="box-right") or f.find_parent(class_="box-form")
    lab = {}
    h = box.find("h2") if box else None
    lab["form_title"] = txt(h)
    for k in ("name", "email", "phone"):
        lab["ph_" + k] = f.find("input", attrs={"name": k})["placeholder"]
    lab["ph_message"] = f.find("textarea")["placeholder"]
    lab["submit"] = f.find("input", type="submit")["value"]
    html = str(w)
    m = re.search(r"messages: \{(.*?)\n\s*\}\n", html, re.S)
    msgs = {}
    for k in ("name", "email", "phone", "message"):
        mm = re.search(k + r':\s*\{\s*required:\s*"([^"]*)"', html)
        msgs[k] = mm.group(1) if mm else ""
    lab["messages"] = msgs
    return lab


def page_about(lang):
    html = load(lang, "/aboutus")
    w = wrapper(html)
    d = {}
    top = w.find(class_="box-under-bottom-img")
    img = top.find("img")
    d["top_image"] = norm_img(img["src"])
    d["top_image_alt"] = img.get("alt", "")
    d["top_title"] = top.find("h2").get_text()
    d["top_text"] = inner(top.find("p")).strip()
    col2 = w.find(class_="grid-col-2")
    d["sections"] = []
    for h in col2.find_all("h4", recursive=False):
        body = h.find_next_sibling("div")
        d["sections"].append({"title": h.get_text(), "html": inner(body)})
    # trailing elements after the last text-content (e.g. youtube iframe)
    tail = []
    last = col2.find_all("div", class_="text-content", recursive=False)[-1]
    for sib in last.next_siblings:
        tail.append(str(sib))
    d["after_sections_html"] = "".join(tail).strip()
    team = w.find(class_="sub-section-title")
    d["team_label"] = team.find("p").get_text()
    d["team_title"] = team.find("h2").get_text()
    ps = team.find_all("p")
    d["team_text"] = ps[1].get_text() if len(ps) > 1 else ""
    for i, sl in enumerate(w.select(".dsn-testimonials .swiper-slide")):
        img = sl.find("img")
        add_item({"type": "team", "lang": lang, "slug": f"{lang}-team-{i+1}", "title": sl.find("h4").get_text(),
                  "image": norm_img(img["src"]), "excerpt": sl.find("h5").get_text(),
                  "body_html": sl.find("p").get_text().strip(), "sort_order": i})
    why = w.find(class_="about-3")
    sub = why.find(class_="sub-section-title")
    d["why_label"] = sub.find("p").get_text()
    d["why_title"] = sub.find("h3").get_text()
    for i, it in enumerate(why.select(".accordion__item")):
        img = it.find("img")
        add_item({"type": "why_us", "lang": lang, "slug": f"{lang}-why-{i+1}", "title": it.find("p").get_text(),
                  "image": norm_img(img["src"]), "image_alt": img.get("alt", ""), "sort_order": i})
    right = why.find(class_="box-right")
    d["why_right_title"] = right.find("h4").get_text()
    exp = right.find(class_="experience")
    d["experience_number"] = exp.find(class_="animate-number").get_text()
    d["experience_label_html"] = inner(exp.find("h5")).strip()
    exp_html = str(exp)
    rh = inner(right)
    rh = rh.split(str(right.find("h4")), 1)[1]
    rh = rh.split(exp_html)[0] if exp_html in rh else re.split(r'<div class="experience', rh)[0]
    d["why_right_html"] = rh.strip()
    return d, seo(html)


def page_simple_body(lang, path):
    """cv / privacy policy: wrapper > ... > .text-content BODY"""
    html = load(lang, path)
    w = wrapper(html)
    tc = w.find(class_="text-content")
    return {"body_html": inner(tc).strip()}, seo(html)


def page_contact(lang):
    html = load(lang, "/contactus")
    w = wrapper(html)
    d = contact_form_labels(lang, w)
    info = w.find(class_="box-info")
    d["info_titles"] = [h.get_text() for h in info.find_all("h4")]
    d["addresses"] = [{"text": p.find("a").get_text().strip(), "map": p.find("a")["href"]} for p in info.find_all("div", class_="service_description")[:2]]
    return d, seo(html)


def page_book(lang_session, path):
    html = load(lang_session, path)
    if html is None:
        return None, None, None
    w = wrapper(html)
    tc = w.find(class_="text-content")
    kids = [c for c in tc.contents if not (isinstance(c, NavigableString) and not c.strip())]
    body = inner(kids[0]) if len(kids) == 1 and getattr(kids[0], "name", "") == "p" else inner(tc)
    btn = w.find("a", class_="dsn-btn")
    inner_a = btn.find("span", class_="title-btn").find("a")
    d = {"body_html": body.strip(), "sidebar_title": sidebar_title(w),
         "button_text": btn.get("data-dsn-text", ""), "button_href_outer": btn.get("href", ""),
         "pdf": norm_img(inner_a["href"]), "pdf_label": inner_a.get_text(), "pdf_title": inner_a.get("title", ""),
         "pdf_hreflang": inner_a.get("hreflang", "")}
    return d, seo(html), html_lang(html)


def page_taketour(lang):
    html = load(lang, "/TakeTour")
    w = wrapper(html)
    return {"iframe_src": w.find("iframe")["src"]}, seo(html)


def page_list_seo(lang, path):
    html = load(lang, path)
    return seo(html) if html else {}


def listing_heading(lang, path):
    return {}


# ---------------------------------------------------------------- run
LISTS = {
    "ar": {"bariatric": "/bariatricsurgeries/جراحات السمنة", "general": "/generalsurgeries/جراحات عامة"},
    "en": {"bariatric": "/bariatricsurgeries/Bariatric Surgeries", "general": "/generalsurgeries/General Surgeries"},
}

for lang in ("ar", "en"):
    hd = page_home(lang)
    pages.append({"key": "home", "lang": lang, "data": hd, "seo": seo(load(lang, "/"))})
    for typ, path in LISTS[lang].items():
        _, sseo = listing_services(lang, path, typ)
        pages.append({"key": "bariatricsurgeries" if typ == "bariatric" else "generalsurgeries", "lang": lang,
                      "data": {"slug": path.split("/", 2)[2]}, "seo": sseo})
    pages.append({"key": "successstories", "lang": lang, "data": {}, "seo": listing_cards(lang, "/successstories", "story")})
    pages.append({"key": "surgerytips", "lang": lang, "data": {}, "seo": listing_cards(lang, "/surgerytips", "tip")})
    pages.append({"key": "faqs", "lang": lang, "data": {}, "seo": listing_faq(lang)})
    pages.append({"key": "videos", "lang": lang, "data": {}, "seo": listing_videos(lang)})
    pages.append({"key": "gallery", "lang": lang, "data": {}, "seo": listing_gallery(lang)})
    pages.append({"key": "testimonials", "lang": lang, "data": {}, "seo": listing_testimonials(lang)})
    d, s = page_about(lang)
    pages.append({"key": "aboutus", "lang": lang, "data": d, "seo": s})
    for key, path in (("cv", "/cv"), ("privacypolicy", "/privacypolicy")):
        d, s = page_simple_body(lang, path)
        pages.append({"key": key, "lang": lang, "data": d, "seo": s})
    d, s = page_contact(lang)
    pages.append({"key": "contactus", "lang": lang, "data": d, "seo": s})
    d, s = page_taketour(lang)
    pages.append({"key": "taketour", "lang": lang, "data": d, "seo": s})
    pages.append({"key": "notfound", "lang": lang, "data": {"text": wrapper(load(lang, "/ItemNotFound")).find("h1").get_text()},
                  "seo": seo(load(lang, "/ItemNotFound"))})
    # home contact form labels
    hd["form"] = contact_form_labels(lang, wrapper(load(lang, "/")))

# books: language comes from the url suffix
for book in ("nutrition_after_bariatric_surgeries", "nutrition_for_ramadan_surgeries"):
    for suffix in ("ar", "en"):
        path = f"/download_free_book_{book}_{suffix}"
        d = s = None
        for sess in (suffix, "ar", "en"):
            d, s, real = page_book(sess, path)
            if d:
                break
        key = "book_nutrition" if "after" in book else "book_ramadan"
        pages.append({"key": key, "lang": suffix, "data": d, "seo": s})

PAGE_PATHS = {"successstories": "/successstories", "surgerytips": "/surgerytips", "faqs": "/faqs", "videos": "/videos",
              "gallery": "/gallery", "testimonials": "/testimonials", "aboutus": "/aboutus", "cv": "/cv",
              "privacypolicy": "/privacypolicy", "contactus": "/contactus", "taketour": "/TakeTour", "notfound": "/ItemNotFound"}
for pg in pages:
    lang = pg["lang"]
    if pg["key"] in PAGE_PATHS:
        path = PAGE_PATHS[pg["key"]]
    elif pg["key"] in ("bariatricsurgeries", "generalsurgeries"):
        path = LISTS[lang]["bariatric" if pg["key"] == "bariatricsurgeries" else "general"]
    elif pg["key"] == "book_nutrition":
        path = f"/download_free_book_nutrition_after_bariatric_surgeries_{lang}"
    elif pg["key"] == "book_ramadan":
        path = f"/download_free_book_nutrition_for_ramadan_surgeries_{lang}"
    else:
        continue
    html = load(lang, path) or load("en" if lang == "ar" else "ar", path)
    ph = page_header(html) if html else None
    if ph:
        if pg["data"] is None:
            pg["data"] = {}
        pg["data"]["page_header"] = ph

# details (from both sessions; item language comes from the page itself)
for sess in ("ar", "en"):
    for path in idx[sess]:
        parts = path.split("/", 2)
        if len(parts) != 3 or parts[1].lower() not in DETAIL_ROUTES or not parts[2] or "/" in parts[2]:
            continue
        it = parse_detail(sess, path)
        if not it:
            continue
        # match an existing listing entry: same type+slug (case-insensitive, trimmed)
        key = None
        for k in seen_items:
            if k[0] == it["type"] and k[1].strip().lower() == it["slug"].strip().lower():
                key = k
                break
        if key:
            existing = seen_items[key]
            for k2, v in it.items():
                if k2 == "slug":
                    continue
                if k2 == "extra":
                    existing.setdefault("extra", {}).update(v)
                elif v:
                    existing[k2] = v
        else:
            # reachable on the old site but not shown in its lists
            it["unlisted"] = True
            it["title"] = (it.get("extra", {}).get("page_header") or {}).get("title", "") or it["slug"]
            it["sort_order"] = 9999
            add_item(it)

# featured flags
for lang in ("ar", "en"):
    home = next(p for p in pages if p["key"] == "home" and p["lang"] == lang)
    for i, slug in enumerate(home["data"].get("featured_services", [])):
        for it in items:
            if it["type"] == "bariatric" and it["slug"] == slug:
                it["featured"] = True
                it.setdefault("extra", {})["home_order"] = i

# drop the site-wide JSON-LD from per-page schema lists (it is rendered once from settings)
def strip_global(seo_obj, lang):
    if not seo_obj or "schema" not in seo_obj:
        return
    g = settings[lang]["schema_global"].strip()
    parts = [x for x in seo_obj["schema"].split("\n<!--split-->\n")]
    seo_obj["schema"] = "\n<!--split-->\n".join(x for x in parts if x.strip() != g)
    if not seo_obj["schema"]:
        del seo_obj["schema"]
for p_ in pages:
    if p_.get("seo"):
        strip_global(p_["seo"], p_["lang"])
for it in items:
    if it.get("seo"):
        strip_global(it["seo"], it["lang"])

for pg in pages:
    if pg["key"] == "notfound":
        t = "لا توجد هذة البيانات" if pg["lang"] == "ar" else "This item can't be found"
        pg["data"]["text"] = t
        if pg["data"].get("page_header"):
            pg["data"]["page_header"]["title"] = t

json.dump({"settings": settings, "pages": pages, "items": items}, open(OUT, "w"), ensure_ascii=False, indent=1)
from collections import Counter
print("pages", len(pages), "items", len(items))
print(Counter((i["type"], i["lang"]) for i in items))
print("unlisted", Counter((i["type"], i["lang"]) for i in items if i.get("unlisted")))
print("no body", [(i["type"], i["slug"]) for i in items if i["type"] in DETAIL_ROUTES.values() and not i.get("body_html")][:40])
