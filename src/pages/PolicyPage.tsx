import { policiesConfirmed } from '../config/booking';
import { policies } from '../config/policies';
import type { PolicyKey } from '../config/routes';
import PolicySections from '../components/PolicySections';
import PageLayout from './PageLayout';

export default function PolicyPage({ policy }: { policy: PolicyKey }) {
  const { title, intro, sections } = policies[policy];
  return (
    <PageLayout>
      <article className="shell section policy-page" aria-labelledby="policy-title">
        <p className="eyebrow">Direct bookings</p>
        <h1 id="policy-title">{title}</h1>
        {!policiesConfirmed && (
          <p className="draft-banner" role="note"><strong>Draft for owner review.</strong> This policy is not in effect yet, and items marked “Owner to confirm” are open questions. Direct booking stays closed until the owner confirms the final text.</p>
        )}
        <p className="policy-intro">{intro}</p>
        <PolicySections sections={sections} />
      </article>
    </PageLayout>
  );
}
