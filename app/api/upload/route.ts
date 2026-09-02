import { NextResponse } from "next/server";
import { uploadMediaFile } from "@/lib/services/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "Aucun fichier fourni." }, { status: 400 });
    }

    // Vérification de la taille (Max 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Le fichier dépasse la taille maximale autorisée de 10 Mo." },
        { status: 400 }
      );
    }

    // Vérification du type MIME
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Format de fichier non supporté (seuls JPG, PNG, WEBP et PDF sont acceptés)." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileUrl = await uploadMediaFile(buffer, file.name, file.type);

    return NextResponse.json({ success: true, url: fileUrl }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur API Upload:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erreur lors de l'enregistrement du fichier." },
      { status: 500 }
    );
  }
}
