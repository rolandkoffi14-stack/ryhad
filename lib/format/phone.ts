/**
 * Module de validation, normalisation et formatage des numéros de téléphone du Bénin
 * Conforme au plan national de numérotation ARCEP à 10 chiffres (préfixe 01).
 */

/**
 * Nettoie une chaîne pour n'en conserver que les chiffres.
 */
export function extractDigits(input: string): string {
  if (!input) return "";
  return input.replace(/\D/g, "");
}

/**
 * Analyse et extrait le numéro national béninois à 10 chiffres (commençant par 01).
 * Tolère également la saisie de l'ancien format à 8 chiffres (commençant par 2, 4, 5, 6 ou 9)
 * en lui adjoignant automatiquement le préfixe 01.
 * 
 * Retourne une chaîne de 10 chiffres (ex: "0190881314") ou null si invalide.
 */
export function parseBeninPhoneDigits(input: string): string | null {
  if (!input) return null;

  let digits = extractDigits(input);

  // Retrait de l'indicatif international 00229 ou 229
  if (digits.startsWith("00229")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("229")) {
    digits = digits.slice(3);
  }

  // Cas 1 : Déjà au format 10 chiffres commençant par 01
  // Le 3ème chiffre correspond aux plages mobiles/fixes béninoises (2, 4, 5, 6, 9)
  if (digits.length === 10 && digits.startsWith("01")) {
    const thirdDigit = digits.charAt(2);
    if (["2", "4", "5", "6", "9"].includes(thirdDigit)) {
      return digits;
    }
  }

  // Cas 2 : Tolérance ancien format 8 chiffres (ex: 90 88 13 14)
  // On ajoute automatiquement le préfixe national "01"
  if (digits.length === 8 && ["2", "4", "5", "6", "9"].includes(digits.charAt(0))) {
    return `01${digits}`;
  }

  return null;
}

/**
 * Vérifie si une chaîne représente un numéro béninois valide (format 10 chiffres ou ancien 8 chiffres avec ou sans +229).
 */
export function isValidBeninPhone(input: string): boolean {
  return parseBeninPhoneDigits(input) !== null;
}

/**
 * Normalise un numéro béninois sous sa forme canonique officielle :
 * Format standard : "+229 01 XX XX XX XX"
 * Si le numéro n'est pas béninois ou non parseable, retourne la chaîne trimée d'origine.
 */
export function normalizeBeninPhone(input: string): string {
  const parsed10 = parseBeninPhoneDigits(input);
  if (!parsed10) {
    return input.trim();
  }

  // parsed10 = "01XXXXXXXX"
  // Formatage : +229 01 XX XX XX XX
  const p1 = parsed10.slice(0, 2); // 01
  const p2 = parsed10.slice(2, 4); // XX
  const p3 = parsed10.slice(4, 6); // XX
  const p4 = parsed10.slice(6, 8); // XX
  const p5 = parsed10.slice(8, 10); // XX

  return `+229 ${p1} ${p2} ${p3} ${p4} ${p5}`;
}

/**
 * Formate un numéro béninois pour l'affichage local :
 * "01 XX XX XX XX"
 */
export function formatLocalBeninPhone(input: string): string {
  const parsed10 = parseBeninPhoneDigits(input);
  if (!parsed10) return input.trim();

  return `${parsed10.slice(0, 2)} ${parsed10.slice(2, 4)} ${parsed10.slice(4, 6)} ${parsed10.slice(6, 8)} ${parsed10.slice(8, 10)}`;
}

/**
 * Génère le format international compact requis pour les liens WhatsApp (wa.me)
 * Retourne : "22901XXXXXXXX"
 */
export function toWhatsAppNumber(input: string): string {
  const parsed10 = parseBeninPhoneDigits(input);
  if (parsed10) {
    return `229${parsed10}`;
  }
  return extractDigits(input);
}
