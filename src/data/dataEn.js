// Traductions anglaises des libellés de données (data.js, missions et ministères du budget), indexées par le libellé français.
// Les programmes, actions et sous-actions du budget gardent leur intitulé officiel français.
import { isEn } from '../i18n.js'

const DT = {
  // Dette trimestrielle
  'T2 2026': 'Q2 2026', 'T1 2026': 'Q1 2026', 'T4 2025': 'Q4 2025', 'T4 2024': 'Q4 2024',
  // Niveaux d'administration
  'État et organismes centraux': 'State and central bodies', 'Sécurité sociale': 'Social security', 'Collectivités locales': 'Local government',
  'État': 'State', 'Organismes divers (ODAC)': 'State agencies (ODAC)',
  // COFOG
  'Protection sociale': 'Social protection', 'Famille et enfance': 'Family and children', 'Chômage et formation': 'Unemployment and training',
  'Santé': 'Health', 'Services hospitaliers': 'Hospital services', 'Services publics généraux': 'General public services', 'Charge d’intérêts de la dette': 'Interest on debt',
  'Affaires économiques': 'Economic affairs', 'Enseignement': 'Education', 'Défense': 'Defence', 'Défense militaire': 'Military defence',
  'Ordre et sécurité publics': 'Public order and safety', 'Loisirs, culture et culte': 'Recreation, culture and religion',
  'Logement et équipements collectifs': 'Housing and community amenities', 'Protection de l’environnement': 'Environmental protection',
  'Les retraites, premier poste, ont progressé de 23 Md€ (+6,2 %) en 2024.': 'Pensions, the largest item, rose by €23bn (+6.2%) in 2024.',
  'Rémunérations': 'Pay', 'Consommations intermédiaires': 'Intermediate consumption', 'Subventions et transferts': 'Subsidies and transfers', 'Intérêts': 'Interest',
  'Prestations en espèces': 'Cash benefits', 'Prestations en nature': 'In-kind benefits', 'Investissement': 'Investment',
  'Collectivités': 'Local authorities', 'Sécurité sociale ': 'Social security',
  // Financement
  'Remboursement de la dette arrivant à échéance': 'Redemption of maturing debt', 'Déficit de l’État': 'State deficit',
  'Reprise de dette de SNCF Réseau': 'SNCF Réseau debt takeover', 'Autres besoins de trésorerie': 'Other cash needs',
  // AFT
  '8 ans et 158 jours': '8 years 158 days', '30 sept. 2026': '30 Sep 2026', 'oct. 2026': 'Oct 2026', '≈ 56 %': '≈ 56%',
  'réalisé': 'actual', 'programme': 'programme', 'prévision AFT': 'AFT forecast',
  'Moody’s Aa3, perspective négative (10 avr. 2026) ; prochaine revue le 23 oct. 2026.': 'Moody’s Aa3, negative outlook (10 Apr 2026); next review 23 Oct 2026.',
  'Févr. 2026': 'Feb 2026', 'Fin juil. 2026': 'End Jul 2026', 'Début oct. 2026': 'Early Oct 2026', '55 points de base': '55 basis points', '74 points de base': '74 basis points', '> 100 points de base (presse)': '> 100 basis points (press)',
  // Budget : ministères
  'Budget et comptes publics': 'Budget and public accounts', 'Éducation nationale': 'National education', 'Économie, finances et industrie': 'Economy, finance and industry',
  'Armées et anciens combattants': 'Armed forces and veterans', 'Transition écologique, énergie, climat et prévention des risques': 'Ecological transition, energy, climate and risk prevention',
  'Solidarités, autonomie et égalité entre les femmes et les hommes': 'Solidarity, autonomy and equality between women and men', 'Intérieur': 'Interior',
  'Partenariat avec les collectivités territoriales et décentralisation': 'Partnership with local authorities and decentralisation', 'Travail et emploi': 'Labour and employment',
  'Justice': 'Justice', 'Services du Premier ministre': 'Prime Minister’s services', 'Agriculture, souveraineté alimentaire et forêt': 'Agriculture, food sovereignty and forests',
  'Culture': 'Culture', 'Europe et affaires étrangères': 'Europe and foreign affairs', 'Outre-Mer': 'Overseas territories', 'Santé et accès aux soins': 'Health and access to care',
  'Sports, jeunesse et vie associative': 'Sports, youth and community life', 'Fonction publique, simplification et transformation de l’action publique': 'Civil service, simplification and public-sector transformation',
  // Budget : missions
  'Remboursements et dégrèvements': 'Tax refunds and relief',
  'Avances aux collectivités territoriales et aux collectivités régies par les articles 73, 74 et 76 de la Constitution': 'Advances to local authorities (incl. overseas territories under articles 73, 74 and 76 of the Constitution)',
  'Enseignement scolaire': 'School education', 'Pensions': 'Pensions', 'Engagements financiers de l’État': 'State financial commitments',
  'Recherche et enseignement supérieur': 'Research and higher education', 'Solidarité, insertion et égalité des chances': 'Solidarity, inclusion and equal opportunities',
  'Sécurités': 'Security', 'Cohésion des territoires': 'Territorial cohesion', 'Travail, emploi et administration des ministères sociaux': 'Labour, employment and social ministries administration',
  'Écologie, développement et mobilité durables': 'Ecology, sustainable development and mobility', 'Gestion des finances publiques': 'Public finance management',
  'Gestion des finances publiques et lutte contre les fraudes': 'Public finance management and anti-fraud', 'Agriculture et alimentation': 'Agriculture and food',
  'Monde combattant, mémoire et liens avec la Nation': 'Veterans, remembrance and ties with the Nation', 'Avances à l’audiovisuel public': 'Advances to public broadcasting',
  'Accords monétaires internationaux': 'International monetary agreements',
  'Prêts et avances à divers services de l’État ou organismes gérant des services publics': 'Loans and advances to State services and public-service bodies',
  'Participations financières de l’État': 'State financial holdings', 'Régimes sociaux et de retraite': 'Social and pension schemes',
  'Investir pour la France de 2030': 'Investing for France 2030', 'Aide publique au développement': 'Official development assistance',
  'Administration générale et territoriale de l’État': 'General and territorial State administration', 'Agriculture, alimentation, forêt et affaires rurales': 'Agriculture, food, forests and rural affairs',
  'Relations avec les collectivités territoriales': 'Relations with local authorities', 'Audiovisuel public': 'Public broadcasting', 'Économie': 'Economy',
  'Action extérieure de l’État': 'State external action', 'Outre-mer': 'Overseas territories', 'Contrôle et exploitation aériens': 'Air traffic control and operations',
  'Immigration, asile et intégration': 'Immigration, asylum and integration', 'Anciens combattants, mémoire et liens avec la Nation': 'Veterans, remembrance and ties with the Nation',
  'Contrôle de la circulation et du stationnement routiers': 'Road traffic and parking enforcement', 'Sport, jeunesse et vie associative': 'Sport, youth and community life',
  'Pouvoirs publics': 'Constitutional bodies', 'Direction de l’action du Gouvernement': 'Government action coordination', 'Prêts à des États étrangers': 'Loans to foreign States',
  'Conseil et contrôle de l’État': 'State advice and oversight', 'Transformation et fonction publiques': 'Public-sector transformation and civil service',
  'Médias, livre et industries culturelles': 'Media, books and cultural industries', 'Financement des aides aux collectivités pour l’électrification rurale': 'Funding of aid to local authorities for rural electrification',
  'Gestion du patrimoine immobilier de l’État': 'State property management', 'Prêts et avances à des particuliers ou à des organismes privés': 'Loans and advances to individuals and private bodies',
  'Crédits non répartis': 'Unallocated appropriations', 'Plan de relance': 'Recovery plan', 'Publications officielles et information administrative': 'Official publications and administrative information',
  'Développement agricole et rural': 'Agricultural and rural development',
  'Engagements financiers de l’État (dont charge de la dette)': 'State financial commitments (incl. debt service)', 'Solidarité, insertion, égalité': 'Solidarity, inclusion, equality',
  'Écologie, développement durable': 'Ecology, sustainable development', 'Investir pour la France 2030': 'Investing for France 2030', 'Administration générale et territoriale': 'General and territorial administration',
  'Agriculture': 'Agriculture', 'Relations avec les collectivités': 'Relations with local authorities', 'Sport, jeunesse, vie associative': 'Sport, youth, community life', 'Monde combattant': 'Veterans', 'Médias': 'Media',
  // Types de ligne
  'Recettes fiscales': 'Tax revenue', 'Recettes non fiscales': 'Non-tax revenue',
  'Prélèvements sur les recettes de l’État au profit des collectivités territoriales': 'Transfers from State revenue to local authorities', 'Prélèvement sur les recettes de l’État au profit de l’Union européenne': 'Transfer from State revenue to the European Union',
  'budget annexe': 'annex budget', 'compte spécial': 'special account', 'déduit': 'deducted',
}

export const dt = s => (isEn() ? DT[s] ?? s : s)
