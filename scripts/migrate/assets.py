import sys, os, re, json, urllib.parse, urllib.request, time
BASE="https://www.doctorahmedelmasry.com"
out=sys.argv[1]; idx=sys.argv[2:]
want=set()
for f in idx:
    for a in json.load(open(f))["assets"]:
        m=re.search(r'/(assets|ApplicationImages|Content|images)/.*',a)
        if m: want.add(m.group(0))
# extra known ones
want.update(["/assets/images/ahmedElmasrypic1.jpg","/Content/images/logo.webp"])
op=urllib.request.build_opener(); op.addheaders=[("User-Agent","Mozilla/5.0")]
done=set(); fails=[]
def fetch(p):
    if p in done: return None
    done.add(p)
    dest=os.path.join(out,p.lstrip("/"))
    if os.path.exists(dest): return open(dest,"rb").read()
    url=BASE+urllib.parse.quote(p)
    for i in range(3):
        try:
            data=op.open(url,timeout=60).read()
            os.makedirs(os.path.dirname(dest),exist_ok=True)
            open(dest,"wb").write(data); return data
        except Exception as e:
            err=e; time.sleep(1)
    fails.append((p,str(err))); return None
queue=sorted(want)
while queue:
    p=queue.pop(0)
    data=fetch(p)
    if data and p.endswith(".css"):
        for u in re.findall(r'url\(\s*["\']?([^"\')]+)',data.decode("utf-8","replace")):
            if u.startswith("data:") or u.startswith("http"): continue
            n=urllib.parse.urljoin(p,u.split("?")[0].split("#")[0])
            if n not in done: queue.append(n)
print("downloaded",len(done)-len(fails),"fails",len(fails))
json.dump(fails,open(os.path.join(out,"_fails.json"),"w"),ensure_ascii=False,indent=1)
