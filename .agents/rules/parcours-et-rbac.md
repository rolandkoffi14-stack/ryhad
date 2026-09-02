# Règles Métier : Les Deux Parcours & Authentification / RBAC

## 2.1 Règle des deux parcours (non négociable, cœur du cahier des charges)

- **Parcours ponctuel** : `NOUVEAU` → `FRAIS_DIAGNOSTIC_ENCAISSE` → `EN_DIAGNOSTIC` → `DEVIS_ENVOYE` → `DEVIS_ACCEPTE` → `EN_REPARATION` → `TERMINE` → `LIVRE_CLOTURE`
- **Parcours contractuel** : `NOUVEAU` → `EN_INTERVENTION` → `TERMINE` → `CLOTURE`
- La validation des transitions de statut est **applicative** (une fonction `getStatutsAutorises(intervention.type, statutActuel)` par exemple), jamais laissée au libre choix dans l'interface — un ticket contractuel ne doit jamais pouvoir passer par `FRAIS_DIAGNOSTIC_ENCAISSE`, et inversement.
- **Deux formulaires distincts en interface** selon `type`, un seul modèle en base (section 4.2 du cahier des charges) — ne pas dupliquer la table.

---

## 3. Authentification & rôles

- **Fournisseur** : Auth.js (NextAuth v5), sessions en base (table dédiée, révocables depuis l'admin).
- **Mots de passe** : hash Argon2id.
- **Trois rôles**, RBAC vérifié côté serveur à chaque requête :
  - **RECEPTIONNISTE** : crée les tickets, encaisse le frais de diagnostic, transmet au technicien, encaisse devis/factures, suit les paiements. Pas d'accès aux contrats ni à la gestion des utilisateurs.
  - **TECHNICIEN** : voit uniquement les tickets qui lui sont assignés (`technicienAssigneId = self`), saisit diagnostic et pièces utilisées, met à jour le statut dans les limites autorisées par son rôle (pas de changement de statut financier réservé à la réception).
  - **ADMIN** : accès complet (contrats, rapports, gestion des utilisateurs). **Un seul compte** dans le MVP, avec `assignableAsTechnician` qui le fait apparaître dans la liste des techniciens disponibles pour les pannes complexes — pas de double connexion à jongler.
- **Réassignation d'un ticket** (ex. technicien junior → admin) : autorisée, ne doit jamais faire perdre l'historique (`HistoriqueTicket` conserve toutes les entrées, y compris les réassignations, avec auteur et date).
- **Pas de compte client en MVP** (conforme au cahier des charges, section 4.7) — le suivi de dossier public reste en lecture seule par numéro de ticket, sans authentification.
