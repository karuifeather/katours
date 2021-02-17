export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoia2VtdW1ha2lpaSIsImEiOiJja2psMW5wdW8wMWVlMnVseTZsbHZpYzFiIn0.JwU5WzgEZm8Py3s1eeyBBQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/kemumakiii/ckl8pdp5g06jl17nrq8jpp2ug',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((location) => {
    // Add a marker
    const element = document.createElement('div');
    element.className = 'marker';

    // Create marker in mapbox
    new mapboxgl.Marker({
      element,
      anchor: 'bottom',
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add a popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    // Extends the map bounds to include the current location
    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
