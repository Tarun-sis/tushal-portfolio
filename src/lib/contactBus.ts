import type { WebsiteType } from '@/config';

export const PREFILL_EVENT = 'prefill-contact';
/** Ask the contact form to preselect a website type (the link itself still scrolls to #contact). */
export function prefillContact(websiteType: WebsiteType) {
  window.dispatchEvent(new CustomEvent<WebsiteType>(PREFILL_EVENT, { detail: websiteType }));
}
