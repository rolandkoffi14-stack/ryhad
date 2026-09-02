# Site Vitrine + CRM — RyHaD Tic-Medic (Cotonou, Bénin)

## Rôle

Agis comme un Développeur Full-Stack Senior (10+ ans d'expérience), garant de la cohérence entre le site vitrine public et l'outil de gestion interne (CRM). Tu construis les deux briques couplées décrites dans le cahier des charges MVP fourni par le client, pour **RyHaD Tic-Medic**, entreprise de maintenance informatique, biomédicale et audiovisuelle à Cotonou. Rien de ce cahier des charges n'est laissé au hasard : chaque champ, chaque statut, chaque rôle mentionné doit se retrouver dans la construction.

Ce document reprend et complète le cahier des charges original (`cahier-des-charges-mvp-maintenance-info.md`) avec l'identité réelle du client et des décisions d'implémentation précises. En cas de doute entre ce document et le cahier des charges original, **ce document fait foi** — il a été écrit pour lever les ambiguïtés, pas pour les reproduire.

---

## 0. Fiche d'identité (réelle — source de vérité)

- **Nom** : RyHaD Tic-Medic
- **Activités** : maintenance informatique (PC portables et de bureau), maintenance TV, maintenance vidéoprojecteurs, maintenance d'appareils médicaux (biomédical), maintenance des équipements de topographie, maintenance réseaux et systèmes informatiques, installation de caméras de vidéosurveillance, formation, vente de matériel informatique et médical, location et vente de vidéoprojecteurs
- **Adresse** : Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin
- **Téléphone** : +229 01 90 88 13 14
- **Email** : ryhadticmedic@gmail.com
- **Site actuel** : www.ryhad.bj — ce projet est une **refonte**, pas une création ex nihilo (voir note migration dans `.agents/rules/technique-securite-seo-migration.md`)
- **Horaires (confirmées publiquement)** 🔶 : Lundi – Vendredi, 9h – 20h — à reconfirmer avec le client avant publication
- **Cible** : particuliers, entreprises, écoles, administrations, structures de santé

⚠️ **Note sur le périmètre des services** : le cahier des charges MVP original ne couvre explicitement que la maintenance PC/vidéoprojecteur/TV. L'activité réelle de RyHaD Tic-Medic est plus large (biomédical, réseaux, vidéosurveillance, formation, vente, location — section 0 ci-dessus). Le site vitrine doit refléter l'activité réelle complète ; le CRM, lui, doit couvrir toutes les catégories de matériel dans son système de tickets, et distinguer les demandes qui ne sont pas des réparations (vente, location, formation) via un modèle séparé (`DemandeCommerciale`) plutôt que de forcer ces demandes dans la machine à états des tickets de réparation.

---

## 1. Identité visuelle et Design System

### 1.1 Typographie — contrainte fixe, non négociable
**Une seule police sur tout le site : Montserrat.** Hiérarchie uniquement par la graisse et la taille — jamais de deuxième famille de police, même pour les libellés ou les données chiffrées.
- Titres (H1/H2) : Montserrat 700-800
- Sous-titres / labels de section : Montserrat 600
- Corps de texte : Montserrat 400-500
- Chiffres clés / prix : Montserrat 700

### 1.2 Palette (point de départ — voir 1.3 pour la gouvernance)
- Bleu Confiance `#1E4D8B` — couleur de marque principale (CTA, header, liens, éléments interactifs)
- Vert Maintenance `#2CA58D` — accent secondaire (statuts positifs, icônes de service, badges "disponible"/"résolu")
- Gris Ardoise `#F4F6F8` — fonds de section alternés
- Anthracite `#1C222B` — texte, jamais de noir pur
- Blanc `#FFFFFF` — fond principal
- Rouge Urgence `#E2574C` — réservé aux statuts urgents, tickets en retard, erreurs de formulaire — jamais utilisé comme couleur décorative

### 1.3 Gouvernance du Design System — usage du skill `ui-ux-pro-max`
Le skill UI/UX installé globalement (`uipro init --ai antigravity --global`) doit être consulté pour :
- Valider/raffiner la palette de la section 1.2 une fois le rendu Stitch de la page d'accueil accepté par le client — le skill peut proposer des ajustements de contraste, de hiérarchie ou de nuances, **jamais changer Montserrat**.
- Guider les patterns UX des écrans du CRM, qui n'ont pas de maquette Stitch dédiée : listes filtrables, formulaires multi-étapes, tableaux de statuts, composants de tableau de bord — domaines où le skill a une vraie valeur ajoutée par rapport à une simple maquette de page d'accueil.
- Requête type à formuler au skill au moment de construire un écran CRM : secteur "B2B services techniques / SaaS de gestion", stack "Next.js + Tailwind", contrainte "police unique Montserrat déjà fixée, ne pas suggérer d'autre police".

Le Design System final = palette de la section 1.2 (ajustée par le skill si besoin) + Montserrat fixe. Ce Design System, une fois stabilisé après la page d'accueil, s'applique identiquement au site vitrine et au CRM — pas de rupture visuelle entre les deux briques, même si leurs publics diffèrent.

---

## Règles Modulaires & Spécifications Détaillées

Pour garantir une exécution rigoureuse et respecter l'intégrité complète du cahier des charges, consultez les documents spécialisés du projet :

- **Modèle de données & Schéma Prisma** : [`prisma/schema.prisma`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/prisma/schema.prisma)
- **Les Deux Parcours & Authentification / RBAC** : [`.agents/rules/parcours-et-rbac.md`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/.agents/rules/parcours-et-rbac.md)
- **Architecture Applicative & Structure des Fichiers** : [`.agents/rules/architecture-et-structure.md`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/.agents/rules/architecture-et-structure.md)
- **Génération PDF & Numérotation des Documents** : [`.agents/rules/documents-pdf.md`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/.agents/rules/documents-pdf.md)
- **Exigences Techniques, Sécurité, SEO & Migration** : [`.agents/rules/technique-securite-seo-migration.md`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/.agents/rules/technique-securite-seo-migration.md)

---

## 11. Séquence de Construction (phasage)

1. **Phase 1** — Site vitrine + formulaire de demande d'intervention + formulaire de demande commerciale (1-2 semaines).
2. **Phase 2** — CRM : clients, tickets (les deux parcours distincts), techniciens, contrats (2-3 semaines).
3. **Phase 3** — Devis/factures PDF avec numérotation automatique, dashboard (1-2 semaines).
4. **Phase 4** — Tests, corrections, formation de l'équipe, mise en ligne avec redirections depuis l'ancien site (1 semaine).

À chaque phase, vérifier les critères de succès : une demande soumise sur le site crée bien un ticket exploitable ; l'équipe peut suivre chaque intervention de bout en bout sans papier ; un devis se génère en moins de 5 minutes ; le client peut suivre son dossier sans appeler l'atelier.

---

## Directive d'Exécution

"Construis RyHaD Tic-Medic comme un outil que la réceptionniste et les techniciens utiliseront tous les jours, pas comme une démo. Les deux parcours de tickets (ponctuel/contractuel) ne doivent jamais se mélanger dans l'interface, même s'ils partagent un seul modèle en base. Le troisième document financier (facture périodique de contrat) ne doit jamais dépendre d'un ticket. Montserrat partout, aucune exception. Le skill ui-ux-pro-max guide les écrans du CRM une fois la page d'accueil validée, jamais avant. Chaque champ du cahier des charges original doit se retrouver quelque part dans ce document ou avoir une raison explicite d'en être absent."
