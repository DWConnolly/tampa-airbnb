import type { PolicySection } from '../config/policies';

export default function PolicySections({ sections, headingLevel = 2, sectionIds }: { sections: PolicySection[]; headingLevel?: 2 | 3; sectionIds?: string[] }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return sections.map((section, index) => (
    <section key={section.heading} className="policy-section" id={sectionIds?.[index]} tabIndex={sectionIds ? -1 : undefined} aria-labelledby={sectionIds ? `${sectionIds[index]}-title` : undefined}>
      <Heading id={sectionIds ? `${sectionIds[index]}-title` : undefined}>{section.heading}</Heading>
      {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
    </section>
  ));
}
