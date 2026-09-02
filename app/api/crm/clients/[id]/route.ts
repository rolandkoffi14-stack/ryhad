import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientFormSchema } from "@/lib/validations";
import { StaffRole } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = clientFormSchema.parse(body);

    const updatedClient = await db.client.update({
      where: { id },
      data: {
        type: validated.type,
        nom: validated.nom.trim(),
        contactNom: validated.contactNom ? validated.contactNom.trim() : null,
        telephone: validated.telephone.trim(),
        email: validated.email ? validated.email.trim() : null,
        adresse: validated.adresse ? validated.adresse.trim() : null,
      },
    });

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error: any) {
    console.error("Erreur modification client:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erreur lors de la mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role as StaffRole;
    if (role !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Action réservée exclusivement à la Direction (Administrateur)" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Vérification stricte des dépendances
    const client = await db.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            interventions: true,
            contrats: true,
            demandes: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, message: "Client introuvable" }, { status: 404 });
    }

    if (
      client._count.interventions > 0 ||
      client._count.contrats > 0 ||
      client._count.demandes > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Suppression impossible : ce client est lié à ${client._count.interventions} intervention(s), ${client._count.contrats} contrat(s) et ${client._count.demandes} demande(s).`,
        },
        { status: 400 }
      );
    }

    await db.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Client supprimé avec succès" });
  } catch (error: any) {
    console.error("Erreur suppression client:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
