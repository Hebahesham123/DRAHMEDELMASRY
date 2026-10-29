import sys, os, re, time, html as htmllib, urllib.parse, http.cookiejar, urllib.request, hashlib, json
BASE="https://www.doctorahmedelmasry.com"
lang=sys.argv[1]; out=sys.argv[2]
os.makedirs(out,exist_ok=True)
cj=http.cookiejar.CookieJar()
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders=[("User-Agent","Mozilla/5.0")]
def get(u):
    for i in range(3):
        try:
            r=op.open(u,timeout=40); return r.read(), r.geturl()
        except Exception as e:
            err=e; time.sleep(2)
    print("FAIL",u,err); return None,None
get(BASE+"/?clang="+lang)
seen=set(); queue=["/", "/TakeTour"]; pages={}; assets=set()
# also start from every address listed in the old sitemap
try:
    sm=get(BASE+"/sitemap.xml")[0].decode("utf-8","replace")
    for loc in re.findall(r"<loc>(.*?)</loc>", sm):
        u=urllib.parse.urlparse(htmllib.unescape(loc))
        if "clang" in u.query: continue
        queue.append(urllib.parse.unquote(u.path))
except Exception as e:
    print("sitemap skipped", e)
def norm(href,cur):
    if href.startswith(("mailto:","tel:","javascript:","#")): return None
    u=urllib.parse.urljoin(cur,href)
    p=urllib.parse.urlparse(u)
    if p.netloc not in ("www.doctorahmedelmasry.com","doctorahmedelmasry.com",""): return None
    path=urllib.parse.unquote(p.path)
    q=p.query
    if "clang" in q: return None
    if "doctorahmedelmasry.com" in path: return None
    segs=[x for x in path.split("/") if x]
    isasset=os.path.splitext(path)[1].lower() in (".jpg",".jpeg",".png",".gif",".webp",".svg",".pdf",".css",".js",".mp4",".ico",".woff",".woff2",".ttf",".webm")
    if not isasset and len(segs)>2: return None
    if not isasset and len(segs)==2 and segs[1].endswith(".html"): return None
    return path+("?"+q if q else "")
while queue:
    path=queue.pop(0)
    if path in seen: continue
    seen.add(path)
    url=BASE+urllib.parse.quote(path,safe="/?=&")
    # opening an article on the old site switches the session to the article's
    # language, so the language is set again before every non-article page
    seg=path.split("/")[1].lower() if path.count("/")>=1 else ""
    if not seg.endswith("detail"):
        get(BASE+"/?clang="+lang)
    body,final=get(url)
    if body is None: continue
    ext=os.path.splitext(path.split("?")[0])[1].lower()
    if ext in (".jpg",".jpeg",".png",".gif",".webp",".svg",".pdf",".css",".js",".mp4",".ico",".woff",".woff2",".ttf"):
        assets.add(path); continue
    html=body.decode("utf-8","replace")
    fn=hashlib.md5(path.encode()).hexdigest()[:10]+".html"
    open(os.path.join(out,fn),"w").write(html)
    pages[path]=fn
    for m in re.findall(r'(?:href|src|data-src|data-dsn-src)\s*=\s*["\']([^"\']+)["\']',html)+re.findall(r'url\(["\']?([^"\')]+)',html):
        n=norm(htmllib.unescape(m.strip()),url)
        if not n: continue
        e=os.path.splitext(n.split("?")[0])[1].lower()
        if e in (".jpg",".jpeg",".png",".gif",".webp",".svg",".pdf",".css",".js",".mp4",".ico",".woff",".woff2",".ttf",".webm"):
            assets.add(n.split("?")[0])
        elif n not in seen:
            queue.append(n)
    print(len(seen),path,flush=True)
json.dump({"pages":pages,"assets":sorted(assets)},open(os.path.join(out,"index.json"),"w"),ensure_ascii=False,indent=1)
print("DONE pages",len(pages),"assets",len(assets))
