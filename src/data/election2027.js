// Présidentielle 2027 : données d'entrée du moteur de projection (src/lib/projection.js).
// Ajouter un parti = ajouter une entrée à `parties` avec la même forme ; rien d'autre ne change.
// Md€ par an, administrations publiques. Effet sur le solde : + l'améliore.

import { apu } from './apu.js'
import { project } from '../lib/projection.js'

const i = apu.years.length - 1

export const SOURCES = {
  plf27: { label: 'La finance pour tous, « PLF 2027 : le budget sous haute tension » (8 oct. 2026)', url: 'https://www.lafinancepourtous.com/2026/10/08/projet-de-loi-de-finances-le-budget-2027-sous-haute-tension/' },
  hcfp: { label: 'France Budget, synthèse du PLF 2027 et de l’avis 2026-5 du HCFP', url: 'https://francebudget.fr/budget-2027' },
  rnPress: { label: 'Public Sénat, présentation du contre-budget du RN (6 oct. 2026)', url: 'https://www.publicsenat.fr/actualites/politique/140-milliards-deuros-deconomies-dici-2032-leffort-radical-propose-par-marine-le-pen-pour-redresser-les-f' },
  rnPge: { label: 'Planète Grandes Écoles, mesures du budget RN 2027 et analyse de l’Institut de l’Entreprise', url: 'https://www.planetegrandesecoles.com/budget-marine-le-pen-2027-mesures-contre-budget-rn' },
  rnState: { label: 'Acteurs publics, les économies sur l’État et les collectivités dans le plan du RN', url: 'https://acteurspublics.fr/articles/la-reforme-de-letat-et-des-collectivites-au-coeur-des-economies-programmees-par-le-rn/' },
  rnFB: { label: 'Simulateur France Budget, « Programme RN 2027 »', url: 'https://francebudget.fr/scenarios/rn-2027' },
  rnSite: { label: 'rassemblementnational.fr', url: 'https://rassemblementnational.fr' },
  lfiSite: { label: 'lafranceinsoumise.fr', url: 'https://lafranceinsoumise.fr/' },
  lfiNfp: { label: 'LFI / NFP, « Notre proposition macroéconomique » (juin 2024, cadrage chiffré)', url: 'https://lafranceinsoumise.fr/wp-content/uploads/2024/06/RECIT-MACRO-FRONT-POPULAIRE-VF.pdf' },
  lfiAec: { label: 'melenchon2027.fr, L’Avenir en commun (édition 2025, mise à jour annoncée)', url: 'https://melenchon2027.fr/programme2025/livre/' },
  ifrapNfp: { label: 'iFRAP, « Le vrai coût du programme du Nouveau Front populaire » (juin 2024)', url: 'https://www.ifrap.org/budget-et-fiscalite/le-vrai-cout-du-programme-du-nouveau-front-populaire' },
  montaigneNfp: { label: 'Institut Montaigne, chiffrage du programme du NFP (juin 2024)', url: 'https://www.institutmontaigne.org/legislatives-2024/nouveau-front-populaire/synthese' },
  asteresNfp: { label: 'Asterès, note sur le chiffrage du NFP (juin 2024)', url: 'https://asteres.fr/site/wp-content/uploads/2024/06/ASTERES_NFP2.pdf' },
  lfiFB: { label: 'Simulateur France Budget, « Programme LFI 2027 »', url: 'https://francebudget.fr/scenarios/lfi-2027' },
  horFI: { label: 'franceinfo, le « budget alternatif » d’Horizons (13 oct. 2026)', url: 'https://www.franceinfo.fr/economie/budget/horizons-propose-un-budget-alternatif-avec-10-milliards-d-economies-supplementaires_8234875.html' },
  horFB: { label: 'Simulateur France Budget, « Programme Horizons 2027 »', url: 'https://francebudget.fr/scenarios/horizons-2027' },
  horEuronews: { label: 'Euronews, Édouard Philippe mise sur le travail et la baisse des dépenses (9 oct. 2026)', url: 'https://fr.euronews.com/2026/10/09/presidentielle-2027-edouard-philippe-mise-sur-le-travail-et-la-reduction-des-depenses-publ' },
  ifrapComp: { label: 'iFRAP, comparateur des programmes de la présidentielle 2027', url: 'https://www.ifrap.org/comparateurs/presidentielles-2027' },
  lrPS: { label: 'Public Sénat, le plan de 197 Md€ d’économies de Bruno Retailleau (12 oct. 2026)', url: 'https://www.publicsenat.fr/actualites/economie/presidentielle-2027-bruno-retailleau-sengage-sur-un-plan-deconomies-de-pres-de-200-milliards-deuros-sil-est-elu' },
  lrFB: { label: 'Simulateur France Budget, « Programme LR 2027 »', url: 'https://francebudget.fr/scenarios/lr-2027' },
  reJDD: { label: 'Le JDD, le plan de Gabriel Attal pour redresser les finances publiques', url: 'https://www.lejdd.fr/politique/presidentielle-le-plan-de-gabriel-attal-pour-redresser-les-finances-publiques-177987' },
  reMoneyvox: { label: 'Moneyvox, Attal veut 100 000 départs volontaires de fonctionnaires', url: 'https://www.moneyvox.fr/impot/actualites/109548/attal-veut-100-000-departs-volontaires-de-fonctionnaires-et-impunite-budgetaire-zero' },
  reFB: { label: 'Simulateur France Budget, « Programme Renaissance 2027 »', url: 'https://francebudget.fr/scenarios/renaissance-2027' },
  psInvestir: { label: 'Investirmag, contre-budget 2027 du PS (16 sept. 2026)', url: 'https://www.investirmag.fr/contre-budget-socialiste-smic-a-1-700-eur-csg-progressive-taxe-zucman/' },
  psSelectra: { label: 'Selectra, le détail du contre-budget 2027 des députés socialistes', url: 'https://selectra.info/finance/actualites/marche/csg-progressive-2027-salaire-net-smic' },
  psFB: { label: 'Simulateur France Budget, « Programme PS 2027 »', url: 'https://francebudget.fr/scenarios/ps-2027' },
  psPP: { label: 'Place publique, programme de Raphaël Glucksmann', url: 'https://place-publique.eu' },
  wikiFR: { label: 'Wikipédia, fiches des candidats (fonctions, âge)', url: 'https://fr.wikipedia.org/wiki/%C3%89lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027' },
  assemblee: { label: 'Assemblée nationale, composition des groupes (députés)', url: 'https://www.assemblee-nationale.fr' },
  ifrap22: { label: 'iFRAP, chiffrage du programme Mélenchon 2022', url: 'https://www.ifrap.org/budget-et-fiscalite/chiffrage-du-programme-de-jean-luc-melenchon' },
}

// Les programmes s'appliquent à partir de mi-2027 : l'élection a lieu en avril-mai et le budget 2027 est déjà voté.
// Seule la moitié de l'effet annuel joue en 2027 ; le premier budget complet du nouveau président est celui de 2028.
export const FIRST_YEAR_SHARE = 0.5

// ---------- Scénario de référence : politique inchangée ----------
export const baseline = {
  actual2025: { gdp: apu.gdp[i], revenue: apu.recettes[i], spending: apu.depenses[i], interest: apu.interets[i], debt: apu.dette[i], debtPrev: apu.dette[i - 1] },
  // Dernière estimation officielle pour 2026 (PLF 2027, oct. 2026). 2026 est figé avant l'arrivée d'un nouveau gouvernement.
  anchor2026: { deficitPct: 5.4, debtPct: 119.3 },
  growth: { 2026: 0.5, 2027: 1.0, 2028: 1.1, 2029: 1.1, 2030: 1.1, 2031: 1.1, 2032: 1.1 },
  deflator: { 2026: 2.1, 2027: 1.8, 2028: 1.75, 2029: 1.75, 2030: 1.75, 2031: 1.75, 2032: 1.75 },
  spendTrend: 1.2,   // croissance réelle des dépenses primaires sans mesure nouvelle (vieillissement, indexation, LPM)
  marketRate: 3.8,   // taux moyen des emprunts nouveaux, % (mélange d'OAT à 10 ans vers 4-4,8 % et de titres courts)
  rollover: 0.06,    // part du stock refinancée chaque année, en plus du déficit nouveau (≈ échéances / dette)
  notes: [
    '2026 calé sur l’estimation révisée du gouvernement : déficit de 5,4 % du PIB, dette de 119,3 % (PLF 2027).',
    'Croissance de 0,5 % en 2026 et 1,0 % en 2027 (PLF 2027 ; le HCFP juge 2027 optimiste), puis 1,1 %, proche des estimations de croissance potentielle.',
    'Sans mesure nouvelle, les dépenses primaires progressent de 1,2 % par an en volume ; les recettes gardent leur part de PIB de 2026.',
    'Les emprunts nouveaux coûtent 3,8 %. Chaque année, environ 6 % du stock plus le déficit nouveau sont refinancés à ce taux.',
  ],
}

// Plan officiel, affiché pour référence (non modélisé).
export const governmentPlan = {
  label: 'Plan du gouvernement (PLF 2027)',
  deficit: { 2026: 5.4, 2027: 5.0, 2029: 2.9 },
  debt: { 2026: 119.3, 2027: 121.7 },
  note: 'Déficit de 5,0 % en 2027 après 54 Md€ d’économies, sous 3 % en 2029. Le HCFP juge l’objectif de 5,0 % « très peu vraisemblable » sauf conjoncture très favorable.',
  src: ['plf27', 'hcfp'],
}

// ---------- Partis ----------
export const parties = {
  rn: {
    id: 'rn', name: 'Rassemblement national', short: 'RN', color: '#1b2a6b', status: 'ready', officialSite: 'https://rassemblementnational.fr',
    profile: { age: 57, role: 'Députée du Pas-de-Calais', wiki: 'Marine_Le_Pen' },
    candidate: 'Marine Le Pen', pollName: 'Le Pen', position: 'Extrême droite', poll: 33.9, pollDelta: 1.9, deputies: 121,
    document: 'Contre-budget et trajectoire des finances publiques 2027-2032, présentés par Marine Le Pen et Jean-Philippe Tanguy le 6 octobre 2026. Le document complet n’était pas en ligne lors de la construction de cette page : les montants viennent de la presse et de l’analyse de l’Institut de l’Entreprise.',
    headline: [
      ['Économies nettes', '140 Md€ en 2032 par rapport à 2026'],
      ['Baisses d’impôts nettes', '30 Md€ sur le quinquennat'],
      ['Objectif de déficit', 'sous 3 % du PIB en 2030'],
      ['Objectif de dette', '121 % en 2027 → 112 % en 2032'],
      ['Croissance retenue', '1,8 % par an'],
    ],
    growthClaim: { 2026: 0.5, 2027: 1.8, 2028: 1.8, 2029: 1.8, 2030: 1.8, 2031: 1.8, 2032: 1.8 },
    growthNote: 'Selon le gouvernement, le plan suppose 1,8 % de croissance par an ; France Budget évoque une cible de 1,5 %. Dans les deux cas, bien au-dessus du consensus de 1,0-1,1 %.',
    targets: { deficit: { 2030: 3.0, 2032: 2.5 }, debt: { 2027: 121, 2032: 112 } },
    // Montants bruts par catégorie, tels que recalculés par l'Institut de l'Entreprise (points 2027 et 2031) ;
    // interpolés entre les deux et maintenus en 2032. Les lignes de coût sont négatives.
    measures: [
      { id: 'social', cls: 'B', name: 'Sécurité sociale', kind: 'spending', points: { 2027: 19.0, 2031: 53.1 },
        detail: '« Corrections » des retraites (15 à 20 Md€ à terme), allocation sociale unique, règles d’indexation des prestations.',
        flag: 'Économies sur les retraites non détaillées ; le parti les annonce « dans les prochaines semaines ».' },
      { id: 'state', cls: 'B', name: 'État, opérateurs et collectivités', kind: 'spending', points: { 2027: 22.4, 2031: 29.0 },
        detail: 'Réorganisation de l’État (20,7 Md€ dès 2027), effort des collectivités (8,2 Md€), suppression d’agences (3,4 Md€ en 2027, plus de 10 Md€ en 2031), 85 000 postes d’opérateurs et 116 000 postes locaux non remplacés, suppression des intercommunalités et métropoles.',
        flag: 'Supprimer une agence économise moins que son budget : les agents doivent être reclassés ou indemnisés.' },
      { id: 'energy', cls: 'B', name: 'Énergie, réseaux et concessions', kind: 'mixed', points: { 2027: 20.6, 2031: 29.0 },
        detail: 'Fin du soutien aux énergies renouvelables (≈ 5 Md€ la première année), moratoire sur l’éolien et le solaire, concessions autoroutières.',
        flag: 'Mélange de baisses de dépenses et de recettes ; réparti ici à parts égales.' },
      { id: 'immigration', cls: 'C', name: 'Immigration et « priorité nationale »', kind: 'spending', points: { 2027: 15.1, 2031: 29.0 },
        detail: '15 Md€ la première année, 29 Md€ en année pleine : prestations réservées aux Français ou conditionnées à 5 ans de travail, remplacement de l’AME.',
        flag: 'Les prestations réservées (18,1 Md€ en 2031) risquent de se heurter au principe constitutionnel d’égalité et au droit de l’UE.' },
      { id: 'fraud', cls: 'B', name: 'Fraude (TVA, marchés publics)', kind: 'revenue', points: { 2027: 1.1, 2031: 23.8 },
        detail: 'TVA collectée à la source, contrôle des marchés publics, recouvrement de la fraude sociale.',
        flag: 'Compte 18 Md€ de TVA à la source alors que l’écart total de TVA était estimé à 12 Md€ en 2023.' },
      { id: 'eu', cls: 'C', name: 'Contribution à l’UE', kind: 'spending', points: { 2027: 11.1, 2031: 19.5 },
        detail: 'Contribution nette plafonnée à environ 5 Md€ (≈ 29 Md€ bruts aujourd’hui).',
        flag: 'Modifier le budget de l’UE exige l’unanimité des États membres.' },
      { id: 'taxcuts', name: 'Baisses d’impôts', kind: 'revenue', points: { 2027: -15.0, 2031: -30.0 }, cost: true,
        detail: 'TVA sur l’énergie à 5,5 % (RN : 12,2 Md€ ; France Budget : 17,4 Md€), suppression de la CFE, de la CVAE et de la C3S (17 Md€, CVAE à partir de 2030), demi-part pleine dès le 2e enfant, exonération d’impôt sur le revenu des moins de 30 ans.',
        flag: 'Calculé : la somme des deux lignes de coût égale l’écart entre le total des catégories et les totaux nets (20,0 Md€ en 2027, 43,1 Md€ en 2031). La répartition entre les deux est notre estimation.' },
      { id: 'newspend', name: 'Dépenses nouvelles', kind: 'spending', points: { 2027: -5.0, 2031: -13.1 }, cost: true,
        detail: 'Retour de l’âge légal à 62 ans avec 42 annuités (RN : 9 Md€ par an ; France Budget : 12,8 Md€ en 2032), indexation des pensions, programmes de rénovation et de recherche.',
        flag: 'Calculé, voir la ligne précédente.' },
    ],
    // Analyse indépendante : l'Institut de l'Entreprise classe 80 % des gains comme non documentés, juridiquement fragiles
    // ou sans effet sur le déficit au sens de Maastricht, et estime le gain net crédible à environ 7,5 Md€ en 2031
    // (fourchette −25 à +50 Md€). Reproduit par une décote uniforme des gains, les coûts comptant en entier.
    reviews: [
      { id: 'central', label: 'Central', by: 'Institut de l’Entreprise', net2031: 7.5 },
      { id: 'low', label: 'Pessimiste', net2031: -25 },
      { id: 'high', label: 'Optimiste', net2031: 50 },
    ],
    reviewDefault: 'central',
    reviewNote: r => `Analyse de l’Institut de l’Entreprise (6 oct. 2026) : le gain net crédible en 2031 est de ${r.net2031 >= 0 ? '+' : '−'}${Math.abs(r.net2031).toString().replace('.', ',')} Md€ (fourchette −25 à +50 Md€). Chaque ligne d’économies est réduite d’un même coefficient pour s’y conformer ; les coûts comptent en entier. L’analyse exclut les effets de croissance et de taux, que le modèle ajoute.`,
    // Projections publiées par d'autres, affichées en points pour comparaison.
    external: [
      { label: 'Institut de l’Entreprise', deficit: { 2027: 5.9 }, debt: { 2031: 130 }, src: 'rnPge' },
      { label: 'Simulateur France Budget', deficit: { 2027: 6.2, 2028: 6.1, 2029: 6.2, 2030: 6.5, 2032: 7.6 }, debt: { 2027: 122, 2028: 124, 2029: 126, 2030: 130, 2032: 137.5 }, src: 'rnFB' },
    ],
    measuresNote: 'Les montants par catégorie sont ceux recalculés par l’Institut de l’Entreprise à partir des chiffres du RN (69,3 Md€ nets en 2027, 140,3 Md€ en 2031, contre 141,7 Md€ annoncés), interpolés entre les deux et maintenus en 2032. Les lignes « mixtes » sont réparties à parts égales entre dépenses et recettes.',
    measuresSrc: ['rnPge', 'rnState'],
    src: ['rnPress', 'rnPge', 'rnState', 'rnFB'],
  },

  lfi: {
    id: 'lfi', name: 'La France insoumise', short: 'LFI', color: '#c0392b', status: 'ready', officialSite: 'https://lafranceinsoumise.fr',
    profile: { age: 74, role: 'Député, fondateur de LFI', wiki: 'Jean-Luc_Mélenchon' },
    candidate: 'Jean-Luc Mélenchon', pollName: 'Mélenchon', position: 'Gauche radicale', poll: 16.7, pollDelta: 1.8, deputies: 70,
    document: 'Le programme 2027 de LFI (« L’Avenir en commun », édition 2025 ; une 5e édition de 1 069 mesures est annoncée) n’a pas encore de chiffrage publié. Cet onglet utilise le cadrage chiffré publié par LFI pour le programme du Nouveau Front populaire de 2024, toujours mis en avant dans son programme, avec les mêmes trois phases décalées à mi-2027. Des sites de suivi citent +250 Md€ de dépenses et +267 Md€ de recettes pour l’édition 2025 ; ces chiffres sont introuvables sur les sites de LFI.',
    headline: [
      ['Dépenses nouvelles', '+150 Md€ par an en troisième année'],
      ['Recettes nouvelles', '+150 Md€ par an en troisième année'],
      ['Effet net annoncé', 'équilibré (+5 Md€ la 1re année)'],
      ['Objectif de déficit / dette', 'aucun publié'],
      ['Retraites', 'retour à 60 ans, financé par des cotisations'],
    ],
    growthClaim: null,
    growthNote: 'LFI affirme que le plan « s’autofinance largement grâce au retour de la croissance » mais ne publie aucun chiffre de croissance : une partie de ses recettes (≈ 31 Md€, la ligne non détaillée) correspond à cet effet retour. La croissance reste ici au consensus.',
    targets: { deficit: {}, debt: {} },
    // Les trois phases de LFI en montants annuels : phase 1 (premiers mois : 25 de dépenses / 30 de recettes), phase 2
    // (100 / 100 cumulés à la fin de la 2e année), phase 3 (150 / 150 deux ans plus tard). Placées en 2027, 2028 et 2030.
    measures: [
      { id: 'pp', name: 'Pouvoir d’achat et droits sociaux', kind: 'spending', cost: true, points: { 2027: -25, 2028: -60, 2030: -90 },
        detail: 'Point d’indice +10 %, abrogation des réformes des retraites et de l’assurance chômage, gratuité intégrale de l’école publique (cantine, fournitures, transport), APL +10 %, garantie d’autonomie pour les jeunes sous le seuil de pauvreté. SMIC à 1 600 € net (payé par les employeurs, avec un soutien de l’État aux petites entreprises).',
        flag: 'Inclut l’abrogation de la réforme de 2023 ; le retour à 60 ans figure sur une ligne séparée.' },
      { id: 'eco', name: 'Bifurcation écologique', kind: 'spending', cost: true, points: { 2027: 0, 2028: -20, 2030: -30 },
        detail: 'Rénovation thermique avec zéro reste à charge pour ceux qui en ont besoin, filières françaises et européennes d’énergies renouvelables, plan rail et fret, soutien à l’agriculture biologique.',
        flag: 'La répartition du total de la phase 2 entre les trois priorités est notre estimation, proportionnelle aux enveloppes finales (90 / 30 / 30).' },
      { id: 'pub', name: 'Services publics', kind: 'spending', cost: true, points: { 2027: 0, 2028: -20, 2030: -30 },
        detail: 'Recrutement d’enseignants pour réduire les effectifs par classe, plan pluriannuel de recrutement et de revalorisation des soignants, services publics à moins de 30 minutes de chez soi, culture à 1 % du PIB, agents contre la fraude fiscale.',
        flag: 'Présentées comme des « autorisations d’engagement » (plafonds) : la dépense effective pourrait être plus lente.' },
      { id: 'superprofits', cls: 'B', name: 'Taxe sur les superprofits', kind: 'revenue', points: { 2027: 15, 2030: 15 },
        detail: 'Taxe sur les « superprofits » de secteurs comme l’énergie ou l’agroalimentaire, votée dans une loi de finances rectificative dès le premier été.',
        flag: 'Les profits exceptionnels sont par nature temporaires : le rendement a peu de chances de se maintenir chaque année.' },
      { id: 'isf', cls: 'B', name: 'ISF avec volet climatique', kind: 'revenue', points: { 2027: 15, 2030: 15 },
        detail: 'Rétablissement de l’impôt de solidarité sur la fortune, avec une composante liée à l’empreinte carbone du patrimoine.',
        flag: 'L’ancien ISF rapportait environ 4 à 5 Md€ par an avant 2018 ; 15 Md€ supposent une assiette beaucoup plus large ou des taux plus élevés.' },
      { id: 'niches', cls: 'B', name: 'Suppression de niches fiscales', kind: 'revenue', points: { 2027: 0, 2028: 25, 2030: 25 },
        detail: 'Suppression des niches « inefficaces, injustes et polluantes ».',
        flag: 'Les niches visées ne sont pas précisées.' },
      { id: 'inherit', cls: 'A', name: 'Réforme des droits de succession', kind: 'revenue', points: { 2027: 0, 2028: 17, 2030: 17 },
        detail: 'Succession plus progressive et héritage maximal de 12 M€.',
        flag: 'Doublerait presque les droits de succession et de donation (21,7 Md€ d’impôts en capital en 2025).' },
      { id: 'income', cls: 'A', name: 'IR à 14 tranches, CSG progressive, fin de la flat tax', kind: 'revenue', points: { 2027: 0, 2028: 8.2, 2030: 8.2 },
        detail: 'Barème de l’impôt sur le revenu à 14 tranches et CSG progressive (5,5 Md€) ; revenus du capital imposés comme ceux du travail par la suppression du prélèvement forfaitaire de 30 % (2,7 Md€). Selon LFI, 9 ménages sur 10 paieraient moins.',
        flag: 'Montant net des baisses pour la plupart des ménages : les mouvements bruts sont plus importants dans les deux sens.' },
      { id: 'zucman', cls: 'C', name: 'Impôt « Zucman » sur les multinationales', kind: 'revenue', points: { 2028: 0, 2030: 26 },
        detail: 'Imposer les bénéfices des multinationales là où leur activité a réellement lieu.',
        flag: 'Suppose une coordination internationale ou des règles unilatérales contestées ; rendement très incertain.' },
      { id: 'equality', cls: 'D', name: 'Égalité salariale, taxe sur les transactions financières', kind: 'revenue', points: { 2028: 0, 2030: 13 },
        detail: 'Cotisations sur les salaires relevés par l’égalité femmes-hommes (10 Md€), taxe renforcée sur les transactions financières (3 Md€).',
        flag: 'Les 10 Md€ dépendent d’une hausse effective des salaires : c’est un effet retour plus qu’une mesure fiscale.' },
      { id: 'feedback', cls: 'D', name: 'Non détaillé : effet retour de la croissance et lutte contre la fraude', kind: 'revenue', points: { 2027: 0, 2028: 19.8, 2030: 30.8 },
        detail: 'Écart entre les totaux de recettes de LFI (100 puis 150) et les mesures détaillées : surplus fiscal lié à la demande, recrutement d’agents contre la fraude.',
        flag: 'Résidu calculé, non détaillé par LFI. Les analyses indépendantes lui accordent peu ou pas de valeur.' },
      { id: 'lfi-ret60', name: 'Retraite à 60 ans (40 annuités)', kind: 'spending', cost: true, points: { 2027: -5, 2028: -20, 2030: -50 },
        detail: 'Retour de l’âge légal à 60 ans avec 40 annuités, après une conférence avec les partenaires sociaux pendant la législature.',
        flag: 'Chiffrage de l’iFRAP : 50 Md€ par an une fois en place. Une petite partie (abrogation de la réforme de 2023) recoupe peut-être l’enveloppe « Pouvoir d’achat ».' },
      { id: 'lfi-ret60-fin', cls: 'B', name: 'Cotisations finançant la retraite à 60 ans', kind: 'revenue', points: { 2027: 5, 2028: 20, 2030: 50 },
        detail: 'Surcotisation sur les hauts salaires, cotisations sur les dividendes, rachats d’actions, intéressement et participation.',
        flag: 'Montant non chiffré par LFI : supposé égal au coût, comme LFI l’annonce. Aucune analyse indépendante ne retient ce financement.' },
    ],
    // Chiffrages indépendants du même cadrage 2024. La retraite à 60 ans compte en entier et son financement n'est pas
    // retenu ; les autres lignes sont mises à l'échelle pour que l'effet net final corresponde à chaque analyse.
    reviews: [
      { id: 'ifrap', label: 'iFRAP', costs: 165 / 150, gains: 55 / 150, overrides: { 'lfi-ret60': 1, 'lfi-ret60-fin': 0 }, net: -160, src: 'ifrapNfp',
        note: 'iFRAP (juin 2024) : +215 Md€ de dépenses (dont la retraite à 60 ans, 50 Md€) et +55 Md€ de recettes, soit un coût net d’environ 160 Md€ par an.' },
      { id: 'montaigne', label: 'Institut Montaigne', costs: 183 / 150, gains: 54 / 150, overrides: { 'lfi-ret60': 1, 'lfi-ret60-fin': 0 }, net: -179, src: 'montaigneNfp',
        note: 'Institut Montaigne (juin 2024) : 233 Md€ de dépenses nouvelles et baisses d’impôts, soit un déficit alourdi de 179 Md€ par an. La retraite à 60 ans (50 Md€) est supposée comprise dans ce total.' },
      { id: 'asteres', label: 'Asterès', costs: 1, gains: 100 / 150, overrides: { 'lfi-ret60': 1, 'lfi-ret60-fin': 0 }, net: -100, src: 'asteresNfp',
        note: 'Asterès (juin 2024) : en prenant les dépenses de LFI telles quelles, il manque au moins 50 Md€ de recettes. La retraite à 60 ans (50 Md€, chiffrage iFRAP) s’y ajoute, son financement n’étant pas chiffré.' },
    ],
    reviewDefault: 'ifrap',
    reviewNote: r => `${r.note} Retraite à 60 ans comptée en entier, financement non retenu.`,
    external: [
      { label: 'Simulateur France Budget', deficit: { 2027: 6.5, 2028: 5.6, 2029: 5.9, 2030: 6.3 }, debt: { 2027: 122, 2028: 123, 2029: 124, 2030: 127 }, src: 'lfiFB' },
    ],
    measuresNote: 'Montants de LFI, selon ses trois phases (première année, fin de 2e année, fin de 4e année), interpolés entre elles et maintenus après 2030. Totaux par phase : dépenses −25 / −100 / −150, recettes +30 / +100 / +150.',
    measuresSrc: ['lfiNfp'],
    src: ['lfiNfp', 'lfiAec', 'ifrapNfp', 'montaigneNfp', 'asteresNfp', 'lfiFB'],
  },

  hor: {
    id: 'hor', name: 'Horizons', short: 'HOR', color: '#0e9aa7', status: 'ready', officialSite: 'https://horizonsleparti.fr',
    profile: { age: 55, role: 'Maire du Havre, ancien Premier ministre', wiki: 'Édouard_Philippe' },
    candidate: 'Édouard Philippe', pollName: 'Philippe', position: 'Centre droit', poll: 14.4, pollDelta: 2.2, deputies: 35,
    document: 'Le programme d’Édouard Philippe fixe un déficit de 2 % du PIB en 2032, sans nouvel impôt et avec une règle d’or constitutionnelle, mais ne publie pas de total d’économies. Détaillés ici : la réforme des retraites (65 ans, 45 annuités), l’assurance chômage, le « deal fiscal » des entreprises et les 10 Md€ d’économies 2027 du budget alternatif d’Horizons (13 oct. 2026). Le reste de l’effort nécessaire pour atteindre 2 % figure sur une ligne non détaillée.',
    headline: [
      ['Objectif de déficit', '2 % du PIB en 2032'],
      ['Impôts', 'aucun nouvel impôt'],
      ['Retraites', 'âge légal 65 ans, 45 annuités'],
      ['Entreprises', '−50 Md€ d’impôts de production, financés par la fin des aides'],
      ['Total des économies', 'non publié'],
    ],
    growthClaim: null,
    growthNote: 'Horizons ne publie pas d’hypothèse de croissance. La croissance reste au consensus.',
    targets: { deficit: { 2032: 2.0 }, debt: {} },
    measures: [
      { id: 'hor-pensions', cls: 'A', name: 'Retraites : âge légal 65 ans, 45 annuités', kind: 'spending', points: { 2027: 1, 2035: 30 },
        detail: 'Âge légal porté progressivement à 65 ans et durée de cotisation à 45 annuités « en moins de dix ans », environ un tiers des actifs étant exemptés. Revenir sur la suspension de 2026 économise 1 Md€ en 2027 (Horizons).',
        flag: 'Les 30 Md€ en année pleine sont le chiffrage de l’équipe, effets retour compris ; France Budget trouve 18 Md€ en 2030 et 15 Md€ dès 2032 sur les seules pensions. Interpolé ici pour atteindre 30 Md€ en 2035.' },
      { id: 'hor-unemp', cls: 'A', name: 'Assurance chômage : 12 mois maximum avant 50 ans', kind: 'spending', points: { 2028: 4.5 },
        detail: 'Durée d’indemnisation ramenée à 12 mois pour les moins de 50 ans.',
        flag: 'Non chiffré par le candidat : estimation haute de France Budget (0,75 Md€ par mois de durée).' },
      { id: 'hor-state', cls: 'B', name: 'Économies sur l’État (budget alternatif 2027)', kind: 'spending', points: { 2027: 5 },
        detail: 'Un fonctionnaire sur trois non remplacé (Éducation, police, gendarmerie, armées et justice exemptées), dépenses de fonctionnement de l’État réduites de 10 % sur le mandat, deux jours de carence dans la fonction publique.',
        flag: 'Seul le montant 2027 (moitié des 10 Md€) est publié ; les années suivantes relèvent de la ligne non détaillée.' },
      { id: 'hor-social', cls: 'B', name: 'Économies sociales (budget alternatif 2027)', kind: 'spending', points: { 2027: 5 },
        detail: 'Dépenses des caisses de Sécurité sociale réduites de 3 % par an, contribution des retraités aisés.',
        flag: 'Seul le montant 2027 (moitié des 10 Md€) est publié.' },
      { id: 'hor-aid', cls: 'B', name: 'Fin d’aides et de niches aux entreprises', kind: 'mixed', points: { 2028: 25, 2030: 50 },
        detail: '« Deal fiscal » : 50 Md€ par an d’aides et de niches fiscales aux entreprises supprimées pour financer la baisse des impôts de production.',
        flag: 'Supprimer 50 Md€ d’aides aux entreprises n’a jamais été fait ; les dispositifs visés ne sont pas précisés.' },
      { id: 'hor-prodtax', name: 'Baisse des impôts de production', kind: 'revenue', cost: true, points: { 2028: -25, 2030: -50 },
        detail: '50 Md€ par an d’impôts de production en moins pour les entreprises (250 Md€ sur cinq ans), présentés comme neutres pour les finances publiques.',
        flag: 'Neutre uniquement si la ligne d’aides ci-dessus rapporte en totalité.' },
      { id: 'hor-taxrise', name: 'Annulation des hausses d’impôts prévues en 2027', kind: 'revenue', cost: true, points: { 2027: -10 },
        detail: 'Le budget alternatif d’Horizons annule 10 Md€ de hausses d’impôts du projet de budget 2027, compensées par les 10 Md€ d’économies ci-dessus.',
        flag: 'Supposée permanente.' },
      { id: 'hor-industry', name: 'Plan industriel (IA, énergie, défense, agriculture)', kind: 'spending', cost: true, points: { 2027: -10 },
        detail: '50 Md€ sur le mandat pour la reconquête industrielle.',
        flag: 'Réparti à parts égales, 10 Md€ par an.' },
      { id: 'hor-implied', cls: 'D', name: 'Économies supplémentaires nécessaires pour 2 % (non détaillées)', kind: 'spending', implied: { year: 2032, deficitPct: 2.0 },
        detail: 'Écart entre les mesures détaillées et l’objectif de 2 % du PIB en 2032, calculé par ce modèle avec la croissance du consensus. Édouard Philippe cite les retraites (≈ 330 Md€, premier poste), le fonctionnement de l’État et la fusion d’organismes comme principales sources.',
        flag: 'Calculé par cette page, ce n’est pas un chiffre du parti : c’est l’effort qu’Horizons doit encore préciser.' },
    ],
    reviews: [],
    reviewDefault: 'standard',
    external: [
      { label: 'Simulateur France Budget', deficit: { 2027: 5.2, 2028: 5.0, 2029: 5.2, 2030: 5.4, 2032: 6.3 }, debt: { 2027: 120, 2028: 122, 2029: 124, 2030: 127 }, src: 'horFB' },
    ],
    measuresNote: 'Montants des retraites et de l’assurance chômage : équipe du candidat et France Budget ; économies 2027 sur l’État et le social : budget alternatif d’Horizons. La ligne non détaillée est calculée pour que le plan annoncé atteigne 2 % en 2032.',
    measuresSrc: ['horFI', 'horFB', 'horEuronews'],
    src: ['horFI', 'horEuronews', 'ifrapComp', 'horFB'],
  },

  lr: {
    id: 'lr', name: 'Les Républicains', short: 'LR', color: '#2d6cdf', status: 'ready', officialSite: 'https://republicains.fr',
    profile: { age: 65, role: 'Ancien ministre de l’Intérieur, sénateur', wiki: 'Bruno_Retailleau' },
    candidate: 'Bruno Retailleau', pollName: 'Retailleau', position: 'Droite', poll: 8.1, pollDelta: 1.7, deputies: 47,
    document: 'Plan de Bruno Retailleau présenté le 12 octobre 2026 : 197 Md€ d’économies sur cinq ans (État 96 Md€, social 91 Md€, collectivités 10 Md€), dont 51 Md€ rendus en baisses d’impôts, pour un excédent primaire en 2030, un déficit sous 3 % en 2031 et 2,2 % en fin de mandat. Les lignes détaillées ci-dessous totalisent 202 Md€, un peu plus que les 197 Md€ annoncés.',
    headline: [
      ['Économies', '197 Md€ en 2032'],
      ['Baisses d’impôts', '51 Md€ (entreprises 30, ménages 21)'],
      ['Objectif de déficit', 'sous 3 % en 2031, 2,2 % en 2032'],
      ['Fonction publique', '400 000 départs en retraite non remplacés'],
      ['Croissance retenue', 'non précisée'],
    ],
    growthClaim: null,
    growthNote: 'LR ne publie pas d’hypothèse de croissance. La croissance reste au consensus.',
    targets: { deficit: { 2031: 3.0, 2032: 2.2 }, debt: {} },
    measures: [
      { id: 'lr-headcount', cls: 'A', name: 'Fonction publique : 400 000 départs non remplacés', kind: 'spending', points: { 2027: 5, 2032: 25 },
        detail: 'Un départ en retraite sur deux non remplacé dans l’État.', flag: 'L’objectif était de 200 000 à 250 000 plus tôt dans l’année.' },
      { id: 'lr-agencies', cls: 'B', name: 'Opérateurs, budget base zéro, externalisation', kind: 'spending', points: { 2027: 6, 2032: 29 },
        detail: 'Opérateurs : départs, non-renouvellements et suppressions de financements (12,5 Md€) ; budget base zéro (11,5 Md€) ; externalisation de l’immobilier, des achats et de l’informatique (5 Md€).',
        flag: 'Un rapport sénatorial de 2025 n’identifiait qu’environ 0,5 Md€ d’économies sur les opérateurs, loin des 7,5 Md€ annoncés.' },
      { id: 'lr-programmes', cls: 'A', name: 'Coupes dans les programmes', kind: 'spending', points: { 2027: 5, 2032: 26 },
        detail: 'Soutien aux renouvelables, aide au développement, culture et audiovisuel public, contrats aidés, SNU, MaPrimeRénov’ (23 Md€), subventions aux associations (3 Md€).', flag: 'Crédits discrétionnaires : simples juridiquement, difficiles politiquement.' },
      { id: 'lr-training', cls: 'C', name: 'Formation professionnelle transférée aux régions', kind: 'spending', points: { 2027: 1, 2032: 6 },
        detail: 'Transfert de la formation professionnelle de l’État aux régions.', flag: 'Un transfert entre administrations n’économise rien pour l’ensemble des APU, sauf si les régions dépensent moins.' },
      { id: 'lr-immig', cls: 'C', name: 'Immigration', kind: 'spending', points: { 2027: 2, 2032: 10 },
        detail: 'Regroupement familial, nombre d’étudiants étrangers, prestations conditionnées à cinq ans de résidence et de travail.', flag: '4,5 Md€ dépendent d’une révision constitutionnelle par référendum.' },
      { id: 'lr-fraud', cls: 'B', name: 'Fraude fiscale et sociale', kind: 'revenue', points: { 2027: 1, 2032: 5 }, detail: 'Contrôles renforcés.', flag: 'Le rendement du recouvrement est historiquement incertain.' },
      { id: 'lr-pensions', cls: 'B', name: 'Retraites', kind: 'spending', points: { 2027: 8, 2032: 42 },
        detail: 'Taux plein à 65 ans, départ possible dès 63 ans avec une décote de 7 % par an (12 Md€), 1 % de capitalisation.', flag: 'France Budget trouve 8 Md€ en 2030 et 5,4 Md€ par an dès 2032 pour le seul taux plein à 65 ans.' },
      { id: 'lr-unemp', cls: 'B', name: 'Assurance chômage', kind: 'spending', points: { 2027: 6, 2032: 30 }, detail: 'Règles d’indemnisation durcies.', flag: '30 Md€, c’est près du quart des dépenses d’assurance chômage.' },
      { id: 'lr-sick', cls: 'A', name: 'Arrêts maladie', kind: 'spending', points: { 2027: 1, 2032: 4 }, detail: 'Règles d’indemnisation des arrêts maladie.', flag: 'Type de mesure documenté.' },
      { id: 'lr-social-other', cls: 'D', name: 'Santé et autres économies sociales (non détaillées)', kind: 'spending', points: { 2027: 3, 2032: 15 },
        detail: 'Solde de l’enveloppe sociale de 91 Md€ après les lignes détaillées.', flag: 'Les économies de santé sont qualifiées d’« hypothèse très conservatrice », sans objectif chiffré.' },
      { id: 'lr-local', cls: 'B', name: 'Collectivités locales', kind: 'spending', points: { 2027: 2, 2032: 10 },
        detail: 'Dépenses de fonctionnement des 2 232 collectivités dont le budget dépasse 10 M€ (hors personnel et prestations sociales).', flag: 'L’État ne peut pas réduire directement la dépense locale : il passe par les dotations et les contrats.' },
      { id: 'lr-biztax', name: 'Baisses d’impôts des entreprises', kind: 'revenue', cost: true, points: { 2027: -15, 2028: -30 },
        detail: 'Impôts de production (C3S, CVAE, forfait social, CFE industrielle) et cotisations patronales, « dès l’entame du quinquennat ».', flag: 'Concentrées en début de mandat, alors que les économies montent en charge sur cinq ans.' },
      { id: 'lr-hhtax', name: 'Baisses d’impôts des ménages', kind: 'revenue', cost: true, points: { 2027: -10, 2028: -21 },
        detail: 'Suppression des cotisations sur les heures supplémentaires, baisse des cotisations salariales.', flag: 'L’article cite aussi 56 Md€ de baisses au total ; 51 Md€ est la somme détaillée.' },
    ],
    reviews: [],
    reviewDefault: 'standard',
    external: [
      { label: 'Simulateur France Budget', deficit: { 2027: 6.4, 2028: 6.3, 2029: 6.5, 2030: 6.8, 2032: 8.0 }, debt: { 2027: 122, 2028: 124, 2029: 127, 2030: 130, 2032: 138.9 }, src: 'lrFB' },
    ],
    measuresNote: 'Les montants sont les niveaux 2032 annoncés par LR, construits linéairement depuis 2027 (environ un cinquième la première année) ; les baisses d’impôts arrivent en début de mandat comme annoncé. France Budget n’encode pas les 150 Md€ d’économies non ventilées, d’où son déficit bien plus élevé.',
    measuresSrc: ['lrPS', 'lrFB'],
    src: ['lrPS', 'ifrapComp', 'lrFB'],
  },

  re: {
    id: 're', name: 'Renaissance', short: 'RE', color: '#e0a100', status: 'ready', officialSite: 'https://parti-renaissance.fr',
    profile: { age: 37, role: 'Ancien Premier ministre, secrétaire général de Renaissance', wiki: 'Gabriel_Attal' },
    candidate: 'Gabriel Attal', pollName: 'Attal', position: 'Centre', poll: 9.1, pollDelta: 3.4, deputies: 90,
    document: 'Le plan de Gabriel Attal : environ 150 Md€ d’économies d’ici 2032, aux deux tiers sur les dépenses sociales, sans hausse d’impôts ; un déficit sous 3 % « avant 2032 » et l’équilibre en 2037, inscrit dans la Constitution. Peu de lignes sont détaillées : 100 000 départs volontaires de fonctionnaires, l’assurance chômage et une « année blanche » des prestations dans le budget 2028.',
    headline: [
      ['Économies', '≈ 150 Md€ d’ici 2032'],
      ['Répartition', 'deux tiers sur le social'],
      ['Impôts', 'aucune hausse'],
      ['Objectif de déficit', 'sous 3 % avant 2032, 0 % en 2037'],
      ['Premier effort', '15 à 20 Md€'],
    ],
    growthClaim: null,
    growthNote: 'Renaissance ne publie pas d’hypothèse de croissance. La croissance reste au consensus.',
    targets: { deficit: { 2031: 3.0 }, debt: {} },
    measures: [
      { id: 're-departures', cls: 'A', name: '100 000 départs volontaires de fonctionnaires', kind: 'spending', points: { 2028: 2, 2032: 7 },
        detail: 'Éducation, armées, justice et intérieur exemptés.', flag: 'Les départs volontaires coûtent des indemnités au départ.' },
      { id: 're-unemp', cls: 'A', name: 'Assurance chômage (15 mois maximum)', kind: 'spending', points: { 2028: 5 },
        detail: 'Durée d’indemnisation plafonnée à 15 mois.', flag: 'Parti : « plus de 4 Md€ » (5 Md€ dans un entretien) ; France Budget : 2,25 Md€.' },
      { id: 're-freeze', cls: 'A', name: '« Année blanche » des prestations en 2028', kind: 'spending', points: { 2028: 7 },
        detail: 'Pas de revalorisation des prestations sociales pendant un an, petites retraites préservées. L’économie perdure car les revalorisations suivantes partent d’un niveau plus bas.',
        flag: 'Montant non publié : notre estimation, environ 1,75 % d’inflation sur près de 400 Md€ de prestations indexées.' },
      { id: 're-social-other', cls: 'D', name: 'Autres économies sociales (non détaillées)', kind: 'spending', points: { 2027: 0, 2032: 88 },
        detail: 'Reste de l’enveloppe sociale des deux tiers : réforme des retraites avec une part de capitalisation, resserrement de dépenses sociales.', flag: 'Non détaillé par le parti.' },
      { id: 're-state-other', cls: 'D', name: 'Autres économies sur l’État et les collectivités (non détaillées)', kind: 'spending', points: { 2027: 0, 2032: 43 },
        detail: 'Suppression d’un échelon administratif, ministres personnellement responsables de leur budget.', flag: 'Non détaillé par le parti.' },
      { id: 're-ai', name: 'Plan IA « France 2040 » (part publique)', kind: 'spending', cost: true, points: { 2028: -10 },
        detail: '200 Md€ sur dix ans, pour moitié publics.', flag: 'Part publique lue comme 10 Md€ par an (France Budget).' },
      { id: 're-prodtax', name: 'Baisse des impôts de production', kind: 'revenue', cost: true, points: { 2028: -10 },
        detail: 'Baisse annoncée, sans montant.', flag: 'Hypothèse de France Budget.' },
      { id: 're-midtax', name: 'Baisse d’impôt des classes moyennes', kind: 'revenue', cost: true, points: { 2028: -2 }, detail: '2 Md€ d’impôt en moins pour les ménages des classes moyennes.', flag: 'Chiffre du parti.' },
    ],
    reviews: [],
    reviewDefault: 'standard',
    external: [
      { label: 'Simulateur France Budget', deficit: { 2027: 6.4, 2028: 6.2, 2029: 6.3, 2030: 6.5, 2032: 7.2 }, debt: { 2027: 122, 2028: 124, 2029: 127, 2030: 130 }, src: 'reFB' },
    ],
    measuresNote: 'Les économies atteignent 150 Md€ en 2032 : 19 Md€ détaillés, 131 Md€ non détaillés (aux deux tiers sociaux, comme annoncé). Les mesures détaillées démarrent avec le premier budget complet, celui de 2028. Non modélisés : la baisse des cotisations salariales (« droit au brut », non chiffrée par le parti) et la revalorisation des enseignants.',
    measuresSrc: ['reJDD', 'reMoneyvox', 'reFB'],
    src: ['reJDD', 'reMoneyvox', 'ifrapComp', 'reFB'],
  },

  ps: {
    id: 'ps', name: 'PS – Place publique', short: 'PS-PP', color: '#d6457a', status: 'ready', officialSite: 'https://place-publique.eu',
    profile: { age: 46, role: 'Eurodéputé, cofondateur de Place publique', wiki: 'Raphaël_Glucksmann' },
    candidate: 'Raphaël Glucksmann', pollName: 'Glucksmann', position: 'Centre gauche', poll: 9.5, pollDelta: -2.0, deputies: 68,
    document: 'Raphaël Glucksmann a remporté la primaire PS / Place publique le 11 octobre 2026 ; son programme (78 mesures) n’est pas chiffré. Le cadrage chiffré utilisé ici est le contre-budget 2027 des députés socialistes (16 septembre 2026) : environ 39,5 Md€ de recettes nouvelles portées par un impôt plancher de 2 % sur les patrimoines de plus de 100 M€, 17,5 Md€ d’économies et de lutte contre la fraude, 22 Md€ de dépenses nouvelles et une CSG progressive, pour un déficit réduit d’environ 24 Md€ en 2027. L’abrogation de la réforme des retraites de 2023, inscrite au programme de Raphaël Glucksmann, est ajoutée.',
    headline: [
      ['Recettes nouvelles', '≈ 39,5 Md€ par an'],
      ['Économies, fraude', '≈ 17,5 Md€'],
      ['Dépenses nouvelles, baisse de CSG', '≈ 32 Md€'],
      ['Effet net annoncé', 'déficit −24 Md€ en 2027'],
      ['Retraites', 'réforme de 2023 abrogée'],
    ],
    growthClaim: null,
    growthNote: 'Le PS ne publie pas d’hypothèse de croissance. La croissance reste au consensus.',
    targets: { deficit: {}, debt: {} },
    measures: [
      { id: 'ps-zucman', cls: 'B', name: 'Impôt plancher sur les fortunes de plus de 100 M€ (« Zucman »)', kind: 'revenue', points: { 2027: 15 },
        detail: 'Impôt minimal de 2 % visant environ 1 800 foyers.', flag: 'Rendement contesté : 15 à 20 Md€ selon ses promoteurs, environ 5 Md€ selon les travaux cités par ses opposants ; rejeté par l’Assemblée en octobre 2025 ; risque constitutionnel.' },
      { id: 'ps-digital', cls: 'B', name: 'Taxe sur les géants du numérique', kind: 'revenue', points: { 2027: 10 }, detail: 'Taxation renforcée des grandes plateformes numériques.', flag: 'Exposée à des représailles commerciales américaines ; assiette mobile.' },
      { id: 'ps-inherit', cls: 'A', name: 'CSG sur les très gros héritages', kind: 'revenue', points: { 2027: 10 }, detail: 'CSG calculée sur le total reçu par chaque héritier au cours de sa vie, au-delà d’un seuil élevé.', flag: 'Impôt national sur une assiette bien connue.' },
      { id: 'ps-otherrev', cls: 'D', name: 'Autres recettes nouvelles (non détaillées dans la presse)', kind: 'revenue', points: { 2027: 4.5 }, detail: 'Solde des 39,5 Md€ de recettes nouvelles.', flag: 'Non détaillé dans la couverture de presse consultée.' },
      { id: 'ps-fraud', cls: 'B', name: 'Meilleure détection de la fraude', kind: 'revenue', points: { 2027: 5.5 }, detail: 'Moyens contre la fraude.', flag: 'Le rendement du recouvrement est historiquement incertain.' },
      { id: 'ps-niches', cls: 'B', name: 'Réforme des niches fiscales et économies', kind: 'mixed', points: { 2027: 12 }, detail: 'Réduction de dépenses fiscales et autres économies.', flag: 'Les niches visées ne sont pas toutes précisées.' },
      { id: 'ps-csg', name: 'CSG progressive (baisse pour les revenus modestes et moyens)', kind: 'revenue', cost: true, points: { 2027: -10 }, detail: 'Taux de CSG au niveau du SMIC ramené de 9,2 % à moins de 1 %.', flag: 'Chiffre du parti : 10 Md€ de moins pour la Sécurité sociale.' },
      { id: 'ps-spend', name: 'Dépenses nouvelles', kind: 'spending', cost: true, points: { 2027: -22 },
        detail: 'Conférence sociale et salaires (10 Md€), santé (5 Md€ dont une mutuelle publique gratuite pour les 18-25 ans), fonds de sécurité climatique (5 Md€), école (2 Md€), violences faites aux femmes (3 Md€), fonds vert des collectivités, sécurité civile.', flag: 'Les postes détaillés dépassent légèrement 22 Md€.' },
      { id: 'ps-pension', name: 'Abrogation de la réforme des retraites de 2023 (62 ans)', kind: 'spending', cost: true, points: { 2028: -5, 2032: -12.8 },
        detail: 'Au programme de Raphaël Glucksmann, pas dans le contre-budget.', flag: 'Coût repris de l’estimation de France Budget pour un retour à 62 ans (12,8 Md€ en 2032).' },
    ],
    reviews: [],
    reviewDefault: 'standard',
    external: [
      { label: 'Simulateur France Budget', deficit: { 2027: 6.0, 2028: 5.3, 2029: 5.5, 2030: 5.7 }, debt: { 2027: 121, 2028: 122, 2029: 124, 2030: 126 }, src: 'psFB' },
    ],
    measuresNote: 'Les montants du contre-budget sont annuels dès 2027 et maintenus ensuite ; l’abrogation de la réforme des retraites monte en charge jusqu’en 2032. France Budget modélise le projet de Raphaël Glucksmann (SMIC, retraites, impôt sur la fortune, point d’indice) plutôt que ce contre-budget.',
    measuresSrc: ['psInvestir', 'psSelectra', 'psPP'],
    src: ['psInvestir', 'psSelectra', 'psPP', 'ifrapComp', 'psFB'],
  },
}

// ---------- Barème commun ----------
// Une même décote appliquée aux gains de tous les partis, selon le type de mesure ; les coûts comptent toujours en entier.
export const RULE = {
  A: { share: 0.8, label: 'Documentée', note: 'chiffrée et juridiquement simple : une économie identifiée, un impôt sur une assiette connue' },
  B: { share: 0.4, label: 'Rendement incertain', note: 'gains d’efficacité, lutte contre la fraude, assiettes nouvelles ou mobiles, coupes non encore détaillées ligne à ligne' },
  C: { share: 0.2, label: 'Juridiquement fragile', note: 'suppose l’UE, une révision constitutionnelle ou une coordination internationale, ou n’économise rien pour l’ensemble des APU' },
  D: { share: 0, label: 'Non détaillée', note: 'totaux annoncés sans mesure derrière, effets retour de la croissance' },
}
export const STANDARD = { id: 'standard', label: 'Barème commun', by: 'barème commun' }
export const reviewsOf = party => [...party.reviews, STANDARD]
export const KIND = { spending: 'dépense', revenue: 'recette', mixed: 'mixte' }

// De gauche à droite.
export const ORDER = ['lfi', 'ps', 're', 'hor', 'lr', 'rn']

// Coefficient de crédibilité par mesure pour une analyse donnée : barème commun, coefficients explicites coûts/gains,
// ou (RN) un gain net 2031 reproduit par une décote uniforme des gains, les coûts comptant en entier.
export function reviewCredibility(party, reviewId) {
  if (reviewId === 'standard' || !party.reviews.length) return Object.fromEntries(party.measures.map(m => [m.id, m.cost ? 1 : RULE[m.cls]?.share ?? 1]))
  const r = party.reviews.find(x => x.id === reviewId) || party.reviews[0]
  if (r.costs != null) return Object.fromEntries(party.measures.map(m => [m.id, r.overrides?.[m.id] ?? (m.cost ? r.costs : r.gains)]))
  const at = m => m.points[2031] ?? Object.values(m.points).at(-1)
  const gains = party.measures.filter(m => !m.cost).reduce((s, m) => s + at(m), 0)
  const costs = party.measures.filter(m => m.cost).reduce((s, m) => s + at(m), 0)
  const k = Math.max(0, (r.net2031 - costs) / gains)
  return Object.fromEntries(party.measures.map(m => [m.id, m.cost ? 1 : k]))
}

// Lignes « implicites » : l'effort non détaillé qu'un parti doit encore fournir pour tenir son propre objectif,
// résolu avec la croissance du consensus et un démarrage mi-2027, construit linéairement depuis 2027.
for (const party of Object.values(parties)) {
  for (const m of party.measures.filter(x => x.implied)) {
    const { year, deficitPct } = m.implied
    m.points = { 2027: 0, [year]: 0 }
    for (let k = 0; k < 8; k++) {
      const row = project(baseline, { measures: party.measures, firstYearShare: FIRST_YEAR_SHARE }).find(r => r.year === year)
      m.points[year] += (row.deficitPct - deficitPct) / 100 * row.gdp
    }
    m.points[year] = Math.round(m.points[year] * 10) / 10
  }
}
