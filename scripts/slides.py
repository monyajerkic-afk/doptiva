"""Nadomestne ilustracije za drsnik (1600x700). Zamenjajo jih prave fotografije z istim imenom (.webp/.jpg)."""
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'img', 'slides')
os.makedirs(OUT, exist_ok=True)

def dots(color):
    s = []
    for y in range(40, 700, 40):
        for x in range(40, 1600, 40):
            s.append(f'<circle cx="{x}" cy="{y}" r="1.2"/>')
    return f'<g fill="{color}" opacity=".18">{"".join(s)}</g>'

def svg(bg, line, soft, body, label, dx=70):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 700" role="img" aria-label="{label}">
<rect width="1600" height="700" fill="{bg}"/>
{dots(soft)}
<g fill="none" stroke="{line}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate({dx} 0)">
{body}
</g>
</svg>'''

S = {}

# 1 skladišče s policami
shelf = []
for y in (210, 360, 510):
    shelf.append(f'<path d="M620 {y}H1380"/>')
shelf.append('<path d="M620 120V600M1380 120V600"/>')
items = [
  (650,140,70,70),(735,155,60,55),(810,125,90,85),(915,150,50,60),
  (1010,128,80,82),(1105,145,64,65),(1185,135,72,75),(1270,150,80,60),
]
for x,y,w,h in items: shelf.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4"/>')
for i,x in enumerate(range(660,1360,46)):
    shelf.append(f'<path d="M{x} 360v-80c0-10 6-16 6-26v-20h12v20c0 10 6 16 6 26v80"/>')
for x,y,w,h in [(650,420,110,90),(775,440,90,70),(880,410,120,100),(1015,430,100,80),(1130,420,110,90),(1255,440,95,70)]:
    shelf.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4"/><path d="M{x} {y+h/2}h{w}" opacity=".5"/>')
shelf.append('<g transform="rotate(-6 1420 470)"><rect x="1360" y="400" width="150" height="190" rx="4" fill="#0E4A3C"/><path d="M1385 440h100M1385 470h80M1385 500h95M1385 530h60"/></g>')
S['narocila'] = svg('#0E4A3C', '#7FE3C2', '#CFEFE3', '\n'.join(shelf), 'Ilustracija: police s pijačo in živili v skladišču')

# 2 prenosnik s preglednico
x0,y0,w,h = 640,150,760,420
g = [f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="14"/>', f'<path d="M560 {y0+h+20}H1480l-40 30H600z"/>']
for i in range(1,8): g.append(f'<path d="M{x0+20} {y0+20+i*48}H{x0+w-20}" opacity=".55"/>')
for i in range(1,6): g.append(f'<path d="M{x0+20+i*120} {y0+20}V{y0+h-20}" opacity=".55"/>')
g.append(f'<rect x="{x0+20}" y="{y0+20}" width="{w-40}" height="{h-40}" rx="4"/>')
for (cx,cy) in [(2,2),(3,4),(1,5),(4,6)]:
    g.append(f'<rect x="{x0+24+cx*120}" y="{y0+24+cy*48}" width="112" height="40" fill="#A8CBF1" fill-opacity=".22" stroke="none"/>')
g.append('<g transform="rotate(8 520 300)"><rect x="440" y="200" width="150" height="190" rx="4" fill="#193F5C"/><path d="M465 240h100M465 270h80M465 300h95"/></g>')
S['excel'] = svg('#193F5C', '#A8CBF1', '#D1E4FF', '\n'.join(g), 'Ilustracija: prenosnik s preglednico')

# 3 tablica v trgovini
t = []
for y in (180, 320, 460):
    t.append(f'<path d="M560 {y}H1050" opacity=".5"/>')
    for x in range(580, 1040, 60): t.append(f'<rect x="{x}" y="{y-70}" width="44" height="66" rx="3" opacity=".5"/>')
t.append('<rect x="980" y="130" width="380" height="500" rx="26" fill="#6A2A12"/><rect x="1005" y="165" width="330" height="430" rx="8"/>')
for i,y in enumerate((210,270,330,390)):
    t.append(f'<path d="M1030 {y}h160"/><rect x="1230" y="{y-18}" width="80" height="36" rx="18"/>')
t.append('<rect x="1030" y="470" width="280" height="56" rx="8" fill="#FFB59E" fill-opacity=".25"/>')
S['teren'] = svg('#6A2A12', '#FFB59E', '#FFDBCF', '\n'.join(t), 'Ilustracija: tablica z obrazcem v trgovini', dx=0)

# 4 delavnica: ključ, dokument, ura
d = ['<rect x="620" y="150" width="300" height="400" rx="6"/>']
for y in range(210, 500, 44): d.append(f'<path d="M660 {y}h{220 if y%88 else 170}"/>')
d.append('<circle cx="1100" cy="270" r="110"/><path d="M1100 270V190M1100 270l55 36"/>')
d.append('<path d="M1190 600l120-120a54 54 0 1 1 36 36L1226 636a26 26 0 0 1-36-36z"/>')
d.append('<path d="M960 470h150M960 510h100" stroke="#6CDBB7"/>')
S['ponudbe'] = svg('#2E3230', '#C4C7C5', '#E1E3E0', '\n'.join(d), 'Ilustracija: dokument, ura in ključ v delavnici')

# 5 ekipa ob prenosniku
e = []
for cx in (700, 1010, 1320):
    e.append(f'<circle cx="{cx}" cy="230" r="46"/><path d="M{cx-80} 420c0-70 36-120 80-120s80 50 80 120"/>')
e.append('<path d="M760 520h500l40 40H720z" fill="#00513F"/><rect x="820" y="330" width="380" height="190" rx="10" fill="#00513F"/>')
e.append('<path d="M860 380h180M860 420h130M860 460h160" opacity=".7"/>')
e.append('<path d="M1100 140h160a20 20 0 0 1 20 20v50a20 20 0 0 1-20 20h-110l-30 26v-26h-20a20 20 0 0 1-20-20v-50a20 20 0 0 1 20-20z"/>')
S['orodja'] = svg('#00513F', '#8CF8D2', '#C5FFE9', '\n'.join(e), 'Ilustracija: manjša ekipa ob prenosniku')

# 6 AI: okno z besedilom, ki nastaja
a = ['<rect x="620" y="140" width="760" height="420" rx="14"/><path d="M620 200H1380"/>']
a.append('<circle cx="660" cy="170" r="8"/><circle cx="690" cy="170" r="8"/><circle cx="720" cy="170" r="8"/>')
for i,(y,wid) in enumerate([(250,520),(295,600),(340,460),(385,560),(430,300)]):
    a.append(f'<path d="M680 {y}h{wid}"{" opacity=\".55\"" if i>2 else ""}/>')
a.append('<path d="M1000 430v28" stroke="#6CDBB7" stroke-width="4"/>')
a.append('<path d="M1270 470l14-34 14 34 34 14-34 14-14 34-14-34-34-14z" stroke="#6CDBB7"/>')
a.append('<path d="M1320 240l8-18 8 18 18 8-18 8-8 18-8-18-18-8z" stroke="#6CDBB7"/>')
S['ai'] = svg('#142E44', '#8CB0D4', '#D1E4FF', '\n'.join(a), 'Ilustracija: okno z besedilom, ki ga pripravlja umetna inteligenca')

for k, v in S.items():
    open(os.path.join(OUT, f'{k}.svg'), 'w').write(v)
print('ok', list(S))
