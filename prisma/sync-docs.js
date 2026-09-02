const { PrismaClient, DocumentType, FactureType } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const documents = await prisma.financialDocument.findMany({
    include: {
      intervention: {
        include: {
          piecesUtilisees: true,
        },
      },
    },
  });

  for (const doc of documents) {
    if (doc.type === DocumentType.DEVIS || (doc.type === DocumentType.FACTURE && doc.typeFacture === FactureType.REPARATION)) {
      if (doc.intervention && doc.intervention.piecesUtilisees.length > 0) {
        const total = doc.intervention.piecesUtilisees.reduce(
          (acc, p) => acc + p.quantite * p.prixUnitaire,
          0
        );
        if (total > 0 && total !== doc.montant) {
          await prisma.financialDocument.update({
            where: { id: doc.id },
            data: { montant: total },
          });
          console.log(`Document ${doc.numero} resynchronisé : ${doc.montant} -> ${total} FCFA`);
        }
      }
    }
  }
  console.log('Tous les documents existants ont été resynchronisés !');
}

main().catch(console.error).finally(() => prisma.$disconnect());
