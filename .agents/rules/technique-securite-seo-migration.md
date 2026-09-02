# Exigences Techniques, Sécurité, SEO & Migration

## 6. Exigences Techniques

Cohérentes avec le choix déjà motivé dans le cahier des charges (section 6.1-6.2) : réutilisation directe des patterns d'authentification et des habitudes Prisma développées pour le projet TechPhone229, plutôt que d'optimiser chaque projet isolément.

- **Frontend + Backend unifiés** : Next.js 15 (App Router, TypeScript) — un seul monolithe pour le site vitrine et le CRM.
- **Base de données** : PostgreSQL (Neon) + Prisma ORM (schéma dans `prisma/schema.prisma`).
- **Authentification** : Auth.js (NextAuth v5), sessions en base, rôles Réceptionniste/Technicien/Admin (voir règle `parcours-et-rbac.md`).
- **Validation** : Zod sur chaque formulaire et route serveur, côté client et serveur.
- **Génération PDF** : `@react-pdf/renderer`.
- **Email transactionnel** : Resend (notification nouvelle demande, confirmation client, notification devis/facture disponible).
- **Stockage fichiers** (photos de panne, pièces jointes) : Cloudflare R2.
- **Hébergement** : Vercel (app) + Neon (base) — palier gratuit suffisant en MVP, cohérent avec le budget TPE mentionné dans les contraintes non-fonctionnelles.
- **Responsive** : obligatoire, usage mobile fréquent par les techniciens sur le terrain (contrainte explicite du cahier des charges, section 7).
- **UI/UX** : Design System (section 1 de `GEMINI.md`), gouverné en partie par le skill `ui-ux-pro-max` pour les écrans CRM.

---

## 7. Fondations de sécurité

- Hash Argon2id pour tous les mots de passe, sessions en base révocables.
- RBAC vérifié côté serveur sur chaque route CRM et chaque route API — jamais de confiance dans un rôle transmis côté client.
- Validation Zod systématique, y compris sur le formulaire public de demande d'intervention (surface exposée sans authentification, donc la plus exposée aux abus).
- Rate limiting sur le formulaire public de demande d'intervention et sur la connexion CRM, pour éviter le spam de tickets et le brute-force de mots de passe.
- Upload de fichiers (photos de panne, pièces jointes) : validation stricte du type MIME réel et de la taille, stockage hors dossier public direct.
- Journalisation : `HistoriqueTicket` couvre déjà les actions sur les tickets ; ajouter un journal équivalent pour les actions sensibles hors ticket (création/désactivation d'utilisateur, modification de contrat) — cohérent avec l'exigence "sécurité des données clients" du cahier des charges (section 7).
- Sauvegardes régulières de la base (exigence explicite du cahier des charges, section 7) — configurer les sauvegardes automatiques Neon dès la mise en production, pas en fin de projet.
- Secrets en variables d'environnement uniquement, jamais commités.
- HTTPS partout.

---

## 8. Stratégie SEO (site vitrine)

- Metadata unique par page (title 50-60 caractères, description 140-160 caractères), ciblant "maintenance informatique Cotonou", "maintenance biomédicale Bénin", "réparation vidéoprojecteur Cotonou" selon la page.
- JSON-LD `LocalBusiness` (NAP exact de la fiche d'identité) sur le layout global.
- `sitemap.xml` couvrant les pages statiques du site vitrine (le CRM, privé, n'est jamais indexé — `noindex` explicite sur tout `/crm`).
- Fil d'Ariane et maillage interne entre Services, Contact et le formulaire de demande d'intervention.
- `alt` descriptif sur chaque image (matériel, techniciens en intervention).

---

## 9. Migration depuis le site existant (www.ryhad.bj)

Ce projet remplace un site déjà en ligne — traiter comme une refonte, pas une création :
- Avant mise en production, vérifier si le site actuel est indexé par Google et sur quelles URLs (Search Console si accès disponible), pour mettre en place des redirections 301 si la structure d'URL change.
- Conserver exactement le NAP (Nom, Adresse, Téléphone) déjà potentiellement enregistré sur Google Business Profile — toute incohérence entre l'ancien et le nouveau site nuit au SEO local.
- Récupérer, si possible, les avis clients et le contenu existant plutôt que de repartir de zéro sur la crédibilité déjà construite.
