# Contrôle visuel de l'onglet Présidentielle (FR, EN, mobile) avec Playwright.
# Prérequis : npm run build, puis npx vite preview --port 4174 --strictPort (dans un autre terminal ou en arrière-plan).
# Lancer : python3 scripts/check-pages.py ; échoue s'il y a une erreur JavaScript ou un débordement horizontal sur mobile.
import sys
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:4174'
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for lang, url in [('fr', BASE + '/presidentielle-2027'), ('en', BASE + '/en/presidentielle-2027'), ('fr', BASE + '/sondages-presidentielle-2027')]:
        pg = b.new_page(viewport={'width': 1280, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(2500)
        btns = pg.locator('.picker button'); n = btns.count()
        print(url, 'candidats :', n)
        for i in range(n):
            btns.nth(i).click(); pg.wait_for_timeout(250)
            dd = pg.locator('#deep-dive .kpis')
            txt = dd.inner_text().replace('\n', ' | ')[:110] if dd.count() else 'non modélisé'
            print('  ', btns.nth(i).inner_text().split('\n')[1] if '\n' in btns.nth(i).inner_text() else '', '->', txt)
        if errs: print('ERREURS', errs); bad += 1
        pg.close()
    pg = b.new_page(viewport={'width': 390, 'height': 844}); pg.goto(BASE + '/presidentielle-2027'); pg.wait_for_timeout(2000)
    w = pg.evaluate('document.documentElement.scrollWidth'); print('mobile, largeur :', w)
    if w > 390: bad += 1
    b.close()
sys.exit(1 if bad else 0)
