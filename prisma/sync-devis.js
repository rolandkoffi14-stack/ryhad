const { PrismaClient, DocumentType, StatutPaiement, InterventionStatut } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.intervention.findMany({
    include: {
      documents: true,
      historique: true,
    },
  });

  for (const t of tickets) {
    const devis = t.documents.find(d => d.type === DocumentType.DEVIS);
    if (!devis) continue;

    const hasRepairInvoice = t.documents.some(d => d.type === DocumentType.FACTURE && d.typeFacture === 'REPARATION');
    const wasRefused = t.statut === InterventionStatut.DEVIS_REFUSE || 
                       t.historique.some(h => h.action.toLowerCase().includes('refus') || (h.note && h.note.toLowerCase().includes('refus')));

    if (wasRefused && !hasRepairInvoice) {
      await prisma.financialDocument.update({
        where: { id: devis.id },
        data: { statutPaiement: StatutPaiement.REFUSE },
      });
      console.log(`Devis ${devis.numero} mis à jour : REFUSÉ`);
    } else if (hasRepairInvoice || [InterventionStatut.DEVIS_ACCEPTE, InterventionStatut.EN_REPARATION, InterventionStatut.TERMINE].includes(t.statut)) {
      await prisma.financialDocument.update({
        where: { id: devis.id },
        data: { statutPaiement: StatutPaiement.PAYE },
      });
      console.log(`Devis ${devis.numero} mis à jour : ACCEPTÉ`);
    }
  }
  console.log("Synchronisation des statuts de devis terminée !");
}

main().catch(console.error).finally(() => prisma.$disconnect());
