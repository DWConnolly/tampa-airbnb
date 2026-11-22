import { createContext, useContext } from 'react';

export const EnquiryContext = createContext<(() => void) | null>(null);

export function useEnquiry() {
  const open = useContext(EnquiryContext);
  if (!open) throw new Error('Enquiry controls require EnquiryProvider');
  return open;
}
