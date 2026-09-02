# Génération de Documents PDF & Numérotation

## 5. Génération de documents PDF & numérotation

- **Quatre types de documents**, cohérents avec le modèle de données :
  1. **Reçu de frais de diagnostic** (`DIAG-`) — encaissé dès le dépôt, avant tout examen ; le ticket ne passe en `EN_DIAGNOSTIC` qu'une fois ce document émis et payé.
  2. **Devis** (`DEV-`) — après diagnostic, détaillant pièces + main d'œuvre (ou pièces seules si `type = CONTRACTUEL`) ; le montant du diagnostic peut être noté comme acompte déjà versé.
  3. **Facture finale** (`FACT-`) — à la validation/livraison, soldant le montant restant.
  4. **Facture périodique de main d'œuvre** (`CTR-`) — générée automatiquement selon la périodicité du `Contract`, indépendamment des tickets ; les pièces utilisées sur une intervention contractuelle génèrent toujours une facture "pièces" séparée (`FACT-`), jamais absorbée dans la facture périodique.
- **Numérotation** : format `PREFIXE-ANNEE-SEQUENCE` (ex. `DEV-2026-0001`), séquence incrémentale par type et par année, générée côté serveur dans une transaction pour éviter toute collision.
- **Génération PDF** : `@react-pdf/renderer` (cohérent avec l'écosystème React/Next.js déjà en place), gabarit unique par type de document reprenant le Design System (section 1), logo et coordonnées de RyHaD Tic-Medic (section 0).
- **Statut de paiement** par document : `PAYE` / `EN_ATTENTE` / `PARTIEL`, modifiable uniquement par RECEPTIONNISTE ou ADMIN.
