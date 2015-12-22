function makeMap() {

	var skobblerUrl1 = 'http://tiles{s}-73ef414d6fe7d2b466d3d6cb0a1eb744.skobblermaps.com/TileService/tiles/2.0/11021111200/0/{z}/{x}/{y}.png24';
	var streets = L.tileLayer(skobblerUrl1, {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		detectRetina:true,
		maxZoom: 19,
		maxNativeZoom: 18,
		subdomains: '1234'
	});
	var buildings = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		detectRetina:true,
		maxZoom: 20,
		maxNativeZoom: 19
	});
	var satellite = L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic3RldmV2YW5jZSIsImEiOiJqRVdYSnFjIn0.cmW3_zqwZpvcwPYc_C2SPQ', {
		attribution: '<a href="http://mapbox.com">Mapbox</a>',
		detectRetina:false,
		maxZoom: 20,
		maxNativeZoom: 19
	});

	// initialize the map on the "map" div with a given center and zoom
	map = L.map('map', {
	    center: [41.505, -87.4],
	    zoom: 15
	});
	
	// Make some empty layers that will be filled later
	var fakeData;
	layer = new L.featureGroup();
	geojsonLayers = [];
/*
	geojsonLayer = L.geoJson(fakeData, {
		//style: {},
		onEachFeature: onEachFeature	
	});
*/
	
	var otherLayers = {};
	
	// add the base layer maps
	var baseMaps = {"Streets": streets, "Building Names": buildings, "Satellite": satellite};
	streets.addTo(map); // load streets by default
	
	// create a layer control that turns on/off layers
	control = L.control.layers(baseMaps, otherLayers, {collapsed: false, autoZIndex: false}).addTo(map);
	
	L.controlCredits({
	    image: "/images/the-transport-politic-logo.jpg",
	    link: "http://www.thetransportpolitic.com",
	    text: "Interactive mapping<br/>by GreenInfo Network",
	    width: 517,
	    height: 85
	}).addTo(map);
	
	layer.addTo(map);
	
	// Adjust the map size
	resizeMap();
	$(window).on("resize", resizeMap);
}

function addGeoJsonLayer(file, layerId, name, type, status) {
	
	/*
	* A generic function that simply adds our GeoJSON file to the map
	* and fits the map bounds (the viewport) to the extents of the GeoJSON features (zooms in or out
	* to show all the features)
	*/
	
	window["layerId"] = layerId;
	
	console.log("adding GeoJSON file '" + file + "' with layerId '" + layerId + "'");
	$.getJSON(file, function() {
		console.log( "success" );
	})
	.done(function(data) {
		
		data = data;
		geojsonLayers[layerId] = L.geoJson(data, {
			onEachFeature: function(feature, layer) { onEachFeature(feature, layer, type, status) },
			//style: function() {return pickStyle(type, status); }
		});
		
		count = data.features.length;
		
		// Add the data to our GeoJSON layer
		geojsonLayers[layerId].addData(data);
		layer.addLayer(geojsonLayers[layerId]);
		
		// Fit the map to that layer 
		map.fitBounds(layer.getBounds());
		
		// Add the layer to our layer switcher
		control.addOverlay(geojsonLayers[layerId], name + " (" + count + ")");
	})
	.fail(function() {
		alert("Couldn't load your GeoJSON file; Is it where you said it is?")
	})
	.always(function() {

	});
	
}

function pickStyle(type, status) {
	style = {}
	console.log(status);
	
	switch(type) {
		case "rail":
			
		break;
	}
	
	switch(status) {
		case "funded":
		case "new_starts":
		case "planned":
			style.dashArray = [5, 2];
		break;
		
		case "renovating":
		case "under_construction":
		
		break;
	}
	
	return style;
}

function resizeMap() {
	
	/*
	* Resizes the map to fit the full height
	* It should be paired with a window.resize event so that it'll be resized
	* anytime the user resizes the window
	*/
	
	console.log("Window has been resized so let's resize the map to match");
	
	height = $("body").outerHeight();
	$("#map").height( height );
	map.invalidateSize();
	
	return height;
}

function onEachFeature(feature, layer, type, status) {
	
	/*
	* This function will be called for each feature in your GeoJSON file
	* and this is where you should customize whether there should be a popup on features
	* and how features should be styled
	*/
	
	var style = {};
	if(feature.properties) {
		
		p = feature.properties;
		//console.log(p);
		
		//link = "<a href='" + p.Website + "'>Website</a>";
		link = "";
		content = "<p><b>" + p.Name + "</b></p>" + link;
		content += showFeatureProperties(p);
		popupOptions = {minWidth: 300}
		popup = L.popup(popupOptions, layer);
		popup.setContent(content);
		layer.bindPopup(popup);
		
		if(type == "lines") {
			style.weight = 10;
			style.lineCap = 'square';
			
			switch(p.Mode) {
				case "Bus Rapid Transit":
					style.color = "#b2182b";
				break;
				
				default:
					style.color = "#2166ac";
				break;	
			}
			
			switch(status) {
				case "funded":
				case "new_starts":
				case "planned":
					console.log("got a status with a dash array");
					style.dashArray = [2,14];
				break;
				
				case "renovating":
				case "under_construction":
				
				break;
			}
	/*
			switch(layerId) {
				case "projects_funded_lines":
					style = {
						weight: 10,
						color: "#000",
						opacity: 0.3,
					}
				break;
				
				case "Y":
				
				break;
			}
	*/
	
			layer.setStyle(style);
		}
    }
}

function showFeatureProperties(properties) {
	// Don't show these properties ever:
	var noshow = ["timestamp", "begin", "end", "altitudeMode", "tessellate", "extrude", "visibility", "drawOrder", "icon", "description"];
	
	html = "";
	$.each(properties, function(i,v) {
		if(!in_array(i, noshow) && v != undefined && v != "") {
			
			// Display certain properties differently
			switch(i) {
				case "Cost_USD":
				case "Estimated_Cost":
					i = "<b>" + i + "</b>: ";
					v = "$" + number_format(v);
				break;
				
				case "Project_Website":
				case "Website":
					i = "";
					v = "<a href='" + v + "' target='_blank'>Website</a>";
				break;
				
				case "Miles":
				case "Mi_":
					i = "<b>Miles</b>: ";
				break;
				
				default:
					i = "<b>" + i + "</b>: ";
					v = v;
				break;
			}

			html += "<br />" + i + v;
		}
	})
	
	return html;
	
}

function in_array(needle, haystack, argStrict) {
  //  discuss at: http://phpjs.org/functions/in_array/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: vlado houba
  // improved by: Jonas Sciangula Street (Joni2Back)
  //    input by: Billy
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //   example 1: in_array('van', ['Kevin', 'van', 'Zonneveld']);
  //   returns 1: true
  //   example 2: in_array('vlado', {0: 'Kevin', vlado: 'van', 1: 'Zonneveld'});
  //   returns 2: false
  //   example 3: in_array(1, ['1', '2', '3']);
  //   example 3: in_array(1, ['1', '2', '3'], false);
  //   returns 3: true
  //   returns 3: true
  //   example 4: in_array(1, ['1', '2', '3'], true);
  //   returns 4: false

  var key = '',
    strict = !! argStrict;

  //we prevent the double check (strict && arr[key] === ndl) || (!strict && arr[key] == ndl)
  //in just one for, in order to improve the performance 
  //deciding wich type of comparation will do before walk array
  if (strict) {
    for (key in haystack) {
      if (haystack[key] === needle) {
        return true;
      }
    }
  } else {
    for (key in haystack) {
      if (haystack[key] == needle) {
        return true;
      }
    }
  }

  return false;
}

function number_format(number, decimals, dec_point, thousands_sep) {
  //  discuss at: http://phpjs.org/functions/number_format/
  // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: davook
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Theriault
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Michael White (http://getsprink.com)
  // bugfixed by: Benjamin Lupton
  // bugfixed by: Allan Jensen (http://www.winternet.no)
  // bugfixed by: Howard Yeend
  // bugfixed by: Diogo Resende
  // bugfixed by: Rival
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //  revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  //  revised by: Luke Smith (http://lucassmith.name)
  //    input by: Kheang Hok Chin (http://www.distantia.ca/)
  //    input by: Jay Klehr
  //    input by: Amir Habibi (http://www.residence-mixte.com/)
  //    input by: Amirouche
  //   example 1: number_format(1234.56);
  //   returns 1: '1,235'
  //   example 2: number_format(1234.56, 2, ',', ' ');
  //   returns 2: '1 234,56'
  //   example 3: number_format(1234.5678, 2, '.', '');
  //   returns 3: '1234.57'
  //   example 4: number_format(67, 2, ',', '.');
  //   returns 4: '67,00'
  //   example 5: number_format(1000);
  //   returns 5: '1,000'
  //   example 6: number_format(67.311, 2);
  //   returns 6: '67.31'
  //   example 7: number_format(1000.55, 1);
  //   returns 7: '1,000.6'
  //   example 8: number_format(67000, 5, ',', '.');
  //   returns 8: '67.000,00000'
  //   example 9: number_format(0.9, 0);
  //   returns 9: '1'
  //  example 10: number_format('1.20', 2);
  //  returns 10: '1.20'
  //  example 11: number_format('1.20', 4);
  //  returns 11: '1.2000'
  //  example 12: number_format('1.2000', 3);
  //  returns 12: '1.200'
  //  example 13: number_format('1 000,50', 2, '.', ' ');
  //  returns 13: '100 050.00'
  //  example 14: number_format(1e-8, 8, '.', '');
  //  returns 14: '0.00000001'

  number = (number + '')
    .replace(/[^0-9+\-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function(n, prec) {
      var k = Math.pow(10, prec);
      return '' + (Math.round(n * k) / k)
        .toFixed(prec);
    };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
    .split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '')
    .length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1)
      .join('0');
  }
  return s.join(dec);
}