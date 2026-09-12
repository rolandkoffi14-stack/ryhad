import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ format?: string; auto?: string }>;
}

export default async function DocumentPrintPage({ params, searchParams }: Props) {
  const { numero } = await params;
  const { format, auto } = await searchParams;

  const cleanNum = decodeURIComponent(numero).toUpperCase().trim();
  const queryParams = new URLSearchParams();
  if (format) queryParams.set("format", format);
  if (auto) queryParams.set("auto", auto);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
  redirect(`/documents/${encodeURIComponent(cleanNum)}${queryStr}`);
}
