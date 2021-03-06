// sets up my mapbox access token so they can track my usage of their basemap services
mapboxgl.accessToken = 'pk.eyJ1IjoiamVsbGkxMCIsImEiOiJjanVkOXE0b3IwdDM4NDRxcmw3ZzJuc201In0.YpaZ6sRzl9kVVJwJpcK9lA'
// instantiate the map

// instantiate the map
var map = new mapboxgl.Map({
  container: 'mapContainer',
  style: 'mapbox://styles/mapbox/satellite-streets-v9',
  center: [-73.9192152, 40.8534642],
  zoom: 14,
});

map.scrollZoom.disable();

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// a helper function for looking up colors and descriptions for NYC land use codes
var LandUseLookup = (code) => {
  switch (code) {
    case 1:
      return {
        color: '#f4f455',
          description: '1 & 2 Family',
      };
    case 2:
      return {
        color: '#f7d496',
          description: 'Multifamily Walk-up',
      };
    case 3:
      return {
        color: '#FF9900',
          description: 'Multifamily Elevator',
      };
    case 4:
      return {
        color: '#f7cabf',
          description: 'Mixed Res. & Commercial',
      };
    case 5:
      return {
        color: '#ea6661',
          description: 'Commercial & Office',
      };
    case 6:
      return {
        color: '#d36ff4',
          description: 'Industrial & Manufacturing',
      };
    case 7:
      return {
        color: '#dac0e8',
          description: 'Transportation & Utility',
      };
    case 8:
      return {
        color: '#5CA2D1',
          description: 'Public Facilities & Institutions',
      };
    case 9:
      return {
        color: '#8ece7c',
          description: 'Open Space & Outdoor Recreation',
      };
    case 10:
      return {
        color: '#bab8b6',
          description: 'Parking Facilities',
      };
    case 11:
      return {
        color: '#5f5f60',
          description: 'Vacant Land',
      };
    case 12:
      return {
        color: '#5f5f60',
          description: 'Other',
      };
    default:
      return {
        color: '#5f5f60',
          description: 'Other',
      };
  }
};

// use jquery to programmatically create a Legend
// for numbers 1 - 11, get the land use color and description
for (var i = 1; i < 12; i++) {
  // lookup the landuse info for the current iteration
  const landuseInfo = LandUseLookup(i);

  // this is a simple jQuery template, it will append a div to the legend with the color and description
  $('.legend').append(`
    <div>
      <div class="legend-color-box" style="background-color:${landuseInfo.color};"></div>
      ${landuseInfo.description}
    </div>
  `)
}

// a little object for looking up neighborhood center points
var neighborHoodLookup = {
  'gml': [-73.915066, 40.8587175],
  'jeromeave': [-73.9042463, 40.8584254],
  'bcc': [-73.9141889, 40.8572386],
}



// we can't add our own sources and layers until the base style is finished loading
map.on('style.load', function() {

  // add a button click listener that will control the map
  $('.flyto').on('click',
    function(e) {
      // pull out the data attribute for the neighborhood using query
      var neighborhood = $(e.target).data('neighborhood');

      // this is a useful notation for looking up a key in an object using a variable
      var center = neighborHoodLookup[neighborhood];

      // fly to the neighborhood's center point
      map.flyTo({
        center: center,
        zoom: 16.5
      });
    });

  // this sets up the geojson as a source in the map
  map.addSource('pluto', {
    type: 'geojson',
    data: 'data/pluto.geojson',
  });

  // this sets up the geojson as a source in the map
  map.addSource('jerome', {
    type: 'geojson',
    data: 'data/jerome.geojson',
  });

  // add a custom-styled layer for tax lots
  map.addLayer({
    id: 'pluto-fill',
    type: 'fill',
    source: 'pluto',
    paint: {
      'fill-opacity': 0.7,
      'fill-color': {
        type: 'categorical',
        property: 'landuse',
        stops: [
          [
            '01',
            LandUseLookup(1).color,
          ],
          [
            "02",
            LandUseLookup(2).color,
          ],
          [
            "03",
            LandUseLookup(3).color,
          ],
          [
            "04",
            LandUseLookup(4).color,
          ],
          [
            "05",
            LandUseLookup(5).color,
          ],
          [
            "06",
            LandUseLookup(6).color,
          ],
          [
            "07",
            LandUseLookup(7).color,
          ],
          [
            "08",
            LandUseLookup(8).color,
          ],
          [
            "09",
            LandUseLookup(9).color,
          ],
          [
            "10",
            LandUseLookup(10).color,
          ],
          [
            "11",
            LandUseLookup(11).color,
          ],
        ]
      }
    }
  }, 'waterway-label')



  // add an outline to the tax lots which is only visible after zoom level 14.8
  map.addLayer({
    id: 'pluto-line',
    type: 'line',
    source: 'pluto',
    paint: {
      'line-opacity': 0.7,
      'line-color': 'gray',
      'line-opacity': {
        stops: [
          [14, 0],
          [14.8, 1]
        ], // zoom-dependent opacity, the lines will fade in between zoom level 14 and 14.8
      }
    }
  });

  // add an empty data source, which we will use to highlight the lot the user is hovering over
  map.addSource('highlight-feature', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  })

  // add a layer for the highlighted lot
  map.addLayer({
    id: 'jeromeave',
    type: 'fill',
    source: 'jerome',
    paint: {
      'fill-color': 'red',
      'fill-opacity': 0.4,
    },
    filter: ['==', 'PROJECT_NAME', 'Jerome Avenue Rezoning']
  });

  // add a layer for the highlighted lot

  map.addLayer({
    id: 'highlight-line',
    type: 'line',
    source: 'highlight-feature',
    paint: {
      'line-width': 3,
      'line-opacity': 0.9,
      'line-color': 'black',
    }
  });



  // when the mouse moves, do stuff!
  map.on('mousemove', function(e) {
    // query for the features under the mouse, but only in the lots layer
    var features = map.queryRenderedFeatures(e.point, {
      layers: ['pluto-fill'],
    });

    // get the first feature from the array of returned features.
    var lot = features[0]

    if (lot) { // if there's a lot under the mouse, do stuff
      map.getCanvas().style.cursor = 'pointer'; // make the cursor a pointer

      var landuseDescription = LandUseLookup(parseInt(lot.properties.landuse)).description;

      // use jquery to display the address and land use description to the sidebar
      $('#address').text(lot.properties.address);
      $('#landmark').text(lot.properties.landmark);

      // set this lot's polygon feature as the data for the highlight source
      map.getSource('highlight-feature').setData(lot.geometry);
    } else {
      map.getCanvas().style.cursor = 'default'; // make the cursor default

      // reset the highlight source to an empty featurecollection
      map.getSource('highlight-feature').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  })
})


var popup = new mapboxgl.Popup({
    offset: 40
  })
  .setText('Gould Memorial Library');

var marker = new mapboxgl.Marker()
  .setLngLat([-73.9141477, 40.8587517])
  .setPopup(popup)
  .addTo(map);


if (lot) { // if there's a lot under the mouse, do stuff
  map.getCanvas().style.cursor = 'pointer';
} // make the cursor a pointer
