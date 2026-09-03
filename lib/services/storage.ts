import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { env } from "@/lib/env";

const r2AccountId = env.R2_ACCOUNT_ID;
const r2AccessKey = env.R2_ACCESS_KEY_ID;
const r2SecretKey = env.R2_SECRET_ACCESS_KEY;
const r2Bucket = env.R2_BUCKET_NAME || "ryhad-media";
const r2PublicUrl = env.R2_PUBLIC_URL || "https://media.ryhad.bj";

let s3Client: S3Client | null = null;

if (r2AccountId && r2AccessKey && r2SecretKey && !r2AccountId.includes("votre_")) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKey,
      secretAccessKey: r2SecretKey,
    },
  });
}

/**
 * Téléverse un fichier vers Cloudflare R2 (avec fallback local si R2 n'est pas encore configuré)
 */
export async function uploadMediaFile(
  buffer: Buffer,
  originalFilename: string,
  contentType: string
): Promise<string> {
  const extension = path.extname(originalFilename) || ".jpg";
  const uniqueName = `tickets/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;

  // Si Cloudflare R2 est configuré en production
  if (s3Client) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: uniqueName,
          Body: buffer,
          ContentType: contentType,
        })
      );
      return `${r2PublicUrl.replace(/\/$/, "")}/${uniqueName}`;
    } catch (error) {
      console.error("Erreur téléversement Cloudflare R2:", error);
      throw new Error("Échec du téléversement sur le stockage Cloudflare R2.");
    }
  }

  // Fallback dev local (enregistré dans public/uploads/)
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localPath = path.join(uploadDir, path.basename(uniqueName));
  fs.writeFileSync(localPath, buffer);

  return `/uploads/${path.basename(uniqueName)}`;
}
