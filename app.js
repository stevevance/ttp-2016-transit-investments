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
	
/*	L.controlCredits({
	    image: "/images/the-transport-politic-logo.jpg",
	    link: "http://www.thetransportpolitic.com",
	    text: "Interactive mapping<br/>by GreenInfo Network",
	    width: 517,
	    height: 85
	}).addTo(map);
	
	*/
	
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
					style.dashArray = [2, 10];
		break;
		
		case "planned":
			style.dashArray = [2, 10];
		break;
		
		case "renovating":
				case "existing":
							style.weight = 2;
			style.lineCap = 'round';
								style.color = "#666666";
								break;
					case "future":
							style.weight = 4;
												style.dashArray = [5,10];
			style.lineCap = 'square';
								break;
								
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
		popupOptions = {minWidth: 180}
		popupOptions = {maxWidth: 220}
		popup = L.popup(popupOptions, layer);
		popup.setContent(content);
		layer.bindPopup(popup);
		
		if(type == "lines") {
			style.weight = 6;
			style.lineCap = 'round';
			
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
						style.dashArray = [2, 10];
						break;
		
				case "planned":
						console.log("got a status with a dash array");
						style.dashArray = [2,10];
						break;
				
				case "renovating":
						style.weight = 4;
						style.color = "#88B4E0";
						break;
				
				case "future":
						style.weight = 4;
						style.dashArray = [5,10];
						style.lineCap = 'square';
						break;
								
				case "existing":
						style.weight = 2;
						style.lineCap = 'round';
						style.color = "#666666";
						break;
								
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
	
	html = "<dl class=''>";
	$.each(properties, function(i,v) {
		if(!in_array(i, noshow) && v != undefined && v != "") {
			
			// Display certain properties differently
			switch(i) {
				
				case "Name":
				case "Routes":
					i = "";
					v = "";
				break;
			
				case "Cost_USD":
				case "Estimated_Cost":
					i = "<b>Estimated cost (USD)</b>: ";
					v = "$" + number_format(v); // display a number with thousands separators
				break;
				
				case "Cost_per_Mi_":
					i = "<b>Cost per mile</b>: ";
					v = "$" + number_format(v); // display a number with thousands separators
				break;
				
				case "Expected_Daily_Ridership":
					i = "<b>Estimated weekday riders</b>: ";
					v = number_format(v); // display a number with thousands separators
				break;
				
				case "Project_Website":
				case "Website":
					i = "";
					v = "<a href='" + v + "' target='_blank'>Project website</a>";
				break;
				
				case "Project_status":
					i = "<b>Status</b>: ";
				break;
				
				case "Travel_Time_Min_":
					i = "<b>Travel time</b>: ";
					v = v + " min.";
				break;
				
				case "Federal_funding_status":
					i = "<b>Federal status</b>: ";
				break;
				
				case "Mode":
					i = "<b>Type</b>: ";
				break;
				
				case "Avg__Speed":
					i = "<b>Average speed</b>: ";
					v = v + " mph";
				break;
				
				
				case "Construction_Start":
					i = "<b>Construction start</b>: ";
				break;
				
				case "Completion_Date":
					i = "<b>Completion date</b>: ";
				break;
				
				case "Direct_Federal_Support":
					i = "<b>Direct federal support</b>: ";
				break;
				
				case "Direct_Fed_Share":
								case "Direct_Fed__Share":
					i = "<b>Direct federal funding share</b>: ";
				break;
				
				case "Miles":
				case "Mi_":
					i = "<b>Length</b>: ";
					v = v + " mi."
				break;
				
				default:
					i = "<b>" + i + "</b>: ";
					v = v;
				break;
			}

			html += "<br />" + i + "" + v + "";
		}
	});
	
	html += "</dl>";
	
	return html;
	
}