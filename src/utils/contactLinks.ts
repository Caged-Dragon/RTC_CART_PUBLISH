/** Build a WhatsApp click-to-chat URL from a database-managed phone number.
 * Formatting characters are removed so values such as "+91 (98765) 43210" remain valid.
 * Return null when there is no usable phone number rather than linking to wa.me/undefined.
 */
export function getWhatsAppHref(phone: string | null | undefined): string | null {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}
