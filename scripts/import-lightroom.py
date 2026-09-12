"""Import the owner-supplied public album. Requires Pillow (tooling only).

Writes optimized image assets only; prints a compact inventory for siteConfig.ts.
No originals, private metadata, or expiring Adobe URLs are published on the site.
"""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import json

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SPACE = '86fb79cab64549df885c04ea983c2eef'
ALBUM = '5ac6c060b98948db8e616e1a81d35db1'
BASE = f'https://photos.adobe.io/v2/spaces/{SPACE}/'
DEST = ROOT / 'public/images/property'


def get(url):
    with urlopen(Request(url, headers={'X-API-Key': 'LightroomMobileWeb1'}), timeout=60) as response:
        return response.read()


def import_photo(item):
    number, resource = item
    asset = resource['asset']
    filename = asset['payload']['importSource']['fileName']
    stem = Path(filename).stem.lower()
    rendition = asset['links']['/rels/rendition_type/2048']['href']
    with Image.open(BytesIO(get(urljoin(BASE, rendition)))) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        sizes = []
        for edge in [640, 1280, 2048]:
            resized = image.copy()
            resized.thumbnail((edge, edge), Image.Resampling.LANCZOS)
            path = DEST / f'{stem}-{edge}.webp'
            # Do not carry GPS, camera serials, or other EXIF into public assets.
            resized.save(path, 'WEBP', quality=80, method=6)
            sizes.append([resized.width, resized.height, path.stat().st_size])
        return {'number': number, 'file': filename, 'assetId': asset['id'], 'sizes': sizes}


if __name__ == '__main__':
    data = json.loads(get(urljoin(BASE, f'albums/{ALBUM}/assets?embed=asset&subtype=image%3Bvideo')).decode().removeprefix('while (1) {}\n'))
    if data.get('links'):
        raise RuntimeError('Album has pagination; inspect links before importing a partial collection.')
    resources = sorted(data['resources'], key=lambda resource: resource['payload']['order'])
    if any(resource['asset']['subtype'] != 'image' for resource in resources):
        raise RuntimeError('Album includes non-image media; review before publishing.')
    DEST.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(import_photo, enumerate(resources, 1)))
    for result in results:
        print(json.dumps(result))
    print('TOTAL_BYTES', sum(size[2] for photo in results for size in photo['sizes']))