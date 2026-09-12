import { houseGuidelines, siteCopy } from '../config/siteConfig';

export default function Guidelines() {
  return (
    <section id="good-to-know" className="section faq-section" aria-labelledby="faq-title" tabIndex={-1}>
      <div className="shell faq-layout">
        <div className="section-intro"><p className="eyebrow">{siteCopy.faq.eyebrow}</p><h2 id="faq-title">{siteCopy.faq.title}</h2><p>{siteCopy.faq.description}</p></div>
        <div className="faq-list">{houseGuidelines.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
      </div>
    </section>
  );
}
