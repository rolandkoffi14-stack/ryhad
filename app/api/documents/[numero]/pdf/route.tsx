import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const cleanNum = decodeURIComponent(numero).toUpperCase().trim();

    // Redirection automatique transparente vers la page publique officielle
    // Permet aux clients WhatsApp et aux anciens liens de continuer de fonctionner immédiatement
    const url = new URL(request.url);
    const targetUrl = new URL(`/documents/${encodeURIComponent(cleanNum)}`, url.origin);
    
    // Transmettre d'éventuels paramètres utiles
    if (url.searchParams.has("format")) {
      targetUrl.searchParams.set("format", url.searchParams.get("format")!);
    }
    if (url.searchParams.get("auto") === "true" || url.searchParams.get("download") === "true") {
      targetUrl.searchParams.set("auto", "true");
    }

    return NextResponse.redirect(targetUrl, 307);
  } catch (error) {
    console.error("Erreur redirection document:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la redirection du document." },
      { status: 500 }
    );
  }
}
