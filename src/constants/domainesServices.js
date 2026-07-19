const DOMAINES_SERVICES = {
  'Beauté & Bien-être': [
    'Coiffure', 'Tresses & Nattes', 'Maquillage', 'Onglerie',
    'Extension de cils', 'Massage', 'Soins Visage', 'Soins Corps',
    'Épilation', 'Manucure & Pédicure', 'Barbier', 'Coloration',
    'Défrisage & Lissage', 'Pose de perruque', 'Henné', 'Autre',
  ],
  'Bâtiment & Artisanat': [
    'Plomberie', 'Électricité', 'Maçonnerie', 'Menuiserie Métallique',
    'Menuiserie Bois', 'Plafonnage', 'Peinture Bâtiment', 'Carrelage',
    'Climatisation & Froid', 'Soudure', 'Vitrerie', 'Étanchéité', 'Autre',
  ],
  'Maison & Services domestiques': [
    'Ménage & Nettoyage', 'Blanchisserie', 'Jardinage',
    'Décoration Intérieure', 'Déménagement', 'Réparation Électroménager',
    'Sécurité & Gardiennage', 'Autre',
  ],
  'Mode & Couture': [
    'Couture', 'Stylisme', 'Cordonnerie', 'Autre',
  ],
  'Éducation & Formation': [
    'Cours Particuliers', 'Formation Professionnelle', 'Coaching', 'Autre',
  ],
  'Restauration & Événementiel': [
    'Restauration & Traiteur', 'Pâtisserie', 'Organisation Événementielle',
    'Décoration Événementielle', 'Photographie', 'Autre',
  ],
  'Immobilier & Conseil': [
    'Immobilier', 'Conseil Juridique', 'Comptabilité & Fiscalité', 'Autre',
  ],
  'Transport & Auto': [
    'Mécanique Auto', 'Transport & Chauffeur', 'Lavage Auto', 'Autre',
  ],
  'Tech & Digital': [
    'Réparation Informatique', 'Réparation Téléphone',
    'Développement Web', 'Community Management', 'Autre',
  ],
};

const DOMAINES = Object.keys(DOMAINES_SERVICES);

module.exports = {
  DOMAINES_SERVICES,
  DOMAINES
};
