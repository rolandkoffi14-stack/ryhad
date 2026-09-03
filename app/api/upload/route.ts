import { NextResponse } from "next/server";
import { uploadMediaFile } from "@/lib/services/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import path from "path";

/**
 * Valide les octets magiques (Magic Bytes) pour vérifier l'authenticité réelle du fichier
 */
function isValidMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;

  // JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WebP (RIFF .... WEBP)
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }

  // PDF (%PDF)
  if (buffer.toString("ascii", 0, 4) === "%PDF") {
    return true;
  }

  // HEIC / HEIF (....ftypheic ou ....ftypmif1)
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    // 0. Limitation de débit (10 téléversements / minute par IP)
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`upload_${ip}`, { limit: 10, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Trop de fichiers envoyés. Veuillez patienter une minute." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "Aucun fichier fourni." }, { status: 400 });
    }

    // 1. Vérification de la taille (Max 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Le fichier dépasse la taille maximale autorisée de 10 Mo." },
        { status: 400 }
      );
    }

    // 2. Vérification stricte de l'extension
    const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".heic"];
    const ext = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, message: "Extension non autorisée. Formats acceptés : JPG, PNG, WEBP, PDF." },
        { status: 400 }
      );
    }

    // 3. Vérification du type MIME déclaré
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Format de fichier non supporté." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Vérification approfondie des Magic Bytes
    if (!isValidMagicBytes(buffer)) {
      return NextResponse.json(
        { success: false, message: "Le contenu du fichier ne correspond pas au format déclaré ou est corrompu." },
        { status: 400 }
      );
    }

    const fileUrl = await uploadMediaFile(buffer, file.name, file.type);

    return NextResponse.json({ success: true, url: fileUrl }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur API Upload:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'enregistrement du fichier." },
      { status: 500 }
    );
  }
}
