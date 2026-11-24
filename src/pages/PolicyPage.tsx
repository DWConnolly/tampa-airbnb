import { policiesConfirmed } from '../config/booking';
import { policies } from '../config/policies';
import type { PolicyKey } from '../config/routes';
import PolicySections from '../components/PolicySections';
import PageLayout from './PageLayout';

export default function PolicyPage({ policy }: { policy: PolicyKey }) {
  const { title, intro, sections } = policies[policy];
  const sectionIds = sections.map((_, index) => `policy-section-${index + 1}`);
  return (
    <PageLayout>
      <article className="shell section policy-page" aria-labelledby="policy-title">
        <p className="eyebrow">Direct bookings</p>
        <h1 id="policy-title">{title}</h1>
        {!policiesConfirmed && policy !== 'privacy' && (
          <p className="draft-banner" role="note"><strong>Draft for owner review.</strong> This policy is not in effect yet, and items marked “Owner to confirm” are open questions. Direct booking stays closed until the owner confirms the final text.</p>
        )}
        <p className="policy-intro">{intro}</p>
        <div className="policy-layout">
          <nav className="policy-toc" aria-label="On this page">
            <p className="eyebrow">On this page</p>
            <ol>{sections.map((section, index) => <li key={section.heading}><a href={`#${sectionIds[index]}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{section.heading}</a></li>)}</ol>
          </nav>
          <div className="policy-body"><PolicySections sections={sections} sectionIds={sectionIds} /><a className="text-link" href="#policy-title">Back to top ↑</a></div>
        </div>
      </article>
    </PageLayout>
  );
}
