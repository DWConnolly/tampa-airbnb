import { assetUrl, type GalleryImage } from '../config/siteConfig';

export default function PropertyImage({ image, priority = false, sizes = '100vw' }: { image: GalleryImage; priority?: boolean; sizes?: string }) {
  return <img
    src={assetUrl(image.src)}
    srcSet={image.sources?.map((source) => `${assetUrl(source.src)} ${source.width}w`).join(', ')}
    sizes={image.sources?.length ? sizes : undefined}
    width={image.width}
    height={image.height}
    alt={image.alt}
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : 'auto'}
    decoding="async"
  />;
}