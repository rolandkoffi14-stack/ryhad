const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Suppression de tous les utilisateurs et nettoyage des références...");

  // Détacher les références des interventions et historiques pour éviter les contraintes de clés étrangères
  await prisma.historiqueTicket.updateMany({
    where: { auteurId: { not: null } },
    data: { auteurId: null },
  });

  await prisma.intervention.updateMany({
    where: { technicienAssigneId: { not: null } },
    data: { technicienAssigneId: null },
  });

  // Supprimer tous les tokens de réinitialisation éventuels
  await prisma.passwordResetToken.deleteMany({});

  // Supprimer tous les utilisateurs
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`✓ ${deletedUsers.count} utilisateur(s) supprimé(s).`);

  const userCount = await prisma.user.count();
  console.log(`✓ Nombre total d'utilisateurs restants en base: ${userCount}`);
}

main()
  .catch((e) => {
    console.error("Erreur lors de la suppression des utilisateurs :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
