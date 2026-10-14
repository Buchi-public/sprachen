"""Baut <sprache>/index.html aus kern/ + <sprache>/sprache.json + interner Vokabeldatei.
Aufruf:  python3 werkzeug/build.py spanisch /pfad/zu/spanisch_daten.json
Die Vokabeldatei (mit Quellenangaben 'src') bleibt INTERN im Claude-Projekt; ins Repo kommt nur die Seite ohne 'src'."""
import json, sys, os, html
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lang, datafile = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(root, lang, 'sprache.json'), encoding='utf-8'))
data = json.load(open(datafile, encoding='utf-8'))
for v in data['vokabeln']: v.pop('src', None)            # keine Buchangaben öffentlich
js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
colors = cfg.get('colors')  # optional: {"a1":"#..","a2":"#..","a1Dark":"#..","a2Dark":"#.."}
color_css = ''
if colors:
    color_css = (f"<style>:root{{--a1:{colors['a1']};--a2:{colors['a2']}}}"
                 f"@media (prefers-color-scheme:dark){{:root:not([data-theme=\"light\"]){{--a1:{colors['a1Dark']};--a2:{colors['a2Dark']}}}}}"
                 f":root[data-theme=\"dark\"]{{--a1:{colors['a1Dark']};--a2:{colors['a2Dark']}}}</style>")
title = html.escape(cfg['title'])
page = f'''<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{title}">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#FBF8F1">
<title>{title}</title>
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&family=Fraunces:opsz,wght@9..144,700&display=swap">
<link rel="stylesheet" href="../kern/app.css">
{color_css}
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}[hidden]{{display:none!important}}</style>
</head><body>
<header><h1>{cfg['h1']}</h1><div class="hr"><div id="stats"></div><button id="gear" aria-label="Einstellungen">⚙️</button></div></header>
<main id="main"></main>
<nav id="nav">
  <button data-v="durchgang"><span class="ico">🆕</span>Neu</button>
  <button data-v="karten"><span class="ico">🃏</span>Karten</button>
  <button data-v="quiz"><span class="ico">✅</span>Quiz</button>
  <button data-v="schreiben"><span class="ico">✍️</span>Schreiben</button>
  <button data-v="saetze"><span class="ico">💬</span>Sätze</button>
  <button data-v="liste"><span class="ico">📖</span>Liste</button>
</nav>
<script>window.LANG={js(cfg)};window.DATA={js(data)};</script>
<script src="../kern/app.js"></script>
</body></html>
'''
open(os.path.join(root, lang, 'index.html'), 'w', encoding='utf-8').write(page)
json.dump({"name": cfg['title'] + " – Vokabeltrainer", "short_name": cfg['title'], "start_url": "./", "scope": "./",
           "display": "standalone", "background_color": "#FBF8F1", "theme_color": "#FBF8F1",
           "icons": [{"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
                     {"src": "icon-180.png", "sizes": "180x180", "type": "image/png"}]},
          open(os.path.join(root, lang, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('gebaut:', lang, len(data['vokabeln']), 'Vokabeln,', len(data['saetze']), 'Sätze')
