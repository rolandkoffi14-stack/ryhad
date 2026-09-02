/**
 * Formate un montant en FCFA avec séparateurs de milliers propres.
 * Exemple: 45000 -> "45 000 FCFA"
 */
export function formatFCFA(montant: number | string | null | undefined): string {
  if (montant === null || montant === undefined || montant === "") return "0 FCFA";
  const num = typeof montant === "number" ? montant : parseInt(montant, 10);
  if (isNaN(num)) return "0 FCFA";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

/**
 * Formate un nombre sans le suffixe FCFA.
 * Exemple: 45000 -> "45 000"
 */
export function formatNumber(montant: number | string | null | undefined): string {
  if (montant === null || montant === undefined || montant === "") return "0";
  const num = typeof montant === "number" ? montant : parseInt(montant, 10);
  if (isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
