# Extrait du projet de loi de finances (PDF officiel) les tableaux nécessaires au site, quand les fichiers
# open data (data.economie.gouv.fr) ne sont pas encore publiés :
#   État A (voies et moyens)  -> data-raw/plf<AA>-recettes.csv, au format du fichier open data « Recettes du budget général »
#   États B, C, D (crédits)   -> data-raw/plf<AA>-destination.csv, au format « Dépenses selon destination », au niveau programme
# Usage : python3 scripts/plf-pdf.py <PLF.pdf> <année>   (nécessite pdftotext, paquet poppler-utils)
# Les totaux de chaque tableau sont vérifiés ; le script s'arrête si un total ne correspond pas.
import csv, re, subprocess, sys, unicodedata

pdf, year = sys.argv[1], sys.argv[2]
yy = year[2:]
txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True, check=True).stdout.split('\n')

NUM = r'-?\d{1,3}(?: \d{3})*'
num = lambda s: int(s.replace(' ', ''))
HEADER = re.compile(r'^\s*(\(en euros\)|Intitulé de la recette|Évaluation\s*$|pour \d{4}\s*$|Mission / Programme|d’engagement(\s+de paiement)?\s*$|Autorisations\s+Crédits\s*$|Numéro\b|de la ligne\b)|Projet de loi de finances|^\s*\d{1,3}\s*$')

def find(pat, start=0):
    for i in range(start, len(txt)):
        if re.search(pat, txt[i]):
            return i
    sys.exit(f'introuvable : {pat}')

# ---------- État A : recettes du budget général ----------
a0 = find(r'^Etat A - Voies et moyens pour')
a1 = find(r'^Récapitulation des recettes du budget général', a0)
TYPES = {
    'fisc': 'Recettes fiscales', 'nonfisc': 'Recettes non fiscales',
    'psrct': "Prélèvements sur les recettes de l'État au profit des collectivités territoriales",
    'psrue': "Prélèvement sur les recettes de l'État au profit de l'Union européenne",
}
sec, rows, prev = None, [], None
for line in txt[a0:a1]:
    s = line.strip()
    if not s or HEADER.search(line):
        continue
    if s == 'Recettes fiscales': sec, prev = 'fisc', None; continue
    if s == 'Recettes non fiscales': sec, prev = 'nonfisc', None; continue
    if s.startswith('Fonds de concours'): sec, prev = None, None; continue
    if re.match(r'^\d+\w*\.\s', s):  # ligne de regroupement (« 1. Impôt net sur le revenu »)
        if 'collectivités territoriales' in s and 'Prélèvement' in s: sec = 'psrct'
        elif 'Union européenne' in s and 'Prélèvement' in s: sec = 'psrue'
        prev = None
        continue
    m = re.match(rf'^(\d{{4}})(?:-Net)?\s+(.*?)\s{{2,}}({NUM})\s*$', line)
    if m and sec:
        prev = [year, TYPES[sec], m.group(1), m.group(2).strip(), num(m.group(3))]
        rows.append(prev)
    elif prev is not None and not re.search(rf'\s{{2,}}{NUM}\s*$', line):
        prev[3] += ' ' + s  # libellé sur plusieurs lignes
    elif sec and (m2 := re.match(rf'^(\D.*?)\s{{2,}}({NUM})\s*$', s)):
        prev = [year, TYPES[sec], '', m2.group(1).strip(), num(m2.group(2))]  # ligne sans numéro (remboursements et dégrèvements)
        rows.append(prev)
# Totaux de la récapitulation
recap = {}
for line in txt[a1:a1 + 80]:
    m = re.match(rf'^(Recettes fiscales|Recettes non fiscales|Prélèvements sur les recettes de l’État au profit des collectivités territoriales|Prélèvement sur les recettes de l’État au profit de l’Union européenne)\s+({NUM})\s*$', line.strip())
    if m and m.group(1) not in recap: recap[m.group(1)] = num(m.group(2))
for key, label in [('fisc', 'Recettes fiscales'), ('nonfisc', 'Recettes non fiscales'),
                   ('psrct', 'Prélèvements sur les recettes de l’État au profit des collectivités territoriales'),
                   ('psrue', 'Prélèvement sur les recettes de l’État au profit de l’Union européenne')]:
    got = sum(r[4] for r in rows if r[1] == TYPES[key])
    want = recap.get(label)
    print(f'État A {key:8} lignes {sum(1 for r in rows if r[1] == TYPES[key]):3}  somme {got:>16,}  récapitulation {want if want is None else f"{want:,}":>16}')
    if want is None or got != want:
        sys.exit(f'total État A incohérent pour {label}')
with open(f'data-raw/plf{yy}-recettes.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f, delimiter=';')
    w.writerow(['annee', 'type_de_recettes', 'code_ligne_recettes', 'libelle', 'montant_recettes_plf'])
    for r in rows: w.writerow(r)

# ---------- États B, C, D : crédits par mission et programme ----------
def table(start_pat, end_pat, kind):
    b0 = find(start_pat); b1 = find(end_pat, b0 + 1)
    entries, total = [], None
    for line in txt[b0:b1]:
        s = line.strip()
        if not s or HEADER.search(line) or s.startswith('Etat ') or s.startswith('(Article') or s.startswith('Répartition') or s.startswith('titre ') or s.isupper():
            continue
        if s.startswith('dont titre'):
            continue
        m = re.match(rf'^(.*?)\s{{2,}}({NUM})\s{{2,}}({NUM})\s*$', s)
        if m:
            name, ae, cp = m.group(1).strip(), num(m.group(2)), num(m.group(3))
            if name.startswith('Total'):  # État D : un total par catégorie de comptes, qui clôt la catégorie
                total = (ae + (total or (0, 0))[0], cp + (total or (0, 0))[1]); entries.append(None); continue
            entries.append([name, ae, cp])
        elif entries and entries[-1] is not None:
            entries[-1][0] += ' ' + s
    # Une mission est suivie de ses programmes, dont la somme est égale à la mission. None : fin de catégorie.
    out, k = [], 0
    while k < len(entries):
        if entries[k] is None: k += 1; continue
        mname, mae, mcp = entries[k]; j, sae, scp, progs = k + 1, 0, 0, []
        zero = lambda e: e is not None and e[1:] == [0, 0]
        if (mae, mcp) == (0, 0) and (k == 0 or entries[k - 1] is None):  # mission sans crédits en tête de catégorie
            while j < len(entries) and zero(entries[j]): progs.append(entries[j]); j += 1
        else:
            while j < len(entries) and entries[j] is not None and (sae, scp) != (mae, mcp):
                progs.append(entries[j]); sae += entries[j][1]; scp += entries[j][2]; j += 1
            # Programmes à zéro placés après ceux qui atteignent déjà le total : rattachés à cette mission.
            # (Une mission entièrement à zéro n'est reconnue qu'en tête de catégorie, cf. ci-dessus.)
            while (sae, scp) == (mae, mcp) and j < len(entries) and zero(entries[j]):
                progs.append(entries[j]); j += 1
            if (sae, scp) != (mae, mcp) or not progs:
                sys.exit(f'{kind} : impossible de rattacher les programmes de « {mname} »')
        out.append((mname, mae, mcp, progs)); k = j
    ae, cp = sum(m[1] for m in out), sum(m[2] for m in out)
    print(f'{kind:4} missions {len(out):3}  AE {ae:>18,}  CP {cp:>18,}  total publié {total}')
    if total and (ae, cp) != total:
        sys.exit(f'{kind} : total incohérent')
    return out

B = table(r'^Etat B - Répartition des crédits', r'^Etat C - Répartition des crédits', 'BG')
C = table(r'^Etat C - Répartition des crédits', r'^Etat D - Répartition des crédits', 'BA')
D = table(r'^Etat D - Répartition des crédits', r'^Etat E - |^Etat E ', 'CS')

# Codes de mission et de programme : repris du fichier de l'année précédente quand le libellé est identique.
# Le ministère n'est pas repris (les intitulés changent avec chaque gouvernement) : le tableau B ne le donne pas.
norm = lambda s: re.sub(r'\W+', ' ', unicodedata.normalize('NFKD', s.replace('’', "'")).encode('ascii', 'ignore').decode().lower()).strip()
prev_m, prev_p = {}, {}
try:
    with open('data-raw/plf25-destination.csv', encoding='utf-8-sig') as f:
        for r in csv.reader(f, delimiter=';'):
            if r[0] == 'exercice': continue
            prev_m.setdefault(norm(r[6]), (r[5], r[3], r[4]))
            prev_p.setdefault(norm(r[8]), r[7])
except FileNotFoundError:
    pass
# Missions renommées depuis l'année précédente (nouveau libellé -> ancien libellé).
RENAMED = {
    'Agriculture et alimentation': 'Agriculture, alimentation, forêt et affaires rurales',
    'Gestion des finances publiques et lutte contre les fraudes': 'Gestion des finances publiques',
    'Monde combattant, mémoire et liens avec la Nation': 'Anciens combattants, mémoire et liens avec la Nation',
    'Avances à l’audiovisuel public': 'Audiovisuel public',
}
for new, old in RENAMED.items():
    if norm(old) in prev_m: prev_m[norm(new)] = prev_m[norm(old)]
missing = []
with open(f'data-raw/plf{yy}-destination.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f, delimiter=';')
    w.writerow(['exercice', 'loi', 'typebudget', 'ministere', 'libelle_ministere', 'mission', 'libelle_mission', 'programme', 'libelle_programme', 'action', 'libelle_action', 'sous_action', 'libelle_sous_action', 'categorie', 'titre', 'autorisation_engagement', 'credit_de_paiement'])
    for kind, tab in [('BG', B), ('BA', C), ('CAS', D)]:
        for k, (mname, mae, mcp, progs) in enumerate(tab):
            code, mincode, minlib = prev_m.get(norm(mname), (f'{kind}{k:02d}', '', ''))
            if norm(mname) not in prev_m: missing.append(mname)
            for i, (pname, pae, pcp) in enumerate(progs):
                w.writerow([year, 'PLF', kind, '', '', code, mname, prev_p.get(norm(pname), ''), pname, '', '', '', '', '', '', pae, pcp])
print('missions sans correspondance dans le fichier précédent :', missing or 'aucune')
print(f'écrit data-raw/plf{yy}-recettes.csv ({len(rows)} lignes) et data-raw/plf{yy}-destination.csv')
