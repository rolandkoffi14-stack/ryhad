# Architecture du Projet & Structure des Fichiers

## 4. Architecture

### A. Site vitrine (public)
Accueil → Services (détail par type de matériel + toutes les activités de la fiche d'identité) → Tarifs *(optionnel, "sur devis" par défaut)* → À propos → Contact → Blog/Conseils *(optionnel V1 légère)* → Mentions légales

- **Formulaire de demande d'intervention** (`/demande-intervention`) : nom, téléphone, email, type de matériel (liste complète de `TypeMateriel`), description de la panne, mode souhaité (dépôt atelier / domicile), upload photo optionnel (`PieceJointeType.PHOTO_DEPOT`). À la soumission : création automatique d'une `Intervention` avec `statut = NOUVEAU`, `type` déterminé par la présence ou non d'un contrat actif lié au client (recherché par téléphone/email — si aucun trouvé, `type = PONCTUEL` par défaut), notification email à l'équipe.
- **Formulaire de demande commerciale** (`/devis` ou ancré sur la page Services) : pour vente de matériel, location de vidéoprojecteur, formation — crée une `DemandeCommerciale`, jamais une `Intervention`.
- **Page "Suivre ma demande"** (`/suivi/[numero]`) : saisie du numéro de ticket → affichage du statut traduit en langage client (ex. `EN_DIAGNOSTIC` affiché comme "Diagnostic en cours"), sans authentification, sans exposer de données financières ni les notes internes de `HistoriqueTicket`.

### B. CRM (privé, `/crm`, protégé RBAC)
Tableau de bord (tickets par statut, interventions en retard, CA du mois, derniers tickets) → Clients (fiche, historique, recherche rapide nom/téléphone) → Tickets (deux parcours distincts en interface, un seul modèle en base) → Contrats (fiche contrat, planning des visites préventives avec alertes, génération de la facture périodique) → Devis & Factures (les 4 types de documents, génération PDF, numérotation automatique) → Techniciens (liste, spécialités, vue "mes interventions") → Demandes commerciales (file d'attente vente/location/formation) → Stock *(optionnel MVP)* → Utilisateurs (gestion des comptes et rôles, réservé ADMIN).

### C. Header / Footer partagés (site vitrine uniquement — le CRM a sa propre navigation interne)
- **Header** : logo, navigation, CTA "Demander une intervention", téléphone cliquable.
- **Footer** : coordonnées complètes, liens services, liens utiles (suivi de dossier, FAQ), réseaux sociaux, mentions légales.

---

## 10. Structure de Fichiers

```
app/
  (public)/
    page.jsx                    → Accueil
    services/page.jsx
    tarifs/page.jsx              → optionnel
    a-propos/page.jsx
    contact/page.jsx
    blog/                        → optionnel V1 légère
    demande-intervention/page.jsx
    devis/page.jsx                → demandes commerciales (vente/location/formation)
    suivi/[numero]/page.jsx
    mentions-legales/page.jsx
  crm/
    page.jsx                    → Tableau de bord
    clients/
    tickets/
      ponctuel/                 → formulaire et vue dédiés au parcours ponctuel
      contractuel/              → formulaire et vue dédiés au parcours contractuel
    contrats/
    documents/                   → devis, factures, reçus
    techniciens/
    demandes-commerciales/
    stock/                       → optionnel MVP
    utilisateurs/                → réservé ADMIN
  api/
    auth/[...nextauth]/route.js
    demande-intervention/route.js
    demande-commerciale/route.js
    documents/generate/route.js  → génération PDF + numérotation

lib/
  auth.js
  db.js
  validations/                  → schémas Zod par formulaire
  documents/
    numbering.js                 → séquence par type/année
    pdf-templates/               → un gabarit par DocumentType
  interventions/
    statut-transitions.js        → règles de transition par type

prisma/
  schema.prisma                 → schéma complet de référence
  migrations/

components/
  crm/
    TicketStatusBadge.jsx
    TicketFormPonctuel.jsx
    TicketFormContractuel.jsx
    ContractVisitPlanner.jsx
  site/
    InterventionRequestForm.jsx
    TicketTracker.jsx
```

- **Pas de placeholders.** Chaque page, chaque route API, chaque règle de transition de statut doit être entièrement implémentée et fonctionnelle.
