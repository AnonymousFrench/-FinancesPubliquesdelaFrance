# Convertit les tableaux Insee des immigrés par pays de naissance en un CSV simple (lieu ; année ; effectif),
# lu par scripts/build-immig.mjs. À relancer quand l'Insee publie une nouvelle édition (une fois par an).
#   data-raw/immig/insee_pays_1968_2019.xlsx : https://www.insee.fr/fr/statistiques/6478091 (recensements 1968-1999, puis 2006-2019)
#   data-raw/immig/insee_essentiel.xlsx      : https://www.insee.fr/fr/statistiques/3633212 (figure 2 : principaux pays, dernière année)
# Usage : python3 scripts/immig-insee.py   (nécessite openpyxl)
import csv, re, openpyxl

CONT = {'Europe (dont ex-URSS)': 'EUR', 'Europe': 'EUR', 'Afrique': 'AFR', 'Asie': 'ASI',
        'Amérique, Océanie': 'AMO', 'Amérique,Océanie': 'AMO'}
rows = []

wb = openpyxl.load_workbook('data-raw/immig/insee_pays_1968_2019.xlsx', data_only=True)
# 1968-1999 : colonnes code, pays, 1968, 1975, 1982, 1990, 1999 (cellules vides : pays non distingué cette année-là)
ws = wb['1968-1999']
years, cont = None, None
for r in ws.iter_rows(values_only=True):
    if r[2] == 1968: years = r[2:7]; continue
    if years is None: continue
    name = str(r[1] or '').strip()
    if name in CONT: cont = CONT[name]; key = 'C:' + cont
    elif r[0] and name and cont and r[0] != '***': key = name
    else: continue
    for y, v in zip(years, r[2:7]):
        if isinstance(v, (int, float)): rows.append((key, cont, y, int(v)))
# 2006-2019 : une ligne par pays, une colonne par année
ws = wb['2006-2019']
years, cont = None, None
for r in ws.iter_rows(values_only=True):
    if r[1] == 2019: years = [y for y in r[1:] if y]; continue
    if years is None or not r[0]: continue
    name = str(r[0]).strip()
    if name.startswith(('Note', 'Champ', 'Source')): break
    if name in CONT: cont = CONT[name]; key = 'C:' + cont
    else: key = name
    for y, v in zip(years, r[1:1 + len(years)]):
        if isinstance(v, (int, float)): rows.append((key, cont, y, int(v)))

# Dernière année : figure 2 de « L'essentiel sur les immigrés » (effectifs en milliers, principaux pays de chaque continent)
wb = openpyxl.load_workbook('data-raw/immig/insee_essentiel.xlsx', data_only=True)
ws = wb['Figure 2']
year = int(re.search(r'(\d{4})', ws.cell(1, 1).value).group(1))
cont = None
for r in ws.iter_rows(values_only=True):
    if not r[0] or not isinstance(r[1], (int, float)): continue
    name = str(r[0]).replace('\xa0', ' ').strip()
    if name == 'Ensemble': continue
    if name in CONT: cont = CONT[name]; rows.append(('C:' + cont, cont, year, round(r[1] * 1000))); continue
    rows.append((name, cont, year, round(r[1] * 1000)))
# Total (toutes origines) par année : figure 5
ws = wb['Figure 5']
for r in ws.iter_rows(values_only=True):
    y = r[0]
    if isinstance(y, str) and re.match(r'^\d{4}', y): y = int(y[:4])
    if isinstance(y, int) and 1900 < y < 2100 and isinstance(r[3], (int, float)):
        rows.append(('TOTAL', '', y, round(r[3] * 1000)))
        rows.append(('POP', '', y, round(r[5] * 1000)))

with open('data-raw/immig/insee-stock.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f, delimiter=';')
    w.writerow(['lieu', 'continent', 'annee', 'effectif'])
    w.writerows(rows)
print(len(rows), 'lignes ; années', sorted({r[2] for r in rows if r[0] != 'TOTAL'}))
