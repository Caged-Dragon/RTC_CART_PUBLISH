/**
 * General support links only. Do not put cart contents, order IDs, personal details or
 * dispatch/payment requests into WhatsApp URLs: this storefront is catalogue/enquiry-only.
 */
export function getProductInformationWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  const message = 'Hello RedThunder Crackers. I have a general question about the published product catalogue. Please share product information and any applicable legal requirements.';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
