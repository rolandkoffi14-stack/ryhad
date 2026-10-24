# 📋 Checklist des Actions Hors-Code — Migration Domaine & Email Officiel
**Projet :** RyHaD Tic-Medic (Cotonou, Bénin)  
**Objectif :** Basculement de l'environnement actuel (`ryhad.2krdigital.online` / `ryhadticmedic@gmail.com`) vers le domaine et l'email professionnels définitifs (`https://www.ryhad.bj`).

---

## 📌 Sommaire des étapes
1. [Zone DNS & Nom de domaine (.bj)](#1-zone-dns--nom-de-domaine-bj)
2. [Configuration Resend & Délivrabilité Email](#2-configuration-resend--délivrabilité-email)
3. [Gestion de la boîte de réception officielle](#3-gestion-de-la-boîte-de-réception-officielle)
4. [Serveur de production (VPS / Coolify / Nginx)](#4-serveur-de-production-vps--coolify--nginx)
5. [Certificat de sécurité SSL / HTTPS](#5-certificat-de-sécurité-ssl--https)
6. [Stockage Cloud & Médias (Cloudflare R2)](#6-stockage-cloud--médias-cloudflare-r2)
7. [Redirections 301 & SEO (Google Search Console)](#7-redirections-301--seo-google-search-console)
8. [Fiche d'établissement Google (Local Business)](#8-fiche-détablissement-google-local-business)

---

## 1. Zone DNS & Nom de domaine (.bj)
À configurer chez le registrar du nom de domaine béninois (Jenysys, AFNIC / NIC.bj, etc.) :

- [ ] **Enregistrement A (Racine) :**  
  Pointe `ryhad.bj` vers l'adresse IP publique de votre serveur VPS.  
  *Type :* `A` | *Nom :* `@` | *Valeur :* `<IP_DU_SERVEUR_VPS>` | *TTL :* `Auto` ou `3600`
- [ ] **Enregistrement CNAME (Sous-domaine www) :**  
  Pointe `www.ryhad.bj` vers `ryhad.bj` (ou un enregistrement A direct vers l'IP).  
  *Type :* `CNAME` | *Nom :* `www` | *Valeur :* `ryhad.bj` | *TTL :* `3600`
- [ ] **Sous-domaine Media (Cloudflare R2) :**  
  Si vous utilisez `media.ryhad.bj` pour héberger les photos d'intervention et reçus.  
  *Type :* `CNAME` | *Nom :* `media` | *Valeur :* `<votre_bucket>.r2.cloudflarestorage.com` (ou assigné automatiquement via Cloudflare Custom Domains).

---

## 2. Configuration Resend & Délivrabilité Email
Les emails transactionnels (devis, factures, notifications de tickets, réinitialisation de mot de passe) transitent via l'API Resend.

- [ ] **Ajouter le domaine dans Resend :**  
  Se rendre sur le tableau de bord [Resend > Domains](https://resend.com/domains) et cliquer sur **Add Domain** (`ryhad.bj` ou `mail.ryhad.bj`).
- [ ] **Ajouter les enregistrements DKIM :**  
  Copier les enregistrements CNAME/TXT fournis par Resend et les coller dans la zone DNS de `ryhad.bj`.
- [ ] **Ajouter l'enregistrement SPF (TXT) :**  
  *Type :* `TXT` | *Nom :* `@` (ou le sous-domaine mail) | *Valeur :* `v=spf1 include:resend.com ~all`
- [ ] **Ajouter l'enregistrement DMARC (TXT) :**  
  Essentiel pour que Gmail et Yahoo ne bloquent pas les emails :  
  *Type :* `TXT` | *Nom :* `_dmarc` | *Valeur :* `v=DMARC1; p=none; rua=mailto:contact@ryhad.bj`
- [ ] **Vérifier le domaine dans Resend :**  
  Attendre la propagation DNS puis cliquer sur **Verify Records** jusqu'à obtenir le statut vert **Verified**.

---

## 3. Gestion de la boîte de réception officielle
Le nouvel email (ex: `contact@ryhad.bj` ou `direction@ryhad.bj`) doit pouvoir **recevoir** des réponses et des demandes directes :

- [ ] **Configurer le service de messagerie d'entreprise :**  
  (Google Workspace, Zoho Mail, Microsoft 365 ou webmail fourni avec l'hébergement).
- [ ] **Ajouter les enregistrements MX :**  
  Ajouter dans la zone DNS du registrar les serveurs MX du fournisseur retenu (ex. MX Google ou Zoho).
- [ ] **Test de réception :**  
  Envoyer un email de test depuis une adresse externe (ex. Gmail) vers l'adresse officielle pour vérifier qu'elle reçoit parfaitement les messages.
- [ ] **Alias / Transferts (Optionnel) :**  
  Si nécessaire, créer un transfert automatique des emails vers `ryhadticmedic@gmail.com` durant la période de transition pour ne rater aucun message.

---

## 4. Serveur de production (VPS / Coolify / Nginx)

- [ ] **Mise à jour des variables d'environnement du serveur :**  
  Dans l'interface Coolify ou dans le fichier `.env` sur le VPS :
  ```env
  NEXT_PUBLIC_APP_URL="https://www.ryhad.bj"
  NEXTAUTH_URL="https://www.ryhad.bj"
  EMAIL_FROM="RyHaD Tic-Medic <contact@ryhad.bj>"
  NOTIFICATION_EMAIL="contact@ryhad.bj"
  VAPID_SUBJECT="mailto:contact@ryhad.bj"
  ```
- [ ] **Configuration Nginx (Proxy Inverse) :**  
  Modifier le bloc de configuration `/etc/nginx/sites-available/ryhad.bj` :
  ```nginx
  server {
      server_name ryhad.bj www.ryhad.bj;

      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```
- [ ] **Redémarrage / Rechargement de l'application :**  
  Reconstruire et relancer le conteneur Coolify/Docker ou redémarrer le processus PM2 :
  ```bash
  npm run build
  pm2 restart ryhad-app
  ```

---

## 5. Certificat de sécurité SSL / HTTPS

- [ ] **Génération du certificat Let's Encrypt :**  
  Sur le serveur VPS, exécuter Certbot pour couvrir à la fois la racine et le www :
  ```bash
  sudo certbot --nginx -d ryhad.bj -d www.ryhad.bj
  ```
- [ ] **Test de renouvellement automatique :**  
  ```bash
  sudo certbot renew --dry-run
  ```
- [ ] **Vérification du cadenas vert :**  
  Ouvrir `https://www.ryhad.bj` dans un navigateur en navigation privée et contrôler que la connexion est sécurisée.

---

## 6. Stockage Cloud & Médias (Cloudflare R2)

- [ ] **Domaine personnalisé R2 :**  
  Dans le tableau de bord Cloudflare R2 > Bucket `ryhad-media` > **Settings** > **Public Access** :
  - Lier le domaine personnalisé `media.ryhad.bj`.
- [ ] **Règles CORS du bucket :**  
  S'assurer que l'origine `https://www.ryhad.bj` est autorisée dans les paramètres CORS de R2 pour le téléversement direct des photos de pannes et documents.

---

## 7. Redirections 301 & SEO (Google Search Console)

- [ ] **Redirection de l'ancien domaine de staging :**  
  Si du trafic arrive encore sur `ryhad.2krdigital.online` ou l'ancienne adresse du site, configurer une redirection permanente HTTP 301 vers `https://www.ryhad.bj`.
- [ ] **Google Search Console :**  
  1. Ajouter la nouvelle propriété `https://www.ryhad.bj` (de préférence via validation DNS TXT).
  2. Soumettre le sitemap : `https://www.ryhad.bj/sitemap.xml`.
  3. Demander une réindexation de la page d'accueil.

---

## 8. Fiche d'établissement Google (Local Business)

- [ ] **Google My Business / Google Maps :**  
  Mettre à jour la fiche Google de RyHaD Tic-Medic à Cotonou (Gbégamey) :
  - Remplacer l'adresse du site web par `https://www.ryhad.bj`.
  - Mettre à jour l'email de contact public si applicable.
  - S'assurer que le numéro de téléphone (+229 01 90 88 13 14) et les horaires d'ouverture (Lun-Ven 9h-20h) sont synchronisés.

---
*Document généré pour l'équipe technique de RyHaD Tic-Medic.*
