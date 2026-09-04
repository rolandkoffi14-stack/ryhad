# Dossier d'Architecture Technique & Guide de Déploiement

> **Projet** : RyHaD Tic-Medic (Cotonou, Bénin)  
> **Version** : 1.0.0 (Production-Ready)  
> **Type d'application** : Monolithe Full-Stack Next.js 15 (Site Vitrine Public + CRM de Gestion d'Atelier)  
> **Auteur / Référent Technique** : Équipe Technique & Architecture Logicielle

---

## Table des Matières

1. [Vue d'Ensemble & Périmètre Fonctionnel](#1-vue-densemble--périmètre-fonctionnel)
2. [Stack Technologique & Dépendances](#2-stack-technologique--dépendances)
3. [Architecture Applicative & Organisation du Code](#3-architecture-applicative--organisation-du-code)
4. [Modèle de Données & Base PostgreSQL](#4-modèle-de-données--base-postgresql)
5. [Modules Critiques & Contraintes d'Infrastructure](#5-modules-critiques--contraintes-dinfrastructure)
   - [5.1 Le Flux Temps Réel SSE & EventBus Mémoire](#51-le-flux-temps-réel-sse--eventbus-mémoire)
   - [5.2 Les Notifications Web Push & Service Worker PWA](#52-les-notifications-web-push--service-worker-pwa)
   - [5.3 Authentification & Sécurité RBAC](#53-authentification--sécurité-rbac)
   - [5.4 Génération Dynamique des Documents PDF](#54-génération-dynamique-des-documents-pdf)
   - [5.5 Stockage des Fichiers & Photos de Pannes](#55-stockage-des-fichiers--photos-de-pannes)
6. [Étude Comparative des Choix d'Hébergement](#6-étude-comparative-des-choix-dhébergement)
7. [Guide de Déploiement Recommandé sur VPS (Pas-à-Pas)](#7-guide-de-déploiement-recommandé-sur-vps-pas-à-pas)
8. [Variables d'Environnement & Sécurité](#8-variables-denvironnement--sécurité)
9. [Stratégie de Sauvegarde & Maintenance](#9-stratégie-de-sauvegarde--maintenance)

---

## 1. Vue d'Ensemble & Périmètre Fonctionnel

L'application **RyHaD Tic-Medic** unifie la présence en ligne et la gestion opérationnelle de l'atelier de maintenance informatique, biomédicale et audiovisuelle basé à Cotonou (Gbégamey).

### Les Deux Grands Espaces :
1. **Le Site Vitrine Public (`app/(public)`)** :
   - Présentation multimarque des expertises techniques (PC, TV, Vidéoprojecteurs, Biomédical, Topographie, Réseaux, Vidéosurveillance).
   - Formulaire de demande d'intervention avec téléversement de photos (`/demande-intervention`).
   - Formulaire de demande commerciale pour vente/location de matériel (`/devis`).
   - Portail de suivi de réparation en direct pour les clients (`/suivi/[numero]`) avec déverrouillage sécurisé par les 4 derniers chiffres du téléphone pour valider/refuser un devis en ligne.

2. **Le CRM Métier Interne (`app/crm`)** :
   - Gestion des **Tickets Ponctuels** (dépôt atelier avec encaissement obligatoire des frais de diagnostic, émission de devis, validation, réparation et clôture).
   - Gestion des **Interventions Sous Contrat** (visites préventives/curatives pour entreprises et cliniques avec facturation périodique et devis optionnel pour pièces détachées).
   - Gestion des **Demandes Commerciales** (vente, location de vidéoprojecteurs, formation).
   - Module de **Devis & Factures** avec numérotation officielle conforme (`FAC-YYYYMM-XXXX`, `DEV-YYYYMM-XXXX`, `FAC-PER-YYYYMM-XXXX`).
   - Gestion des **Clients**, des **Contrats** et de l'**Équipe Technique** (affectation des dossiers, charge de travail).
   - Tableau de bord en temps réel et cloche de notifications push.

---

## 2. Stack Technologique & Dépendances

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 15 (App Router)                         │
│                                                                        │
│  [ React 19 Server Components ]       [ Route Handlers (API REST) ]    │
│  [ Tailwind CSS + Montserrat ]        [ NextAuth.js v5 (JWT & RBAC)]   │
│  [ Realtime SSE Stream (/api/crm) ]   [ Web Push (Service Worker) ]    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         [ Prisma ORM v6 ]
                                    │
                       [ Base de Données PostgreSQL ]
```

| Composant | Technologie | Version | Rôle & Justification |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js** (App Router) | `15.x` | Architecture hybride Server Components + API Route Handlers. |
| **Langage** | **TypeScript** | `5.x` | Typage strict de bout en bout (modèles, formulaires, routes). |
| **Bibliothèque UI** | **React** | `19.x` | Rendu optimisé, Server Actions, hooks modernes (`useActionState`, etc.). |
| **Base de Données** | **PostgreSQL** | `15+ / 16+` | ACID, relations complexes, haute fiabilité transactionnelle. |
| **ORM** | **Prisma ORM** | `6.x` | Client typé, migrations versionnées, générateur de schéma. |
| **Authentification** | **NextAuth.js (Auth.js)** | `5.x beta` | Sessions chiffrées par JWT, cookies `HttpOnly`, hachage `bcryptjs`. |
| **Temps Réel** | **Server-Sent Events (SSE)** | Natif W3C | Flux unidirectionnel serveur-vers-client sur HTTP via `ReadableStream`. |
| **Push Mobile/PC** | **Web Push + Service Worker** | `web-push` | Notifications push système conformes aux standards VAPID / PWA. |
| **Documents PDF** | **Génération PDF Serveur** | Moteur PDF | Compilation de devis/factures téléchargeables en flux binaire. |
| **Styling** | **Tailwind CSS** | `3.4+` | Design system unifié (police unique **Montserrat**, règle 60-30-10). |

---

## 3. Architecture Applicative & Organisation du Code

L'arborescence suit scrupuleusement les conventions Next.js App Router :

```text
ryhad/
├── app/
│   ├── (public)/                 # Routes du site vitrine public
│   │   ├── a-propos/
│   │   ├── contact/
│   │   ├── demande-intervention/ # Formulaire public de dépôt/dépannage
│   │   ├── devis/                # Formulaire public de demande commerciale
│   │   ├── faq/
│   │   ├── services/
│   │   ├── suivi/                # Interface client de suivi de dossier
│   │   └── page.tsx              # Page d'accueil vitrine
│   ├── api/                      # Backend API REST
│   │   ├── auth/                 # Endpoints NextAuth & réinitialisation MDP
│   │   ├── crm/
│   │   │   ├── clients/          # CRUD Clients
│   │   │   ├── contrats/         # CRUD Contrats
│   │   │   ├── demandes-commerciales/ # CRUD Devis vente/location
│   │   │   ├── documents/        # Génération & encaissement factures/devis
│   │   │   ├── notifications/    # Gestion des notifications in-app
│   │   │   ├── realtime/         # Endpoint SSE Streaming (/api/crm/realtime)
│   │   │   ├── tickets/          # Machine à états des interventions
│   │   │   └── utilisateurs/     # Gestion RBAC des comptes staff
│   │   ├── documents/[numero]/pdf# Endpoint de téléchargement PDF officiel
│   │   ├── push/subscribe/       # Enregistrement des abonnements Web Push
│   │   ├── suivi/                # API publique de suivi & décision devis
│   │   └── upload/               # Téléversement de pièces jointes
│   ├── crm/                      # Interface d'administration CRM
│   │   ├── clients/
│   │   ├── contrats/
│   │   ├── demandes-commerciales/
│   │   ├── documents/
│   │   ├── techniciens/
│   │   ├── tickets/
│   │   │   ├── ponctuel/         # Parcours 1 : Dépôts atelier
│   │   │   ├── contractuel/      # Parcours 2 : Visites sous contrat
│   │   │   └── [id]/             # Fiche détaillée & workflow d'intervention
│   │   ├── utilisateurs/
│   │   └── page.tsx              # Tableau de bord principal
│   ├── globals.css               # Variables de design system & utilitaires
│   └── layout.tsx                # Root layout (Police Montserrat & métadonnées)
├── components/
│   ├── crm/                      # Composants exclusifs CRM (Tables, Badges, Modales)
│   ├── layout/                   # Headers, Footers, Sidebar CRM
│   ├── pwa/                      # Bouton installation PWA & Gestionnaire Push
│   └── site/                     # Formulaires publics et Tracker
├── lib/
│   ├── auth.ts                   # Configuration NextAuth, handlers et helpers session
│   ├── db.ts                     # Instance globale PrismaClient (Singleton)
│   ├── format.ts                 # Formatage monétaire (FCFA) et dates (fr-FR)
│   ├── interventions/            # Machine à états et transitions autorisées
│   └── realtime/                 # Bus d'événements Node.js (eventBus.ts)
├── prisma/
│   ├── schema.prisma             # Modèle de données complet
│   └── seed.ts                   # Initialisation des comptes staff par défaut
├── public/
│   ├── images/                   # Assets statiques (logo, hero)
│   ├── sw.js                     # Service Worker PWA & Web Push
│   └── manifest.webmanifest      # Manifest PWA (icônes, standalone, thème)
└── tailwind.config.ts            # Configuration des tokens de couleur et typographie
```

---

## 4. Modèle de Données & Base PostgreSQL

Le schéma Prisma (`prisma/schema.prisma`) structure les entités métier :

```mermaid
erDiagram
    User ||--o{ Intervention : "technicienAssigne"
    User ||--o{ Notification : "destinataire"
    User ||--o{ PushSubscription : "abonnements"
    Client ||--o{ Intervention : "possede"
    Client ||--o{ Contract : "souscrit"
    Client ||--o{ DemandeCommerciale : "emet"
    Contract ||--o{ Intervention : "couvre"
    Contract ||--o{ FinancialDocument : "factures_periodiques"
    Intervention ||--o{ PieceUtilisee : "consomme"
    Intervention ||--o{ InterventionHistorique : "trace"
    Intervention ||--o{ FinancialDocument : "devis_et_factures"
    DemandeCommerciale ||--o{ FinancialDocument : "devis_et_factures"
```

### Entités Clés :
- **`Intervention`** : Coeur du système. Porte le statut (`NOUVEAU`, `FRAIS_DIAGNOSTIC_ENCAISSE`, `EN_DIAGNOSTIC`, `DIAGNOSTIC_TERMINE`, `DEVIS_ENVOYE`, `DEVIS_ACCEPTE`, `DEVIS_REFUSE`, `EN_REPARATION`, `TERMINE`, `LIVRE_CLOTURE`), le type (`PONCTUEL` ou `CONTRACTUEL`), le diagnostic technicien, le montant de main-d'œuvre et le technicien assigné.
- **`FinancialDocument`** : Gère la facturation légale (`DEVIS`, `FACTURE`, `FACTURE_PERIODIQUE`, `RECU_DIAGNOSTIC`). Porte le `statutPaiement` (`EN_ATTENTE`, `PARTIEL`, `PAYE`, `ANNULE`), le mode de règlement (`ESPECES`, `MTN_MOMO`, `MOOV_MONEY`, `CARTE_BANCAIRE`, `VIREMENT`, `CHEQUE`) et la référence de transaction.
- **`DemandeCommerciale`** : Modèle séparé pour la vente, la location de vidéoprojecteurs et les formations, évitant de polluer la machine à états des réparations techniques.
- **`Contract`** : Gère les abonnements d'entreprises (périodicité, équipements couverts, date de renouvellement).

---

## 5. Modules Critiques & Contraintes d'Infrastructure

### 5.1 Le Flux Temps Réel SSE & EventBus Mémoire
* **Composants** : [`app/api/crm/realtime/route.ts`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/app/api/crm/realtime/route.ts) + [`lib/realtime/eventBus.ts`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/lib/realtime/eventBus.ts)
* **Mécanisme** :
  1. Chaque client connecté au CRM ouvre un flux `EventSource('/api/crm/realtime')`.
  2. Lorsqu'une mutation a lieu (nouveau dépôt web, encaissement, changement de statut), `emitCrmEvent()` diffuse l'événement aux abonnés.
  3. L'interface CRM se synchronise instantanément via `router.refresh()` sans rechargement de page.
* **Implication Serveur** :
  - Le serveur web (ex: Nginx) **ne doit pas couper les connexions HTTP ouvertes** (timeout supérieur à 1h recommandé).
  - Le buffer de proxying doit être désactivé (`proxy_buffering off;`).
  - L'`eventBus` étant en mémoire Node.js, une architecture mono-instance (VPS ou conteneur unique) fonctionne nativement.

### 5.2 Les Notifications Web Push & Service Worker PWA
* **Composants** : [`public/sw.js`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/public/sw.js) + [`app/api/push/subscribe/route.ts`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/app/api/push/subscribe/route.ts)
* **Mécanisme** :
  - Les techniciens et la réception peuvent s'abonner aux notifications push depuis leur navigateur (PC ou Android/iOS).
  - Le serveur envoie les payloads chiffrés via le protocole VAPID (`web-push`).
  - Le Service Worker intercepte les messages en arrière-plan, même si le site est fermé, et affiche une notification système cliquable.
* **Implication Serveur** :
  - **HTTPS / SSL strict obligatoire** (les Service Workers et la Push API sont bloqués par les navigateurs en HTTP non sécurisé).
  - Deux variables d'environnement indispensables : `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`.

### 5.3 Authentification & Sécurité RBAC
* **Composant** : [`lib/auth.ts`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/lib/auth.ts) + [`middleware.ts`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/middleware.ts)
* **Mécanisme** :
  - Tokens JWT signés stockés dans un cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
  - Contrôle d'accès basé sur les rôles (`ADMIN`, `RECEPTIONNISTE`, `TECHNICIEN`) appliqué à la fois dans le middleware de routage et dans chaque Route Handler API.
* **Implication Serveur** :
  - Nécessite la variable `NEXTAUTH_SECRET` pour la signature des sessions.

### 5.4 Génération Dynamique des Documents PDF
* **Composant** : [`app/api/documents/[numero]/pdf/route.ts`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/app/api/documents/[numero]/pdf/route.ts)
* **Mécanisme** :
  - Génération à la volée du flux binaire PDF lors de la consultation ou du téléchargement.
* **Implication Serveur** :
  - Nécessite un environnement Node.js capable d'allouer de la mémoire temporaire pour le rendu des documents.

### 5.5 Stockage des Fichiers & Photos de Pannes
* **Composant** : [`app/api/upload/route.ts`](file:///c:/Users/cpted/Downloads/Africa%20Vibe%20Coding/projet%20ryhad/ryhad/app/api/upload/route.ts)
* **Mécanisme** :
  - Enregistrement des photos d'appareils et plaques signalétiques envoyées par les clients lors de la demande d'intervention.
* **Implication Serveur** :
  - Sur VPS : stockage direct dans un répertoire persistant (`/public/uploads` ou dossier monté).
  - Sur Cloud/Serverless : nécessiterait un bucket de stockage externe (ex: Cloudflare R2 ou AWS S3).

---

## 6. Étude Comparative des Choix d'Hébergement

| Critère | VPS Linux (Hetzner, OVH, DigitalOcean) 🌟 | Serverless (Vercel, AWS Lambda) ⚠️ | Hébergement Mutualisé (cPanel standard) ❌ |
| :--- | :--- | :--- | :--- |
| **Compatibilité SSE (Temps réel)** | **100% Native** (Connexions permanentes illimitées). | **Limitée** (Timeouts 15s à 60s, reconnexions incessantes). | **Incompatible** (Processus tués par le serveur). |
| **EventBus (Bus d'événements)** | **100% Fonctionnel** en mémoire sans coût supplémentaire. | **Perdu** (Nécessite d'ajouter et payer un Redis Pub/Sub externe). | **Incompatible**. |
| **Base de Données PostgreSQL** | Installable directement sur le VPS ou managée. | Obligation d'utiliser une base externe payante (Neon, Supabase). | Rarement proposé ou versions PostgreSQL obsolètes. |
| **Stockage Fichiers / Uploads** | Stockage sur disque SSD local persistant inclus. | Fichiers éphémères (Obligation d'ajouter un Bucket S3/R2). | Stockage local mais bridé. |
| **Coût Mensuel Estimé** | **4 € à 10 € / mois** tout compris. | Gratuit au départ puis **20 $ à 50 $ / mois** avec les add-ons (DB, Redis, S3). | 3 € à 6 € / mois (mais l'application ne fonctionnera pas). |
| **Contrôle & Souveraineté** | Total (Accès Root, Docker, Sauvegardes locales). | Dépendant de la plateforme propriétaire. | Très restreint. |
| **Verdict Technique** | **RECOMMANDATION ABSOLUE (10/10)** | **Complexe et surdimensionné financièrement** | **TOTALEMENT PROSCRIT** |

---

## 7. Guide de Déploiement Recommandé sur VPS (Pas-à-Pas)

### 7.1 Spécifications Minimales du Serveur Recommandé
- **OS** : Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS
- **CPU** : 2 vCPU
- **RAM** : 4 Go (minimum 2 Go + Swap de 2 Go)
- **Stockage** : 40 Go SSD / NVMe
- **Exemples d'offres** : Hetzner Cloud CX22 (~4 €/mois), OVH Starter (~6 €/mois), Contabo Cloud VPS S (~5 €/mois).

---

### 7.2 Étape 1 : Préparation du Serveur Linux
Connectez-vous en SSH à votre serveur :

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des paquets essentiels
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Installation de Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de PM2 (Gestionnaire de processus en arrière-plan)
sudo npm install -g pm2
```

---

### 7.3 Étape 2 : Installation & Configuration de PostgreSQL

```bash
# Installation de PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Création de la base de données et de l'utilisateur dédié
sudo -u postgres psql <<EOF
CREATE DATABASE ryhad_db;
CREATE USER ryhad_user WITH ENCRYPTED PASSWORD 'VOTRE_MOT_DE_PASSE_SECURISE';
GRANT ALL PRIVILEGES ON DATABASE ryhad_db TO ryhad_user;
ALTER DATABASE ryhad_db OWNER TO ryhad_user;
\q
EOF
```

---

### 7.4 Étape 3 : Déploiement du Code & Initialisation de l'Application

```bash
# Cloner le dépôt dans /var/www
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/rolandkoffi14-stack/ryhad.git
cd ryhad

# Installer les dépendances
npm install

# Créer le fichier .env de production
cp .env.example .env.production
nano .env.production
```

Renseignez vos variables de production dans `.env.production` (voir section 8).

```bash
# Générer le client Prisma et appliquer les migrations sur la base PostgreSQL
npx prisma generate
npx prisma migrate deploy

# Initialiser les comptes staff par défaut (si nécessaire)
npx prisma db seed

# Compiler le projet Next.js pour la production
npm run build
```

---

### 7.5 Étape 4 : Lancement avec PM2 (Démarrage Automatique)

```bash
# Lancer l'application en mode cluster / production
pm2 start npm --name "ryhad-app" -- start

# Configurer le redémarrage automatique en cas de reboot du serveur
pm2 save
pm2 startup
```

---

### 7.6 Étape 5 : Configuration de Nginx (Reverse Proxy avec support SSE)

Créez le fichier de configuration Nginx :

```bash
sudo nano /etc/nginx/sites-available/ryhad.bj
```

Collez la configuration optimisée suivante :

```nginx
server {
    listen 80;
    server_name ryhad.bj www.ryhad.bj;

    # Taille maximale des photos uploadées (15 Mo)
    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Configuration spécifique critique pour le streaming temps réel SSE
    location /api/crm/realtime {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Désactivation du buffering Nginx pour transmission immédiate des événements
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        
        # Timeout étendu pour maintenir la connexion ouverte
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Activez le site et testez la configuration :

```bash
sudo ln -s /etc/nginx/sites-available/ryhad.bj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 7.7 Étape 6 : Activation du Certificat SSL Gratuit (HTTPS)

```bash
# Générer le certificat SSL Let's Encrypt automatique
sudo certbot --nginx -d ryhad.bj -d www.ryhad.bj
```

*Certbot configurera automatiquement le renouvellement automatique et forcera la redirection de HTTP vers HTTPS.*

---

## 8. Variables d'Environnement & Sécurité

Voici le modèle de configuration pour le fichier `.env` de production :

```env
# ==============================================================================
# BASE DE DONNÉES POSTGRESQL
# ==============================================================================
DATABASE_URL="postgresql://ryhad_user:VOTRE_MOT_DE_PASSE_SECURISE@localhost:5432/ryhad_db?schema=public"

# ==============================================================================
# AUTHENTIFICATION & SÉCURITÉ (NEXTAUTH.JS)
# ==============================================================================
# Générer une clé aléatoire via : openssl rand -base64 32
NEXTAUTH_SECRET="votre_cle_secrete_aleatoire_tres_longue"
NEXTAUTH_URL="https://ryhad.bj"

# ==============================================================================
# NOTIFICATIONS WEB PUSH & VAPID (PWA)
# ==============================================================================
# Générer vos clés VAPID via : npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY="VOTRE_CLE_VAPID_PUBLIQUE"
VAPID_PRIVATE_KEY="VOTRE_CLE_VAPID_PRIVEE"
VAPID_SUBJECT="mailto:ryhadticmedic@gmail.com"

# ==============================================================================
# ENVIRONNEMENT & PERFORMANCES
# ==============================================================================
NODE_ENV="production"
PORT=3000
```

---

## 9. Stratégie de Sauvegarde & Maintenance

### 9.1 Sauvegarde Automatisée Quotidienne de PostgreSQL
Créez un script de sauvegarde automatique :

```bash
sudo nano /usr/local/bin/backup-ryhad.sh
```

Ajoutez le script :

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ryhad"
mkdir -p $BACKUP_DIR
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
FILENAME="$BACKUP_DIR/ryhad_db_$DATE.sql.gz"

# Exécuter le dump compressé
pg_dump -U ryhad_user -h localhost ryhad_db | gzip > $FILENAME

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "Sauvegarde effectuée avec succès : $FILENAME"
```

Rendez le script exécutable et ajoutez-le au `crontab` quotidien :

```bash
sudo chmod +x /usr/local/bin/backup-ryhad.sh

# Ouvrir crontab
sudo crontab -e

# Ajouter la ligne suivante pour exécuter la sauvegarde chaque nuit à 02h00 :
0 2 * * * /usr/local/bin/backup-ryhad.sh >> /var/log/ryhad_backup.log 2>&1
```

---

### 9.2 Procédure de Mise à Jour de l'Application en Production

Lorsqu'une nouvelle version est disponible sur GitHub :

```bash
cd /var/www/ryhad

# 1. Récupérer le nouveau code
git pull origin main

# 2. Installer les éventuelles nouvelles dépendances
npm install

# 3. Appliquer les nouvelles migrations de base de données
npx prisma migrate deploy

# 4. Recompiler l'application
npm run build

# 5. Recharger PM2 sans coupure de service
pm2 reload ryhad-app
```

---

## Conclusion & Synthèse pour le Développeur

En choisissant un **VPS Linux standard (Node.js + PostgreSQL + Nginx)** :
1. **Zéro friction technique** : Le temps réel SSE, l'EventBus mémoire, les notifications push et la génération PDF fonctionnent nativement sans aucune configuration externe coûteuse.
2. **Coût fixe minimal** : Entre **4 € et 10 € / mois** pour l'ensemble du système.
3. **Pérennité & Autonomie** : L'entreprise conserve 100% de la maîtrise de ses données clients et de son infrastructure.
