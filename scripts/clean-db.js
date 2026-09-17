const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[CLEAN DB] Démarrage de la purge des données...');

  // 1. Transactions de paiement
  if (prisma.paymentTransaction) {
    const res = await prisma.paymentTransaction.deleteMany({});
    console.log(`- Transactions supprimées : ${res.count}`);
  }

  // 2. Documents financiers (factures, devis)
  if (prisma.financialDocument) {
    const res = await prisma.financialDocument.deleteMany({});
    console.log(`- Documents financiers supprimés : ${res.count}`);
  }

  // 3. Pièces utilisées & Pièces jointes
  if (prisma.pieceUtilisee) {
    const res = await prisma.pieceUtilisee.deleteMany({});
    console.log(`- Pièces utilisées supprimées : ${res.count}`);
  }

  if (prisma.pieceJointe) {
    const res = await prisma.pieceJointe.deleteMany({});
    console.log(`- Pièces jointes supprimées : ${res.count}`);
  }

  // 4. Historique tickets
  if (prisma.historiqueTicket) {
    const res = await prisma.historiqueTicket.deleteMany({});
    console.log(`- Historique tickets supprimé : ${res.count}`);
  }

  // 5. Visites planifiées
  if (prisma.visitePlanifiee) {
    const res = await prisma.visitePlanifiee.deleteMany({});
    console.log(`- Visites planifiées supprimées : ${res.count}`);
  }

  // 6. Interventions (tickets)
  if (prisma.intervention) {
    const res = await prisma.intervention.deleteMany({});
    console.log(`- Interventions supprimées : ${res.count}`);
  }

  // 7. Contrats
  if (prisma.contract) {
    const res = await prisma.contract.deleteMany({});
    console.log(`- Contrats supprimés : ${res.count}`);
  }

  // 8. Demandes commerciales
  if (prisma.demandeCommerciale) {
    const res = await prisma.demandeCommerciale.deleteMany({});
    console.log(`- Demandes commerciales supprimées : ${res.count}`);
  }

  // 9. Notifications & Push subscriptions
  if (prisma.notification) {
    const res = await prisma.notification.deleteMany({});
    console.log(`- Notifications supprimées : ${res.count}`);
  }

  if (prisma.pushSubscription) {
    const res = await prisma.pushSubscription.deleteMany({});
    console.log(`- Abonnements Push supprimés : ${res.count}`);
  }

  // 10. Tokens de mot de passe
  if (prisma.passwordResetToken) {
    const res = await prisma.passwordResetToken.deleteMany({});
    console.log(`- Tokens de réinitialisation supprimés : ${res.count}`);
  }

  // 11. Clients
  if (prisma.client) {
    const res = await prisma.client.deleteMany({});
    console.log(`- Clients supprimés : ${res.count}`);
  }

  // 12. Utilisateurs Staff
  if (prisma.user) {
    const res = await prisma.user.deleteMany({});
    console.log(`- Utilisateurs Staff supprimés : ${res.count}`);
  }

  console.log('[CLEAN DB] Purge complète terminée avec succès !');
}

main()
  .catch((e) => {
    console.error('[CLEAN DB ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
