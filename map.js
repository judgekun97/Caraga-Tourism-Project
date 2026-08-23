// ============================================================
// CARAGA TOURISM INTERACTIVE MAP
// ============================================================


// ------------------------------------------------------------
// 1. CREATE MAP
// ------------------------------------------------------------

const map = L.map('map').setView(
  [8.85, 125.75],
  8
);


// Map starts invisible (see CSS injected in section 12) and fades
// in once we've zoomed to the real data extent, so visitors don't
// see the generic starting view flash before the fitBounds() calls
// below run. Safety timeout in case a fetch stalls, so the map
// never stays hidden indefinitely.
function revealMap() {

  document.getElementById('map')
    .classList.add('map-ready');

}

setTimeout(revealMap, 2500);


// ------------------------------------------------------------
// 2. BASEMAPS
// ------------------------------------------------------------

const osm = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
);

const cartoVoyager = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  {
    attribution:
      '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20
  }
);

// Default basemap
osm.addTo(map);


// ------------------------------------------------------------
// 3. CATEGORY COLORS
// ------------------------------------------------------------

const CATEGORY_COLORS = {

  "Beaches & Islands": "#00C0A3",

  "Waterfalls & Rivers": "#008399",

  "Mountains & Nature": "#2D8A53",

  "Heritage & Culture": "#D19B2A"

};


// ------------------------------------------------------------
// 4. CATEGORY LAYERS
// ------------------------------------------------------------

const beachesIslands = L.layerGroup();

const waterfallsRivers = L.layerGroup();

const mountainsNature = L.layerGroup();

const heritageCulture = L.layerGroup();


// ------------------------------------------------------------
// 5. CATEGORY LOOKUP
// ------------------------------------------------------------

const categoryLayers = {

  "Beaches & Islands":
    beachesIslands,

  "Waterfalls & Rivers":
    waterfallsRivers,

  "Mountains & Nature":
    mountainsNature,

  "Heritage & Culture":
    heritageCulture

};


// Flat list of every tourist spot marker, built up as each
// GeoJSON feature is processed below. Powers the search/filter
// box in Section 10.5 without interfering with how the layer
// control shows/hides whole category groups.
const searchIndex = [];


// ------------------------------------------------------------
// 6. CREATE TOURIST MARKER
// ------------------------------------------------------------

function createTouristMarker(feature, latlng) {

  const group =
    feature.properties.group;

  const color =
    CATEGORY_COLORS[group] || "#555555";


  const icon =
    L.divIcon({

      className: "",

      // The outer div is what Leaflet positions on the map via
      // its own transform (translate3d). Never apply scale/other
      // transforms directly to that element — it will fight with
      // Leaflet's positioning and the marker will appear to jump
      // or vanish. The inner .tourist-marker-dot is a separate
      // element we scale on hover instead, so positioning is
      // never touched.
      html: `
        <div
          class="tourist-marker"
          style="width:18px;height:18px;"
        >
          <div
            class="tourist-marker-dot"
            style="
              background-color:${color};
              width:18px;
              height:18px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 7px rgba(0,0,0,0.45);
            "
          ></div>
        </div>
      `,

      iconSize: [18, 18],

      iconAnchor: [9, 9],

      popupAnchor: [0, -10]

    });


  return L.marker(
    latlng,
    {
      icon: icon,
      riseOnHover: true
    }
  );
}


// ------------------------------------------------------------
// 7. CREATE POPUP
// ------------------------------------------------------------

function createTouristPopup(feature) {

  const p =
    feature.properties;

  const color =
    CATEGORY_COLORS[p.group] || "#555555";


  return `

    <div
      style="
        min-width:280px;
        max-width:380px;
        font-family:Arial,sans-serif;
      "
    >

      <div
        style="
          background:${color};
          color:white;
          padding:13px;
          margin:-13px -20px 12px -20px;
          border-radius:8px 8px 0 0;
        "
      >

        <div
          style="
            font-size:19px;
            font-weight:bold;
            line-height:1.2;
          "
        >
          ${p.spot_name}
        </div>

        <div
          style="
            margin-top:4px;
            font-size:11px;
            text-transform:uppercase;
            letter-spacing:1px;
          "
        >
          ${p.category}
        </div>

      </div>


      <div style="margin-bottom:10px;">

        <div
          style="
            font-weight:bold;
            color:#174D50;
            font-size:12px;
            margin-bottom:3px;
          "
        >
          Description
        </div>

        <div
          style="
            font-size:12px;
            line-height:1.45;
            color:#444;
          "
        >
          ${p.description}
        </div>

      </div>


      <div style="margin-bottom:10px;">

        <div
          style="
            font-weight:bold;
            color:#174D50;
            font-size:12px;
            margin-bottom:3px;
          "
        >
          Entrance Fee
        </div>

        <div
          style="
            font-size:12px;
            line-height:1.45;
            color:#444;
          "
        >
          ${p.entrance_fee}
        </div>

      </div>


      <div style="margin-bottom:10px;">

        <div
          style="
            font-weight:bold;
            color:#174D50;
            font-size:12px;
            margin-bottom:3px;
          "
        >
          Best Season
        </div>

        <div
          style="
            font-size:12px;
            line-height:1.45;
            color:#444;
          "
        >
          ${p.best_season}
        </div>

      </div>


      <div>

        <div
          style="
            font-weight:bold;
            color:#174D50;
            font-size:12px;
            margin-bottom:3px;
          "
        >
          Family-Friendly Notes
        </div>

        <div
          style="
            font-size:12px;
            line-height:1.45;
            color:#444;
          "
        >
          ${p.family_friendly}
        </div>

      </div>

    </div>

  `;
}


// ------------------------------------------------------------
// 8. LOAD TOURISM GEOJSON
// ------------------------------------------------------------

fetch('caraga_tourism.geojson')

  .then(function(response) {

    if (!response.ok) {

      throw new Error(
        'Could not load caraga_tourism.geojson'
      );

    }

    return response.json();

  })

  .then(function(data) {


    const tourismLayer =
      L.geoJSON(
        data,
        {

          // --------------------------------------------------
          // CREATE MARKERS
          // --------------------------------------------------

          pointToLayer:
            function(feature, latlng) {

              const marker =
                createTouristMarker(
                  feature,
                  latlng
                );


              // Popup — autoClose/closeOnClick both false so it
              // stays open permanently once triggered, and only
              // closes when the visitor clicks the × button.
              marker.bindPopup(
                createTouristPopup(feature),
                {
                  maxWidth: 400,
                  closeButton: true,
                  autoPan: true,
                  autoClose: false,
                  closeOnClick: false
                }
              );


              // ------------------------------------------------
              // HOVER EFFECT — scales the inner dot only, never
              // the marker's own positioned wrapper element (see
              // note in createTouristMarker for why that matters).
              // ------------------------------------------------

              marker.on(
                'mouseover',
                function() {

                  const element =
                    this.getElement();

                  const dot =
                    element &&
                    element.querySelector(
                      '.tourist-marker-dot'
                    );

                  if (dot) {

                    dot.style.transform =
                      'scale(1.45)';

                  }

                }
              );


              marker.on(
                'mouseout',
                function() {

                  const element =
                    this.getElement();

                  const dot =
                    element &&
                    element.querySelector(
                      '.tourist-marker-dot'
                    );

                  if (dot) {

                    dot.style.transform =
                      'scale(1)';

                  }

                }
              );


              // ------------------------------------------------
              // CLICK = ZOOM TO SPOT + OPEN POPUP (stays open
              // until the visitor clicks its × button)
              // ------------------------------------------------

              marker.on(
                'click',
                function() {

                  marker.openPopup();

                  map.flyTo(
                    latlng,
                    14,
                    {
                      duration: 0.8
                    }
                  );

                }
              );


              return marker;

            },


          // --------------------------------------------------
          // PUT MARKERS INTO CATEGORY LAYERS
          // --------------------------------------------------

          onEachFeature:
            function(feature, layer) {

              const group =
                feature.properties.group;


              if (
                categoryLayers[group]
              ) {

                categoryLayers[group]
                  .addLayer(layer);

                // Index this spot for the search/filter box
                // (Section 10.5) — keeps a flat, searchable list
                // separate from the category layer groups so
                // search doesn't fight with the layer control's
                // own show/hide logic.
                searchIndex.push({
                  marker: layer,
                  group: group,
                  name: feature.properties.spot_name
                });

              }

            }

        }
      );


      // Add all categories
      beachesIslands.addTo(map);

      waterfallsRivers.addTo(map);

      mountainsNature.addTo(map);

      heritageCulture.addTo(map);


      // Zoom to all attractions

      const touristBounds =
        tourismLayer.getBounds();


      if (touristBounds.isValid()) {

        map.fitBounds(
          touristBounds,
          {
            padding: [30, 30]
          }
        );

      }

      revealMap();

    })

    .catch(function(error) {

      console.error(
        'Tourism GeoJSON error:',
        error
      );

      alert(
        'Unable to load caraga_tourism.geojson. ' +
        'Make sure it is in the same folder as index.html.'
      );

      revealMap();

    });


// ============================================================
// 9. PROVINCIAL BOUNDARIES
// ============================================================

const boundaryLayer =
  L.layerGroup();


// Local file first (bundled alongside index.html — see README note
// on how to generate it). Falls back to the live DENR FeatureServer
// only if the local file isn't present, since a government GIS
// endpoint being slow/down during grading would otherwise take the
// whole boundary layer with it.
const LOCAL_BOUNDARY_FILE =
  'caraga_boundaries.geojson';

const LIVE_BOUNDARY_URL =
  'https://fmbfsd.denr.gov.ph/server/rest/services/' +
  'Hosted/Provincial_Boundary/FeatureServer/0/query' +
  '?where=1%3D1' +
  '&outFields=province%2Cregion' +
  '&returnGeometry=true' +
  '&f=geojson';


function showBoundaryError(message) {

  const notice =
    L.control({ position: 'topright' });

  notice.onAdd = function() {

    const div =
      L.DomUtil.create('div', 'boundary-error-banner');

    div.innerHTML = message;

    return div;

  };

  notice.addTo(map);

}


function fetchBoundaryData() {

  // Try the local file first.
  return fetch(LOCAL_BOUNDARY_FILE)

    .then(function(response) {

      if (!response.ok) {

        throw new Error('No local boundary file');

      }

      return response.json();

    })

    .catch(function() {

      // Local file missing — fall back to the live DENR server.
      return fetch(LIVE_BOUNDARY_URL)

        .then(function(response) {

          if (!response.ok) {

            throw new Error(
              'Could not load provincial boundaries'
            );

          }

          return response.json();

        });

    });

}


fetchBoundaryData()

  .then(function(data) {


    const caragaProvinces = [

      "Agusan del Norte",

      "Agusan del Sur",

      "Surigao del Norte",

      "Surigao del Sur",

      "Dinagat Islands"

    ];


    const caragaFeatures =
      data.features.filter(
        function(feature) {

          const province =
            feature.properties.province;


          return caragaProvinces.some(
            function(name) {

              return (
                province &&
                province.toLowerCase() ===
                name.toLowerCase()
              );

            }
          );

        }
      );


    const caragaBoundaryData = {

      type:
        "FeatureCollection",

      features:
        caragaFeatures

    };


    const boundaries =
      L.geoJSON(
        caragaBoundaryData,
        {

          style:
            function() {

              return {

                color:
                  "#174D50",

                weight:
                  2,

                opacity:
                  0.9,

                fillColor:
                  "#DDF1ED",

                fillOpacity:
                  0.12

              };

            },


          onEachFeature:
            function(feature, layer) {


              const province =
                feature.properties.province;


              // Province label

              layer.bindTooltip(
                province,
                {
                  permanent: true,
                  direction: 'center',
                  className:
                    'province-label'
                }
              );


              // ------------------------------------------------
              // HOVER
              // ------------------------------------------------

              layer.on(
                'mouseover',
                function(event) {

                  const target =
                    event.target;


                  target.setStyle({

                    weight:
                      4,

                    color:
                      "#00C0A3",

                    fillColor:
                      "#00C0A3",

                    fillOpacity:
                      0.25

                  });


                  target.bringToFront();

                }
              );


              layer.on(
                'mouseout',
                function(event) {

                  boundaries.resetStyle(
                    event.target
                  );

                }
              );


              // ------------------------------------------------
              // CLICK = ZOOM TO PROVINCE
              // ------------------------------------------------

              layer.on(
                'click',
                function(event) {

                  map.fitBounds(
                    event.target.getBounds(),
                    {
                      padding: [40, 40],
                      maxZoom: 11
                    }
                  );

                }
              );


              // Province popup

              layer.bindPopup(

                `
                <div
                  style="
                    font-family:Arial;
                    min-width:180px;
                  "
                >

                  <div
                    style="
                      color:#174D50;
                      font-size:16px;
                      font-weight:bold;
                      margin-bottom:5px;
                    "
                  >
                    ${province}
                  </div>

                  <div
                    style="
                      font-size:12px;
                      color:#666;
                    "
                  >
                    Caraga Region
                  </div>

                  <div
                    style="
                      margin-top:8px;
                      font-size:12px;
                      color:#444;
                    "
                  >
                    Click the province to zoom
                    to its boundary.
                  </div>

                </div>
                `

              );

            }

        }
      );


    boundaries.addTo(
      boundaryLayer
    );


    boundaryLayer.addTo(map);

  })

  .catch(function(error) {

    console.error(
      'Boundary error:',
      error
    );

    showBoundaryError(
      'Provincial boundaries could not be loaded. ' +
      'Markers and popups still work normally.'
    );

  });


// ============================================================
// 9.5 DAY-TRIP ROUTES (BONUS — Slide 8, +3)
// ============================================================
// Two starting hubs:
//   - Guingona Park (Butuan) — the family meetup point where the
//     rented van begins every mainland route.
//   - Sayak Airport (Siargao) — a separate hub since Siargao is
//     reached by plane/ferry, not by van from the mainland.
// All 21 tourist spots are distributed across 8 routes below,
// each spot appearing in exactly one route so there's no overlap.
// Off by default — visitors switch a route on via the layer
// control when they want a ready-made itinerary.

const GUINGONA_PARK = {
  name: "Guingona Park",
  coords: [8.9477, 125.5432]
};

const SAYAK_AIRPORT = {
  name: "Sayak Airport (Siargao)",
  coords: [9.85889, 126.01389]
};


// ------------------------------------------------------------
// Hub markers — rendered once each, shared visually across every
// route that starts from them, so they never get duplicated.
// ------------------------------------------------------------

function buildHubMarker(hub, color, popupHTML) {

  const hubLayer =
    L.layerGroup();

  const hubIcon =
    L.divIcon({

      className: "",

      html: `
        <div
          style="
            background-color:${color};
            width:22px;
            height:22px;
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.5);
          "
        ></div>
      `,

      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -13]

    });

  const hubMarker =
    L.marker(
      hub.coords,
      {
        icon: hubIcon
      }
    );

  hubMarker.bindPopup(
    popupHTML,
    {
      autoClose: false,
      closeOnClick: false,
      maxWidth: 320
    }
  );

  hubMarker.addTo(hubLayer);

  return hubLayer;

}


const guingonaParkLayer =
  buildHubMarker(
    GUINGONA_PARK,
    "#000000",
    `<div style="font-family:Arial, sans-serif;">` +
    `<strong>Guingona Park</strong>` +
    `<br/><span style="font-size:12px;color:#444;">` +
    `The family meetup point in central Butuan City — where ` +
    `everyone gathers and the rented van begins the journey. ` +
    `Every mainland day-trip route below starts from here.` +
    `</span></div>`
  );


const sayakAirportLayer =
  buildHubMarker(
    SAYAK_AIRPORT,
    "#1565C0",
    `<div style="font-family:Arial, sans-serif;">` +
    `<strong>Sayak Airport</strong>` +
    `<br/><span style="font-size:12px;color:#444;">` +
    `Siargao Island's main airport, in Del Carmen. Since ` +
    `Siargao is reached by plane or ferry rather than by van, ` +
    `its two routes start here instead of Guingona Park.` +
    `</span></div>`
  );


// ------------------------------------------------------------
// Reusable builder — a dashed line from a shared start point to
// each stop in order, plus numbered markers for the stops only
// (the start point's own marker is one of the two hubs above,
// not re-rendered per route).
// ------------------------------------------------------------

function buildDayTripRoute(startPoint, stops, color, tooltipText) {

  const routeGroup =
    L.layerGroup();

  const lineCoords =
    [startPoint.coords].concat(
      stops.map(function(stop) {

        return stop.coords;

      })
    );

  const routeLine =
    L.polyline(
      lineCoords,
      {
        color: color,
        weight: 4,
        opacity: 0.85,
        dashArray: "8,6"
      }
    );

  routeLine.bindTooltip(
    tooltipText,
    {
      sticky: true
    }
  );

  routeLine.addTo(routeGroup);


  stops.forEach(function(stop, index) {

    const stopIcon =
      L.divIcon({

        className: "",

        html: `
          <div
            style="
              background-color:${color};
              color:white;
              width:24px;
              height:24px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 7px rgba(0,0,0,0.45);
              display:flex;
              align-items:center;
              justify-content:center;
              font-family:Arial, sans-serif;
              font-size:12px;
              font-weight:bold;
            "
          >${index + 1}</div>
        `,

        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14]

      });

    const stopMarker =
      L.marker(
        stop.coords,
        {
          icon: stopIcon
        }
      );

    stopMarker.bindPopup(
      `<div style="font-family:Arial, sans-serif;">` +
      `<strong>Stop ${index + 1}: ${stop.name}</strong>` +
      `<br/><span style="font-size:12px;color:#444;">` +
      `${stop.note}</span></div>`,
      {
        autoClose: false,
        closeOnClick: false
      }
    );

    stopMarker.addTo(routeGroup);

  });

  return routeGroup;

}


// ------------------------------------------------------------
// Route 1 — Butuan Heritage Loop
// ------------------------------------------------------------

const heritageRoute =
  buildDayTripRoute(
    GUINGONA_PARK,
    [
      {
        name: "Balanghai Boat Replica Site",
        note: "First stop — ancient balangay boat replicas.",
        coords: [8.96694904431361, 125.54045328088014]
      },
      {
        name: "Banza Church Ruins",
        note: "Second stop — a short walk from the balangay site.",
        coords: [8.972422496251488, 125.53837499139844]
      },
      {
        name: "Magellan's Anchorage Landing Site",
        note: "Final stop — historic landing site marker.",
        coords: [8.99952152570162, 125.48429682574522]
      }
    ],
    "#E64A19",
    "Guingona Park → Balanghai → Banza Church Ruins → " +
    "Magellan's Anchorage — a half-day heritage loop, all " +
    "within Butuan City."
  );


// ------------------------------------------------------------
// Route 2 — Butuan Nature Loop
// ------------------------------------------------------------

const natureRoute =
  buildDayTripRoute(
    GUINGONA_PARK,
    [
      {
        name: "Bood Eco Park",
        note: "First stop — riverside eco park close to the city.",
        coords: [8.9519, 125.4927]
      },
      {
        name: "Mt. Mayapay View Deck",
        note: "Second stop — panoramic Butuan viewpoint.",
        coords: [8.8795, 125.4878]
      },
      {
        name: "Alicia's Ridge Eco Park",
        note: "Final stop — ridge-top nature park.",
        coords: [8.8652, 125.4360]
      }
    ],
    "#2E7D32",
    "Guingona Park → Bood Eco Park → Mt. Mayapay → " +
    "Alicia's Ridge — a half-day nature loop around Butuan."
  );


// ------------------------------------------------------------
// Route 3 — Lake & Coastal North Route
// ------------------------------------------------------------

const lakeCoastalRoute =
  buildDayTripRoute(
    GUINGONA_PARK,
    [
      {
        name: "Lake Mainit",
        note: "First stop — one of the Philippines' deepest lakes.",
        coords: [9.4444, 125.5227]
      },
      {
        name: "Kitcharao View Deck",
        note: "Second stop — overlooking the lake basin.",
        coords: [9.4455, 125.5650]
      },
      {
        name: "Mabua Pebble Beach",
        note: "Final stop — unique pebble beach near Surigao City.",
        coords: [9.8130, 125.4384]
      }
    ],
    "#6A1B9A",
    "Guingona Park → Lake Mainit → Kitcharao → Mabua Pebble " +
    "Beach — a full driving day heading north (~95km one-way)."
  );


// ------------------------------------------------------------
// Route 4 — Agusan del Sur Eco Route
// ------------------------------------------------------------

const agusanSurRoute =
  buildDayTripRoute(
    GUINGONA_PARK,
    [
      {
        name: "Bega Falls",
        note: "First stop — a quieter, less crowded waterfall.",
        coords: [8.6999, 125.9758]
      },
      {
        name: "Agusan Marsh Wildlife Sanctuary",
        note: "Final stop — vast wetland and wildlife sanctuary.",
        coords: [8.3162, 125.8672]
      }
    ],
    "#F9A825",
    "Guingona Park → Bega Falls → Agusan Marsh — an eco-focused " +
    "route into Agusan del Sur."
  );


// ------------------------------------------------------------
// Route 5 — Bislig Waterfalls Trail
// ------------------------------------------------------------

const waterfallsRoute =
  buildDayTripRoute(
    GUINGONA_PARK,
    [
      {
        name: "Tinuy-an Falls",
        note: "First stop — the 'Little Niagara of the Philippines.'",
        coords: [8.17200038364854, 126.22830907049395]
      },
      {
        name: "Sian Falls",
        note: "Second stop — back north through Bislig.",
        coords: [8.250353473557206, 126.29544082004726]
      },
      {
        name: "Hinatuan Enchanted River",
        note: "Final stop — the striking blue spring-fed river.",
        coords: [8.458842717313662, 126.35471292970942]
      }
    ],
    "#00838F",
    "Guingona Park → Tinuy-an Falls → Sian Falls → Hinatuan " +
    "Enchanted River — a long full driving day (~110-150km " +
    "one-way); consider an overnight stay in Bislig."
  );


// ------------------------------------------------------------
// Route 6 — Surigao del Sur Beach Route
// ------------------------------------------------------------

const beachRoute =
  buildDayTripRoute(
    GUINGONA_PARK,
    [
      {
        name: "Cagwait White Beach",
        note: "First stop — long white sand beach.",
        coords: [8.9191, 126.3093]
      },
      {
        name: "Britania Group of Islets",
        note: "Final stop — cluster of small limestone islets.",
        coords: [8.6663, 126.1965]
      }
    ],
    "#0277BD",
    "Guingona Park → Cagwait White Beach → Britania Islets — " +
    "a Surigao del Sur beach day (~80km one-way)."
  );


// ------------------------------------------------------------
// Route 7 — Siargao Surf & Islands
// ------------------------------------------------------------

const siargaoSurfRoute =
  buildDayTripRoute(
    SAYAK_AIRPORT,
    [
      {
        name: "Cloud 9 Surfing Site",
        note: "First stop — world-famous surf break.",
        coords: [9.8132, 126.1643]
      },
      {
        name: "Guyam Island",
        note: "Second stop — tiny island, short boat ride out.",
        coords: [9.7651, 126.1678]
      },
      {
        name: "Daku Island",
        note: "Final stop — bigger island, great for lunch stops.",
        coords: [9.7412, 126.1591]
      }
    ],
    "#AD1457",
    "Sayak Airport → Cloud 9 → Guyam Island → Daku Island — " +
    "the classic General Luna surf and island-hopping loop."
  );


// ------------------------------------------------------------
// Route 8 — Siargao Lagoon & River
// ------------------------------------------------------------

const siargaoLagoonRoute =
  buildDayTripRoute(
    SAYAK_AIRPORT,
    [
      {
        name: "Sugba Blue Lagoon",
        note: "First stop — turquoise lagoon, kayaking and diving.",
        coords: [9.9063, 125.9003]
      },
      {
        name: "Maasin River Bridge",
        note: "Final stop — scenic river crossing, Del Carmen side.",
        coords: [9.8214, 126.0562]
      }
    ],
    "#00695C",
    "Sayak Airport → Sugba Blue Lagoon → Maasin River Bridge — " +
    "the Del Carmen lagoon and mangrove side of Siargao."
  );


// ============================================================
// 10. LAYER CONTROL
// ============================================================

const baseMaps = {

  "OpenStreetMap":
    osm,

  "CartoDB Voyager":
    cartoVoyager

};


const overlays = {

  "Provincial Boundaries":
    boundaryLayer,

  "Beaches & Islands":
    beachesIslands,

  "Waterfalls & Rivers":
    waterfallsRivers,

  "Mountains & Nature":
    mountainsNature,

  "Heritage & Culture":
    heritageCulture,

  "📍 Guingona Park (Meetup Point)":
    guingonaParkLayer,

  "✈️ Sayak Airport (Siargao Start)":
    sayakAirportLayer,

  "🚐 1. Butuan Heritage Loop":
    heritageRoute,

  "🚐 2. Butuan Nature Loop":
    natureRoute,

  "🚐 3. Lake & Coastal North":
    lakeCoastalRoute,

  "🚐 4. Agusan del Sur Eco Route":
    agusanSurRoute,

  "🚐 5. Bislig Waterfalls Trail":
    waterfallsRoute,

  "🚐 6. Surigao del Sur Beaches":
    beachRoute,

  "🏝️ 7. Siargao Surf & Islands":
    siargaoSurfRoute,

  "🏝️ 8. Siargao Lagoon & River":
    siargaoLagoonRoute

};


L.control.layers(
  baseMaps,
  overlays,
  {
    collapsed: false
  }
).addTo(map);


// ============================================================
// 10.5 SEARCH / FILTER ENGINE (BONUS — Slide 8, +3)
// ============================================================
// A plain search box, stacked directly under the layer control
// on the right side. Typing filters the 21 tourist spot markers
// by name or category — matching spots stay visible within
// whichever categories are currently checked on; everything else
// is temporarily hidden. Clearing the box restores normal
// category checkbox behavior.

const searchControl =
  L.control({
    position: 'topright'
  });

searchControl.onAdd = function() {

  const container =
    L.DomUtil.create(
      'div',
      'search-box-container'
    );

  container.innerHTML = `
    <input
      type="text"
      id="spotSearchInput"
      class="search-box-input"
      placeholder="Search spots by name or category..."
    />
    <div
      id="spotSearchCount"
      class="search-box-count"
    ></div>
  `;

  // Stop map clicks/drags from firing when interacting with
  // the search box (standard Leaflet control practice).
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);

  return container;

};

searchControl.addTo(map);


document
  .getElementById('spotSearchInput')
  .addEventListener(
    'input',
    function(event) {

      const term =
        event.target.value
          .trim()
          .toLowerCase();

      let matchCount = 0;

      searchIndex.forEach(function(item) {

        const matches =
          term === '' ||
          item.name.toLowerCase().includes(term) ||
          item.group.toLowerCase().includes(term);

        const categoryGroup =
          categoryLayers[item.group];

        if (matches) {

          categoryGroup.addLayer(item.marker);

          if (term !== '') {

            matchCount = matchCount + 1;

          }

        } else {

          categoryGroup.removeLayer(item.marker);

        }

      });

      const countDisplay =
        document.getElementById(
          'spotSearchCount'
        );

      if (term === '') {

        countDisplay.textContent = '';

      } else {

        countDisplay.textContent =
          matchCount + ' spot' +
          (matchCount === 1 ? '' : 's') +
          ' found';

      }

    }
  );


// ============================================================
// 11. LEGEND
// ============================================================

const legend =
  L.control({
    position: 'bottomright'
  });


legend.onAdd =
  function() {

    const div =
      L.DomUtil.create(
        'div',
        'map-legend'
      );


    div.innerHTML = `

      <div
        style="
          font-weight:bold;
          font-size:14px;
          color:#174D50;
          margin-bottom:8px;
        "
      >
        Tourist Categories
      </div>


      <div style="margin:5px 0;">

        <span
          style="
            display:inline-block;
            width:15px;
            height:15px;
            border-radius:50%;
            background:#00C0A3;
            margin-right:6px;
            vertical-align:middle;
          "
        ></span>

        Beaches & Islands

      </div>


      <div style="margin:5px 0;">

        <span
          style="
            display:inline-block;
            width:15px;
            height:15px;
            border-radius:50%;
            background:#008399;
            margin-right:6px;
            vertical-align:middle;
          "
        ></span>

        Waterfalls & Rivers

      </div>


      <div style="margin:5px 0;">

        <span
          style="
            display:inline-block;
            width:15px;
            height:15px;
            border-radius:50%;
            background:#2D8A53;
            margin-right:6px;
            vertical-align:middle;
          "
        ></span>

        Mountains & Nature

      </div>


      <div style="margin:5px 0;">

        <span
          style="
            display:inline-block;
            width:15px;
            height:15px;
            border-radius:50%;
            background:#D19B2A;
            margin-right:6px;
            vertical-align:middle;
          "
        ></span>

        Heritage & Culture

      </div>

    `;


    div.style.background =
      'white';

    div.style.padding =
      '12px 15px';

    div.style.borderRadius =
      '8px';

    div.style.boxShadow =
      '0 2px 10px rgba(0,0,0,0.25)';

    div.style.fontSize =
      '12px';


    return div;

  };


legend.addTo(map);


// ============================================================
// 12. EXTRA CSS
// ============================================================

const mapStyles =
  document.createElement('style');


mapStyles.innerHTML = `

  .province-label {

    background:
      rgba(255,255,255,0.90);

    border:
      none;

    box-shadow:
      0 1px 5px rgba(0,0,0,0.20);

    color:
      #174D50;

    font-weight:
      bold;

    font-size:
      11px;

    padding:
      3px 6px;

    border-radius:
      5px;

  }


  .leaflet-popup-content-wrapper {

    border-radius:
      8px;

    transition:
      box-shadow 0.15s ease;

  }


  .leaflet-popup-content-wrapper:hover {

    box-shadow:
      0 4px 18px rgba(0,0,0,0.35);

  }


  .leaflet-popup-content {

    margin:
      13px 20px;

  }


  .tourist-marker-dot {

    transition:
      transform 0.15s ease;

    transform-origin:
      center center;

  }


  .boundary-error-banner {

    background: #FFF4E5;
    border: 1px solid #E8A33D;
    color: #7A4A00;
    font-family: Arial, sans-serif;
    font-size: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    max-width: 220px;

  }


  .search-box-container {

    background: white;
    padding: 8px;
    border-radius: 6px;
    box-shadow: 0 1px 5px rgba(0,0,0,0.4);
    margin-top: 6px;

  }


  .search-box-input {

    width: 230px;
    box-sizing: border-box;
    padding: 6px 8px;
    font-family: Arial, sans-serif;
    font-size: 13px;
    border: 1px solid #ccc;
    border-radius: 4px;
    outline: none;

  }


  .search-box-input:focus {

    border-color: #2E7D32;

  }


  .search-box-count {

    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #666;
    margin-top: 4px;
    min-height: 14px;

  }


  #map {

    opacity: 0;
    transition: opacity 0.4s ease;

  }


  #map.map-ready {

    opacity: 1;

  }

`;

document.head.appendChild(
  mapStyles
);


// ============================================================
// END
// ============================================================
