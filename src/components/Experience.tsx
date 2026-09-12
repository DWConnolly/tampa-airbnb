import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, BedDouble, Expand, X } from 'lucide-react';
import { additionalSleeping, bedrooms, galleryImages, photography, property, siteCopy } from '../config/siteConfig';
import BookingLink from './BookingLink';
import PropertyImage from './PropertyImage';

export default function Experience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const image = galleryImages[activeIndex];
  const multiple = galleryImages.length > 1;
  const previewImages = photography.previewIds
    .map((id) => galleryImages.find((photo) => photo.id === id))
    .filter((photo) => photo !== undefined);
  const outdoorImage = galleryImages.find((photo) => photo.id === photography.storyIds.outdoors)!;
  const indoorImage = galleryImages.find((photo) => photo.id === photography.storyIds.indoors)!;
  const sleepingImage = galleryImages.find((photo) => photo.id === photography.storyIds.sleeping)!;

  useEffect(() => {
    if (!galleryOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [galleryOpen]);

  function closeGallery() {
    dialogRef.current?.close();
  }

  function openGallery(event: MouseEvent<HTMLButtonElement>, index: number) {
    openerRef.current = event.currentTarget;
    setActiveIndex(index);
    setGalleryOpen(true);
    dialogRef.current?.showModal();
  }

  function navigate(direction: number) {
    setActiveIndex((current) => (current + direction + galleryImages.length) % galleryImages.length);
  }

  return (
    <>
      <section id="the-home" className="section shell" aria-labelledby="home-title" tabIndex={-1}>
        <div className="section-intro split-intro home-intro">
          <div><p className="eyebrow">{siteCopy.home.eyebrow}</p><h2 id="home-title">{siteCopy.home.title}</h2></div>
          <p>{siteCopy.home.description}</p>
        </div>
        <div className="stay-story">
          <figure className="stay-outdoor">
            <button className="story-photo" aria-label={`View photo: ${outdoorImage.alt}`} aria-haspopup="dialog" onClick={(event) => openGallery(event, galleryImages.indexOf(outdoorImage))}>
              <PropertyImage image={outdoorImage} sizes="(min-width: 1440px) 800px, (min-width: 900px) 62vw, 100vw" />
              <span className="photo-action"><Expand size={16} aria-hidden="true" /> View photo</span>
            </button>
            <figcaption className="journal-caption">{siteCopy.stay.outdoor.caption}</figcaption>
          </figure>
          <div className="stay-outdoor-copy">
            <p className="eyebrow">{siteCopy.stay.outdoor.eyebrow}</p>
            <h3>{siteCopy.stay.outdoor.title}</h3>
            <p>{siteCopy.stay.outdoor.description}</p>
          </div>
          <figure className="stay-indoor">
            <button className="story-photo" aria-label={`View photo: ${indoorImage.alt}`} aria-haspopup="dialog" onClick={(event) => openGallery(event, galleryImages.indexOf(indoorImage))}>
              <PropertyImage image={indoorImage} sizes="(min-width: 1440px) 550px, (min-width: 900px) 42vw, 100vw" />
              <span className="photo-action"><Expand size={16} aria-hidden="true" /> View photo</span>
            </button>
            <figcaption className="journal-caption">{siteCopy.stay.indoor.caption}</figcaption>
          </figure>
          <div className="stay-indoor-copy">
            <p className="eyebrow">{siteCopy.stay.indoor.eyebrow}</p>
            <h3>{siteCopy.stay.indoor.title}</h3>
            <p>{siteCopy.stay.indoor.description}</p>
          </div>
        </div>
        <details className="owner-note">
          <summary>{siteCopy.stay.ownerNote.eyebrow}<span>{siteCopy.stay.ownerNote.title}</span></summary>
          <p>{property.description}</p>
        </details>
        <div className="gallery-heading"><div><p className="eyebrow">{siteCopy.home.galleryEyebrow}</p><h3>{siteCopy.home.galleryHeading}</h3></div><span className="gallery-count">{galleryImages.length} {siteCopy.home.photoLabel}</span></div>
        <div className={`property-gallery ${multiple ? 'has-multiple' : ''}`}>
          {previewImages.map((photo, index) => (
            <figure key={photo.id}>
              <button className="gallery-open" aria-label={`View photo: ${photo.alt}`} aria-haspopup="dialog" onClick={(event) => openGallery(event, galleryImages.indexOf(photo))}>
                <PropertyImage image={photo} sizes={index === 0 ? '(min-width: 1440px) 660px, (min-width: 600px) 50vw, 100vw' : '(min-width: 1440px) 320px, (min-width: 600px) 25vw, 50vw'} />
                <span className="photo-action"><Expand size={16} aria-hidden="true" /> View photo</span>
              </button>
              <figcaption className="journal-caption"><span>{String(index + 1).padStart(2, '0')}</span>{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
        <div className="gallery-note">
          <p className="small-note">{siteCopy.home.galleryNote}</p>
          <button className="button gallery-view-all" aria-haspopup="dialog" onClick={(event) => openGallery(event, 0)}>{siteCopy.home.viewAll} {galleryImages.length} {siteCopy.home.photoLabel}</button>
          <BookingLink className="text-link">{siteCopy.home.galleryLink}</BookingLink>
        </div>
      </section>

      <section id="sleeping" className="sleeping-section section" aria-labelledby="sleeping-title" tabIndex={-1}>
        <div className="shell sleeping-layout">
          <figure className="sleeping-photo">
            <button className="story-photo" aria-label={`View photo: ${sleepingImage.alt}`} aria-haspopup="dialog" onClick={(event) => openGallery(event, galleryImages.indexOf(sleepingImage))}>
              <PropertyImage image={sleepingImage} sizes="(min-width: 1440px) 680px, (min-width: 900px) 50vw, 100vw" />
              <span className="photo-action"><Expand size={16} aria-hidden="true" /> View photo</span>
            </button>
            <figcaption className="journal-caption">{siteCopy.sleeping.caption}</figcaption>
          </figure>
          <div className="sleeping-copy">
            <div className="section-intro"><p className="eyebrow">{siteCopy.sleeping.eyebrow}</p><h2 id="sleeping-title">{siteCopy.sleeping.title}</h2><p>{siteCopy.sleeping.description}</p></div>
            <ol className="bedroom-list">
              {bedrooms.map((bedroom, index) => <li key={bedroom.name}>
                <span className="room-number">0{index + 1}</span>
                <div><h3>{bedroom.name}</h3><p>{bedroom.bedType}</p></div>
                <BedDouble size={26} strokeWidth={1.3} aria-hidden="true" />
              </li>)}
            </ol>
            <div className="loft-note"><h3>{additionalSleeping.name} · {additionalSleeping.bedType}</h3><p>{additionalSleeping.description}</p></div>
          </div>
        </div>
      </section>

      <dialog ref={dialogRef} className="gallery-dialog" aria-labelledby="gallery-title" aria-describedby="gallery-caption" onCancel={closeGallery} onClose={() => {
        setGalleryOpen(false);
        openerRef.current?.focus({ preventScroll: true });
      }} onClick={(event) => { if (event.target === event.currentTarget) closeGallery(); }} onKeyDown={(event) => {
        if (multiple && event.target instanceof HTMLElement && event.target.tagName !== 'SELECT' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
          event.preventDefault();
          navigate(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
        <div className="dialog-inner">
          <div className="dialog-heading"><h2 id="gallery-title">{siteCopy.home.galleryTitle}</h2><button className="icon-button" aria-label="Close photo gallery" onClick={closeGallery} autoFocus><X aria-hidden="true" /></button></div>
          {galleryOpen && <PropertyImage key={image.id} image={image} priority sizes="(min-width: 1120px) 1088px, calc(100vw - 56px)" />}
          <div className="dialog-footer">
            {multiple && <button className="icon-button" aria-label="Previous property photo" onClick={() => navigate(-1)}><ArrowLeft aria-hidden="true" /></button>}
            <p id="gallery-caption" aria-live="polite">{image.caption}<span>{activeIndex + 1} / {galleryImages.length}</span></p>
            {multiple && <button className="icon-button" aria-label="Next property photo" onClick={() => navigate(1)}><ArrowRight aria-hidden="true" /></button>}
          </div>
          {multiple && <div className="photo-jump"><label htmlFor="photo-number">{siteCopy.home.jumpLabel}</label><select id="photo-number" value={activeIndex} onChange={(event) => setActiveIndex(Number(event.target.value))}>
            {galleryImages.map((photo, index) => <option key={photo.id} value={index}>{index + 1} — {photo.caption}</option>)}
          </select></div>}
        </div>
      </dialog>
    </>
  );
}
