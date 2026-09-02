const { PrismaClient, StaffRole, ClientType, Periodicite, ContractStatus, InterventionType, TypeMateriel, ModeIntervention, InterventionStatut, TypeDemandeCommerciale, DemandeStatut, DocumentType, FactureType, StatutPaiement } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for RyHaD Tic-Medic on Supabase PostgreSQL...');

  // Nettoyage préalable pour garantir l'idempotence
  await prisma.historiqueTicket.deleteMany({});
  await prisma.pieceUtilisee.deleteMany({});
  await prisma.financialDocument.deleteMany({});
  await prisma.pieceJointe.deleteMany({});
  await prisma.visitePlanifiee.deleteMany({});
  await prisma.intervention.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.demandeCommerciale.deleteMany({});
  await prisma.piece.deleteMany({});
  await prisma.client.deleteMany({});

  // Hash standard
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('AdminRyhad2026!', salt);
  const receptionPass = await bcrypt.hash('ReceptionRyhad2026!', salt);
  const staffPass = await bcrypt.hash('Staff2026!', salt);

  // 1. Comptes Staff
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ryhad.bj' },
    update: { passwordHash: adminPass },
    create: {
      email: 'admin@ryhad.bj',
      passwordHash: adminPass,
      role: StaffRole.ADMIN,
      assignableAsTechnician: true,
      firstName: 'Ryhad',
      lastName: 'Directeur',
      phone: '+229 01 90 88 13 14',
    },
  });

  const receptionUser = await prisma.user.upsert({
    where: { email: 'reception@ryhad.bj' },
    update: { passwordHash: receptionPass },
    create: {
      email: 'reception@ryhad.bj',
      passwordHash: receptionPass,
      role: StaffRole.RECEPTIONNISTE,
      firstName: 'Aïcha',
      lastName: 'Soglo',
      phone: '+229 97 00 11 22',
    },
  });

  const techGenericPass = await bcrypt.hash('TechnicienRyhad2026!', salt);

  const techGeneric = await prisma.user.upsert({
    where: { email: 'technicien@ryhad.bj' },
    update: { passwordHash: techGenericPass },
    create: {
      email: 'technicien@ryhad.bj',
      passwordHash: techGenericPass,
      role: StaffRole.TECHNICIEN,
      firstName: 'Technicien',
      lastName: 'RyHaD',
      phone: '+229 97 88 99 00',
    },
  });

  const techInfo = await prisma.user.upsert({
    where: { email: 'koffi.tech@ryhad.bj' },
    update: { passwordHash: staffPass },
    create: {
      email: 'koffi.tech@ryhad.bj',
      passwordHash: staffPass,
      role: StaffRole.TECHNICIEN,
      firstName: 'Koffi',
      lastName: 'Mensah',
      phone: '+229 96 33 44 55',
    },
  });

  const techBiomed = await prisma.user.upsert({
    where: { email: 'bonaventure.biomed@ryhad.bj' },
    update: { passwordHash: staffPass },
    create: {
      email: 'bonaventure.biomed@ryhad.bj',
      passwordHash: staffPass,
      role: StaffRole.TECHNICIEN,
      firstName: 'Bonaventure',
      lastName: 'Dossou',
      phone: '+229 95 77 88 99',
    },
  });

  // 2. Clients (Particuliers & Entreprises)
  const clientParticulier = await prisma.client.create({
    data: {
      type: ClientType.PARTICULIER,
      nom: 'Marc Akindélé',
      telephone: '+229 97 12 34 56',
      email: 'marc.akindele@gmail.com',
      adresse: 'Cadjèhoun, Cotonou',
    },
  });

  const clientEntreprisePonctuel = await prisma.client.create({
    data: {
      type: ClientType.ENTREPRISE,
      nom: 'Clinique La Madone',
      contactNom: 'Dr. Florentia Dossou',
      telephone: '+229 21 30 45 67',
      email: 'contact@cliniquelamadone.bj',
      adresse: 'Haie Vive, Cotonou',
    },
  });

  const clientEntrepriseContract = await prisma.client.create({
    data: {
      type: ClientType.ENTREPRISE,
      nom: 'Banque Atlantique Bénin (Agence Gbégamey)',
      contactNom: 'M. Roland Hounkanrin (DSI)',
      telephone: '+229 21 31 10 20',
      email: 'r.hounkanrin@banqueatlantique.bj',
      adresse: 'Avenue Jean-Paul II, Gbégamey, Cotonou',
    },
  });

  // 3. Contrat de maintenance
  const contractBanque = await prisma.contract.create({
    data: {
      clientId: clientEntrepriseContract.id,
      dateDebut: new Date('2026-01-01'),
      periodicite: Periodicite.MENSUEL,
      montantMainOeuvre: 150000,
      equipementsCouverts: 'Parc informatique 25 PC + 3 serveurs + 2 vidéoprojecteurs de réunion',
      statut: ContractStatus.ACTIF,
      visitesPlanifiees: {
        create: [
          { datePrevue: new Date('2026-03-15'), statut: 'PLANIFIEE' },
          { datePrevue: new Date('2026-04-15'), statut: 'PLANIFIEE' },
        ],
      },
    },
  });

  // 4. Tickets Ponctuels
  const ticket1 = await prisma.intervention.create({
    data: {
      numero: 'INT-2026-0001',
      clientId: clientParticulier.id,
      type: InterventionType.PONCTUEL,
      typeMateriel: TypeMateriel.PC_PORTABLE,
      panneDeclaree: 'PC Dell Inspiron ne démarre plus après une surtension. Voyant de charge clignote orange.',
      modeIntervention: ModeIntervention.DEPOT_ATELIER,
      statut: InterventionStatut.EN_DIAGNOSTIC,
      montantDiagnostic: 5000,
      diagnosticTechnicien: 'Circuit d alimentation secondaire défectueux. Condensateur à remplacer.',
      technicienAssigneId: techInfo.id,
      historique: {
        create: [
          { action: 'Ticket créé suite à la réception atelier', auteurId: receptionUser.id },
          { action: 'Frais de diagnostic 5.000 FCFA encaissés (DIAG-2026-0001)', auteurId: receptionUser.id },
          { action: 'Assigné à Koffi Mensah pour diagnostic', auteurId: receptionUser.id },
        ],
      },
      documents: {
        create: [
          {
            numero: 'FAC-2026-0001',
            type: DocumentType.FACTURE,
            typeFacture: FactureType.DIAGNOSTIC,
            montant: 5000,
            statutPaiement: StatutPaiement.PAYE,
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.intervention.create({
    data: {
      numero: 'INT-2026-0002',
      clientId: clientEntreprisePonctuel.id,
      type: InterventionType.PONCTUEL,
      typeMateriel: TypeMateriel.APPAREIL_MEDICAL,
      panneDeclaree: 'Moniteur patient Mindray : affichage instable et perte de signal ECG intermittente.',
      modeIntervention: ModeIntervention.DOMICILE,
      statut: InterventionStatut.TERMINE,
      montantDiagnostic: 15000,
      diagnosticTechnicien: 'Câble principal ECG endommagé et nappe vidéo oxydée. Nettoyage et remplacement câble effectués.',
      technicienAssigneId: techBiomed.id,
      piecesUtilisees: {
        create: [
          { designation: 'Câble ECG blindé Mindray 5 brins', quantite: 1, prixUnitaire: 35000 },
          { designation: 'Spray nettoyant contact électronique pro', quantite: 1, prixUnitaire: 5000 },
        ],
      },
      historique: {
        create: [
          { action: 'Demande urgente reçue pour la clinique', auteurId: receptionUser.id },
          { action: 'Diagnostic validé sur site par Bonaventure Dossou', auteurId: techBiomed.id },
          { action: 'Devis DEV-2026-0001 accepté par le client', auteurId: receptionUser.id },
          { action: 'Intervention terminée avec tests fonctionnels OK', auteurId: techBiomed.id },
        ],
      },
      documents: {
        create: [
          {
            numero: 'DEV-2026-0001',
            type: DocumentType.DEVIS,
            montant: 65000,
            statutPaiement: StatutPaiement.PAYE,
          },
          {
            numero: 'FAC-2026-0002',
            type: DocumentType.FACTURE,
            typeFacture: FactureType.REPARATION,
            montant: 65000,
            statutPaiement: StatutPaiement.PAYE,
          },
        ],
      },
    },
  });

  // 5. Ticket Contractuel
  const ticketContract = await prisma.intervention.create({
    data: {
      numero: 'INT-2026-0003',
      clientId: clientEntrepriseContract.id,
      contractId: contractBanque.id,
      type: InterventionType.CONTRACTUEL,
      typeMateriel: TypeMateriel.PC_BUREAU,
      panneDeclaree: 'Visite préventive mensuelle : dépoussiérage des 25 postes et vérification des disques durs serveurs.',
      modeIntervention: ModeIntervention.DOMICILE,
      statut: InterventionStatut.EN_INTERVENTION,
      montantDiagnostic: null,
      technicienAssigneId: techInfo.id,
      historique: {
        create: [
          { action: 'Intervention planifiée déclenchée sous contrat', auteurId: adminUser.id },
          { action: 'Pris en charge par Koffi Mensah', auteurId: techInfo.id },
        ],
      },
    },
  });

  // 6. Demandes Commerciales
  await prisma.demandeCommerciale.createMany({
    data: [
      {
        clientId: clientParticulier.id,
        typeDemande: TypeDemandeCommerciale.VENTE_MATERIEL,
        description: 'Demande de prix pour 2 PC portables Lenovo ThinkPad Core i5 / 16Go RAM pour bureau.',
        statut: DemandeStatut.NOUVEAU,
      },
      {
        clientId: clientEntreprisePonctuel.id,
        typeDemande: TypeDemandeCommerciale.LOCATION_VIDEOPROJECTEUR,
        description: 'Location vidéoprojecteur 4000 lumens + écran sur trépied pour séminaire médical de 3 jours.',
        statut: DemandeStatut.EN_COURS,
      },
    ],
  });

  // 7. Stock de Pièces
  await prisma.piece.createMany({
    data: [
      { nom: 'Écran LCD 15.6 pouces Full HD 30 pin', quantiteStock: 8, seuilAlerte: 2 },
      { nom: 'Disque SSD NVMe 512 Go Kingston', quantiteStock: 15, seuilAlerte: 3 },
      { nom: 'Lampe vidéoprojecteur universelle 240W', quantiteStock: 4, seuilAlerte: 1 },
      { nom: 'Pâte thermique Noctua NT-H1', quantiteStock: 10, seuilAlerte: 2 },
      { nom: 'Câble ECG patient 5 brins', quantiteStock: 3, seuilAlerte: 2 },
    ],
  });

  console.log('✅ Base de données Supabase synchronisée et alimentée avec succès !');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
