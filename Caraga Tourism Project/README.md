# Caraga Tourism Map

An interactive web map for planning a family weekend trip around the Caraga Region, built with Leaflet.js and GeoJSON. Answers the question: *"Where should we take the family this weekend?"*

**Live demo:** blank

![Caraga Tourism Map preview](screenshot.png)
*(add a screenshot of the live map here before submitting)*

---

## Group

**Dela_Peña-Plaza Group**

- Robin D. Dela Peña
- Arken June U. Plaza

---

## Features

- **Dual basemaps** — OpenStreetMap and CartoDB Voyager, switchable via layer control
- **Provincial boundaries** — all 5 Caraga provinces (Agusan del Norte, Agusan del Sur, Surigao del Norte, Surigao del Sur, Dinagat Islands), loaded from real administrative boundary data
- **21 real tourist spots** grouped into 4 categories: Beaches & Islands, Waterfalls & Rivers, Mountains & Nature, Heritage & Culture
- **Rich popups** on every spot — name, description, entrance fee, best season to visit, and family-friendly notes
- **Hover-to-highlight** on province boundaries, **click-to-zoom** to fit any province
- **Click-to-open popups** on markers that stay open until manually closed, with a fly-to-location zoom animation
- **Layer control** to toggle basemaps, boundaries, and each spot category independently

---

## Data Sources

**Provincial boundaries:** DENR FeatureServer (official Philippine government geospatial data), with a bundled local GeoJSON fallback in case the live endpoint is unreachable.

**Tourist spot details:** Sourced primarily from Google Maps listings and local visitor reviews, cross-checked against independent Caraga tourism websites that are LGU-endorsed. Many of the smaller spots included here don't have a page on DOT Caraga or an official municipal site, so entrance fees and visiting notes for those are estimates built from what recent visitors have reported on the ground rather than a published fee schedule. Where official DOT Caraga or LGU information exists for a spot, that took priority.

---

## Known Issues

- Some entrance fees and visitor notes are unofficial estimates pulled from Google Maps reviews rather than a published government source, since official fee listings don't exist yet for every spot on the map. These are marked as approximate.
- We're still finalizing the exact source citation for a few individual spots and haven't fully locked down which destinations belong on a single suggested day-trip route.
- The provincial boundary layer depends on a live external DENR server; a local GeoJSON fallback is bundled so the map still works if that server is briefly unavailable.

---

## Suggested Weekend Budget

For a group planning to hit a few spots in one weekend:

- Van rental: ₱6,000 – ₱8,000
- Snacks/travel food: ₱3,000

(Rough estimate only — actual costs vary by destination distance and group size.)

---

## Tech Stack

- [Leaflet.js](https://leafletjs.com/) — mapping library
- GeoJSON — spot and boundary data
- Vanilla JavaScript — no frameworks
- Hosted on [Netlify](https://www.netlify.com/)

---

## Running Locally

Opening `index.html` by double-clicking it will **not** work — browsers block local file fetches (`file://`) needed to load the GeoJSON data. Use one of these instead:

1. **Netlify Drop** (recommended, no install) — drag the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop)
2. **Python** (if installed) — run `python -m http.server 8000` in the project folder, then open `http://localhost:8000`

---

## Credits

Map tiles and data courtesy of OpenStreetMap contributors, CartoDB, and the DENR. Built for our Platform Technologies / Web GIS midterm exam, AY 2025–2026.
