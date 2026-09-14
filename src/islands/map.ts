/**
 * The interactive map, loaded on demand.
 *
 * The static image stays the default and is what every visitor gets for free:
 * it is already the right picture, it works with no JavaScript, and most
 * people on this page want the Maps app rather than a pannable map. Leaflet is
 * ~42KB gzipped — more than the whole /visit budget — so it is behind a
 * dynamic import and only a visitor who asks for it pays for it. That is the
 * same arrangement the search overlay uses.
 *
 * Tiles come from OpenStreetMap, which the CSP allows explicitly. Attribution
 * is required by their terms and is not optional decoration.
 */
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>';

export async function mount(root: HTMLElement): Promise<void> {
  const lat = Number(root.dataset.lat);
  const lng = Number(root.dataset.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const [L] = await Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css'),
  ]);

  const canvas = document.createElement('div');
  canvas.className = 'lmap__canvas';
  root.replaceChildren(canvas);
  root.dataset.live = '';

  const map = L.map(canvas, {
    center: [lat, lng],
    zoom: 17,
    /* Scroll-wheel zoom off: the map sits inside a scrolling page, and a
       wheel that zooms instead of scrolling traps the reader. Ctrl+wheel
       still zooms, which is the convention people expect. */
    scrollWheelZoom: false,
    attributionControl: true,
  });

  L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

  /* Leaflet's default marker is a PNG resolved relative to the CSS, which does
     not survive bundling. A div marker needs no image and matches the site. */
  const pin = L.divIcon({
    className: 'lmap__pin',
    html: '<span aria-hidden="true"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
  L.marker([lat, lng], { icon: pin, title: root.dataset.label ?? '' })
    .addTo(map)
    .bindPopup(root.dataset.label ?? '');

  /* The container was sized by CSS before Leaflet measured it, and on a slow
     load that measurement can land first. */
  requestAnimationFrame(() => map.invalidateSize());
}
