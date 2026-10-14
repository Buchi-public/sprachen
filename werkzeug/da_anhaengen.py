"""Hängt einen neuen Wortblock an daenisch/daenisch_daten.json an und erzeugt die Lückensätze.
Aufruf:  python3 werkzeug/da_anhaengen.py <block.txt> <bis_formrang>
block.txt: eine Zeile pro Grundform, 6 Felder mit '|':
  es|de|Wortart|Formen|Beispielsatz DA|Beispielsatz DE
  Wortart: S V A Adv P Prä K Z X   (Substantive mit en/et, Verben mit at)
Bestehende ids werden übersprungen (nie ändern!). Reihenfolge = Häufigkeit (hinten anhängen).
Danach: python3 werkzeug/build.py daenisch daenisch/daenisch_daten.json"""
import json, re, sys, os, datetime
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DF = os.path.join(root, 'daenisch', 'daenisch_daten.json')
T = {'S':'Substantive','V':'Verben','A':'Adjektive','Adv':'Adverbien','P':'Pronomen','Prä':'Präpositionen','K':'Konjunktionen','Z':'Zahlen','X':'Ausdrücke'}
data = json.load(open(DF, encoding='utf-8'))
have = {v['id'] for v in data['vokabeln']}
D = datetime.date.today().isoformat()
neu, skip, err, nosat = 0, [], [], []
for n, l in enumerate(open(sys.argv[1], encoding='utf-8'), 1):
    l = l.rstrip('\n')
    if not l.strip(): continue
    p = l.split('|')
    if len(p) != 6 or p[2] not in T or not p[0] or not p[1]: err.append(f'Zeile {n}: {l[:80]}'); continue
    es, de, t, f, ex, exde = [x.strip() for x in p]
    if es in have: skip.append(es); continue
    if t == 'S' and not re.match(r'^(en|et) ', es) and ' ' not in es and not es.endswith('er'): pass
    have.add(es); neu += 1
    v = {'id': es, 'es': es, 'de': de, 't': T[t], 'd': D, 'src': f'FrequencyWords 2018 (OpenSubtitles da), Pos. {len(data["vokabeln"])+1}'}
    if f: v['f'] = f
    if ex: v['ex'] = ex; v['exde'] = exde
    data['vokabeln'].append(v)
    if not ex: continue
    base = re.sub(r'^(at|en|et) ', '', es)
    cands = [base] + [c.strip() for c in re.split(r'[,;()]', f) if c.strip()]
    cands = [re.sub(r'^(at|en|et|den|det|de|har|er|til|på) ', '', c) for c in cands]
    cands = [c for c in cands if c and ' ' not in c and '…' not in c and len(c) > 1]
    toks = re.findall(r"[\wæøåÆØÅéÉ'-]+", ex)
    b = next((tk for c in sorted(set(cands), key=len, reverse=True) for tk in toks if tk.lower() == c.lower()), None)
    if not b and len(base) >= 3 and ' ' not in base:
        b = next((tk for tk in toks if tk.lower().startswith(base[:4].lower()) and len(tk) >= 3), None)
    if b: data['saetze'].append({'t': T[t], 'es': ex, 'de': exde, 'b': [b], 'd': D, 'v': es})
    else: nosat.append(es)
data.setdefault('meta', {})['formRang'] = int(sys.argv[2])
json.dump(data, open(DF, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(f'neu: {neu}, übersprungen (schon vorhanden): {len(skip)}, Fehler: {len(err)}, ohne Lücke: {len(nosat)}')
print('Gesamt:', len(data['vokabeln']), 'Vokabeln,', len(data['saetze']), 'Sätze; bearbeitet bis Formrang', sys.argv[2])
for e in err: print('FEHLER', e)
if skip: print('übersprungen:', ', '.join(skip[:80]))
