// DRAFT policy text for direct bookings. Nothing here is in effect until the
// owner (ideally with an attorney/insurer) edits it and sets
// ownerConfirmations.policies to true in data/booking-config.json.
// "Owner to confirm" items are deliberately left as open questions.
import type { PolicyKey } from './routes';

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface Policy {
  title: string;
  intro: string;
  sections: PolicySection[];
}

const OWNER = 'Owner to confirm:';

export const policies: Record<PolicyKey, Policy> = {
  cancellation: {
    title: 'Cancellation policy',
    intro: 'This policy covers direct stays requested on this website and confirmed by paying the host’s Stripe invoice. Stays booked on Airbnb or Vrbo follow the cancellation policy shown on that platform.',
    sections: [
      {
        heading: 'Proposed refund schedule',
        items: [
          `${OWNER} cancel 30 or more days before check-in for a full refund.`,
          `${OWNER} cancel 14–29 days before check-in for a 50% refund of the nightly lodging amount, plus the cleaning fee and the taxes on the refunded amount.`,
          `${OWNER} cancel fewer than 14 days before check-in: no refund of the nightly lodging amount.`,
        ],
      },
      {
        heading: 'If the host cannot honor your booking',
        paragraphs: [
          'Dates are not held while a request is reviewed. The host checks availability on every platform before sending an invoice. If the dates are taken before the invoice is paid, the host tells you and voids the invoice. If they are taken after payment, the host refunds the full payment.',
          `${OWNER} what happens if the home becomes unavailable for reasons outside the guest’s control, such as a hurricane evacuation order or a major repair.`,
        ],
      },
      {
        heading: 'How to cancel',
        paragraphs: [
          `${OWNER} the contact method for cancellation requests.`,
          'Refunds are made through Stripe to the payment method used for the invoice. Your bank controls how long the refund takes to appear.',
        ],
      },
    ],
  },
  houseRules: {
    title: 'House rules',
    intro: 'These rules apply to every direct stay requested on this website. You are asked to agree to them when you send a request.',
    sections: [
      {
        heading: 'Guests',
        items: [
          'Up to 6 guests in total, including children.',
          `${OWNER} whether infants count toward the limit and whether daytime visitors are allowed.`,
        ],
      },
      {
        heading: 'Arrival and departure',
        items: [
          `${OWNER} check-in window and checkout time.`,
          'The home has smart-lock self check-in. Access instructions are shared before arrival.',
        ],
      },
      {
        heading: 'Pets, smoking, events and quiet hours',
        items: [
          `${OWNER} pet policy.`,
          `${OWNER} smoking and vaping policy (indoors and outdoors).`,
          `${OWNER} parties and events policy.`,
          `${OWNER} quiet hours, and any City of Tampa short-term rental rules guests must follow.`,
        ],
      },
      {
        heading: 'Around the home',
        items: [
          `${OWNER} parking capacity and any vehicle restrictions.`,
          `${OWNER} fire pit, outdoor shower and bocce usage guidelines.`,
          'Please be considerate of neighbors. Tampa Heights is a residential neighborhood.',
        ],
      },
    ],
  },
  rentalTerms: {
    title: 'Rental terms',
    intro: 'These terms form the agreement between the guest whose direct booking request is accepted and the owner of Blue Bliss By The Bay. The cancellation policy and house rules are part of these terms.',
    sections: [
      {
        heading: 'Booking',
        items: [
          'Direct bookings are available only for check-in dates more than 7 days after the booking date. For sooner stays, book on Airbnb.',
          'Minimum and maximum stay lengths are shown in the booking calendar. The maximum occupancy is 6 guests.',
          'Sending a request through this website does not book the home and does not charge you. The host reviews each request and replies by email to accept or decline it.',
          'If the host accepts, you receive a Stripe invoice by email. The booking is confirmed only when that invoice is paid by its due date. Dates are not held before then.',
          'The price shown on this website is an estimate. The amount on the invoice is the final price; the host explains any difference before you pay.',
        ],
      },
      {
        heading: 'Payment and taxes',
        items: [
          'Payment is made through the Stripe invoice the host sends after accepting your request: nightly lodging, the cleaning fee, and the taxes itemized on the invoice.',
          `${OWNER} the invoice due date and whether a deposit is taken first.`,
          `${OWNER} the taxes collected, their rates, and the registration numbers to show on receipts. Tax lines are not verified until then.`,
          `${OWNER} whether a security deposit or damage policy applies.`,
        ],
      },
      {
        heading: 'Your stay',
        items: [
          'The guest who books is responsible for everyone in their party following the house rules.',
          `${OWNER} the host’s right to enter for emergencies or repairs, and what happens if rules are broken.`,
          `${OWNER} liability, insurance, and damage terms (insurer/attorney review recommended).`,
          `${OWNER} governing law and how disputes are handled.`,
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy',
    intro: 'This website is a static site. It does not set its own cookies or run analytics.',
    sections: [
      {
        heading: 'Hosting',
        paragraphs: ['The site is hosted on GitHub Pages. GitHub may record technical information such as IP addresses when pages are requested, under GitHub’s own privacy statement.'],
      },
      {
        heading: 'Direct bookings',
        items: [
          'The booking request form runs only in your browser. This website does not save, send or store what you type. When you submit, it opens an email in your own email app, addressed to the host, and nothing is shared until you choose to send it.',
          'The request email contains your dates, guest count, name, email, phone, arrival time, purpose of stay, pet details, notes and the policies you agreed to.',
          'If the host accepts, payment is collected through a Stripe invoice. Stripe processes your card details under Stripe’s privacy policy; they never reach this website or the host.',
          'The public availability calendar lists blocked dates only. It never includes guest names or contact details.',
          'The host uses your contact details only to manage your stay and to meet tax and legal record-keeping duties.',
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [`${OWNER} contact details for privacy questions and how long booking records are kept.`],
      },
    ],
  },
};
