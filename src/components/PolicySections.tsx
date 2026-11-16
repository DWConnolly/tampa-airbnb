import type { PolicySection } from '../config/policies';

export default function PolicySections({ sections, headingLevel = 2 }: { sections: PolicySection[]; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return sections.map((section) => (
    <section key={section.heading} className="policy-section">
      <Heading>{section.heading}</Heading>
      {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
    </section>
  ));
}
