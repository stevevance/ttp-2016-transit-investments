function makeMap() {

	var positron = 'https://cartodb-basemaps-d.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png';
	streetsPositron = L.tileLayer(positron, {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors / Map tiles <a href="https://carto.com/attributions">Carto</a>',
		detectRetina:true,
		maxZoom: 19,
		maxNativeZoom: 18,
		subdomains: '1234'
	});

	var skobblerUrlLite = 'http://tiles{s}-317f991e476cc08870b062b435c36491.skobblermaps.com/TileService/tiles/2.0/01021111200/7/{z}/{x}/{y}.png20';
	streets = L.tileLayer(skobblerUrlLite, {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors / Map tiles <a href="http://developer.skobbler.com/attribution">copyright Skobbler</a>',
		detectRetina:true,
		maxZoom: 19,
		maxNativeZoom: 18,
		subdomains: '1234'
	});
	
	var skobblerUrlNight = 'http://tiles{s}-317f991e476cc08870b062b435c36491.skobblermaps.com/TileService/tiles/2.0/01021111200/2/{z}/{x}/{y}.png20';
	night = L.tileLayer(skobblerUrlNight, {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors / Map tiles <a href="http://developer.skobbler.com/attribution">copyright Skobbler</a>',
		detectRetina:true,
		maxZoom: 19,
		maxNativeZoom: 18,
		subdomains: '1234'
	});

	buildings = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		detectRetina:true,
		maxZoom: 20,
		maxNativeZoom: 19
	});

	satellite = L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic3RldmV2YW5jZSIsImEiOiJqRVdYSnFjIn0.cmW3_zqwZpvcwPYc_C2SPQ', {
		attribution: '<a href="http://mapbox.com">Mapbox</a>',
		detectRetina:false,
		maxZoom: 20,
		maxNativeZoom: 19
	});
	special_toggle = false;
	
	urlParams = getUrlParams();
	if(urlParams.embed_lat != undefined && urlParams.embed_lng != undefined) {
		lat = urlParams.embed_lat;
		lng = urlParams.embed_lng;
	} else {
		lat = 48.8566;
		lng = 2.3522;
	}
	zoom = urlParams.embed_zoom || 12;

	// initialize the map on the "map" div with a given center and zoom
	map = L.map('map', {
	    center: [lat, lng],
	    zoom: zoom,
	    maxZoom: 18,
	    zoomControl: false // turning off the auto location of the zoom control (to the right)
	});
	var hash = new L.Hash(map);
	icons = createIcons();
	
	bounds = map.getBounds();
	
	// putting the zoom to the right
	L.control.zoom({
	     position:'topright'
	}).addTo(map);
	
	// Make some empty layers that will be filled later
	geojsonLayers = [];
	layerGroups = ["cities_points", "lines", "stations", "stations_existing", "street_stations", "rail_stations"];
	layerGroups["cities_points"] = new L.featureGroup();
	layerGroups["lines"] = new L.featureGroup();
	layerGroups["stations"] = new L.featureGroup();
	layerGroups["stations_existing"] = new L.featureGroup();
	layerGroups["street_stations"] = new L.featureGroup();
	layerGroups["rail_stations"] = new L.featureGroup();

	// Add those layers to the map (even though they're empty)
	layerGroups["cities_points"].addTo(map);
	layerGroups["lines"].addTo(map);
	layerGroups["stations"].addTo(map);
	layerGroups["stations_existing"].addTo(map);
	layerGroups["street_stations"].addTo(map);
	layerGroups["rail_stations"].addTo(map);
	
	// Keep track of whichever popup is open
	map.on("popupopen", function(e) {
		activePopup = e;
	});

	// Add a search box
	searchCtrl = L.control.fuseSearch({
		threshold: 0.3,
		maxResultLength: 10,
		showInvisibleFeatures: true,
		placeholder: "Lignes, stations, projets...",
		showResultFct: function(feature, container) {
	        props = feature.properties;
	        var name = L.DomUtil.create('b', null, container);
	        name.innerHTML = props.name || props.Name || props.line || props.ligne;
	        
	        var mode_type = props.mode;
	        var station_type = props.station;
	        var region = props.region || props.Region || props.ville;
	    	
	        container.appendChild(L.DomUtil.create('br', null, container));  
	        if(station_type == "station") {
				container.appendChild(document.createTextNode("Station / "));
		       } 
		    if(mode_type != null) {
				container.appendChild(document.createTextNode(mode_type));
				container.appendChild(document.createTextNode(" / "));
		       }   
			 if(region != null) {
				container.appendChild(document.createTextNode(region));
		       }      
	    /**    container.appendChild(document.createTextNode(mode_type));
	        container.appendChild(document.createTextNode(" / "));
	        container.appendChild(document.createTextNode(region)); **/
	    }
	});
	
	// add the base layer maps
	baseMaps = {"Rues": streets, "B&acirc;timents": buildings, "Satellite": satellite};
	map.addLayer(streets);
	
	// Adjust the map size
	resizeMap();
	$(window).on("resize", resizeMap);
}

function changeIfMobile() {
	urlParams = getUrlParams();
	console.log(urlParams);
	
	// Always do these things
	$("#mobile_symbology").html( $("#symbology").clone() ); // copy the symbology to the one used in the mobile key
	
	// Do these things if it's a small screen
	if(isMobile.phone == true || urlParams.embed_mobile == "true") {
		$("#left-mid").hide();
		document.getElementById('left-mid').style.display = 'none'; // in case there's no jQuery, like on the embed
		//document.getElementById('mobile-key').style.display = 'block';
	} else {
		// not small screen, hide all the things that are mobile only
		$(".mobile-only").hide();
		searchCtrl.addTo(map);
	}
}

function toggleMobileKey() {
	console.log("toggling the mobile key");
	$("#mobile-key").toggle();
	
	urlParams = getUrlParams();
	if(urlParams.embed_mobile == "true") {
		if(document.getElementById('mobile-key').style.display == 'block') {
			document.getElementById('mobile-key').style.display = 'none';
		}
		if(document.getElementById('mobile-key').style.display == 'none') {
			document.getElementById('mobile-key').style.display = 'block';
		}
	}
	
	if($("#mobile-key").is(":visible")) {
		$("#action-icon").removeClass("fa-caret-down").addClass("fa-caret-up");
	} else {
		$("#action-icon").removeClass("fa-caret-up").addClass("fa-caret-down");
	}
}

function toggleBaseMap(changeto) {
	name = changeto || $('#baselayer_select').find(':selected').data('name');
	console.log("toggleBaseMap: changing to "+ name);
	$.each(baseMaps, function(i, v) {
		if(map.hasLayer(baseMaps[i])) {
			map.removeLayer(baseMaps[i]);
		}
	});
	
	map.addLayer(baseMaps[name]);
	setTimeout(function() {
		$('#baselayer_select').find('[data-name=' + name + ']').prop("selected","selected");
	}, 100);
}

function selectBaseMap() {
	var html = "<p>Changez la carte";
	select = "<select id='baselayer_select' onchange=\"toggleBaseMap();\">";
	
	$.each(baseMaps, function(i, v) {
		select += "<option data-name='" + i + "'>" + i + "</option>";
	});
	
	select += "</select>";
	html += select + "</p>";
	
	$("#baselayers").html(html);
}

function processLayers(layers, layerId) {
	count = layers.length;
	iteration = 0;
	
	// We can process one layer, or all layers
	$.each(layers, function(i, v) {
		if(layerId != undefined) {
			if(layerId == v.layerId) {
				addGeoJsonLayer(v.file, v.layerId, v.name, v.type, v.status, v.zoomRange, v.special);
			} else {
				// this isn't the layer we're looking for
			}
		} else {
			addGeoJsonLayer(v.file, v.layerId, v.name, v.type, v.status, v.zoomRange, v.special);
		}
		iteration++;
	});

	
	$("a[title=Search]").on("click", function() {
		searchCtrl.initiateFuse(["name", "Name", "Mode1", "ligne", "ville", "Region", "Mode"]);
	});
}

function selectKeyCity(whichId) {
	var html = "<p>Zoomez";
	select = "<select id='" + whichId + "_select' onchange=\"zoomToCity('" + whichId + "_select');\"><option>Choisissez</option>";
	
	$.each(cities, function(i, v) {
		select += "<option data-latitude='" + v.lat + "' data-longitude='" + v.lng + "' data-level='" + v.level + "'>" + v.name + "</option>";
	});
	
	select += "</select>";
	html += select + "</p>";
	
	$("#" + whichId).html(html);
}

function zoomToCity(id) {
	lat = $('#' + id).find(':selected').data('latitude');
	lng = $('#' + id).find(':selected').data('longitude');
	level = $('#' + id).find(':selected').data('level');
	map.setView([lat, lng], [level]/**12**/);
}

function zoomHere() {
	map.setView(activePopup.popup._latlng, 14);
}

function addGeoJsonLayer(file, layerId, name, type, status, zoomRange, special) {
	
	/*
	* A generic function that simply adds our GeoJSON file to the map
	* and fits the map bounds (the viewport) to the extents of the GeoJSON features (zooms in or out
	* to show all the features);
	* parameter:zoomRange is an array [13,99] that tells the highest and lowest zoom levels this layer can be shown at
	*/
		
	console.log("adding GeoJSON file '" + file + "' with layerId '" + layerId + "'");
	$.getJSON(file, function() {
		//console.log( "success" );
	})
	.done(function(data) {
		geojsonLayers[layerId] = L.geoJson(data, {
			onEachFeature: function(feature, layer) { onEachFeature(feature, layer, type, status) },
			zoomRange: zoomRange,
			type: type,
			status: status,
			layerId: layerId,
			special: special
		});
		//geojsonDatas.push(data);
		layerBounds = geojsonLayers[layerId].getBounds();
		bounds.extend(layerBounds);
		
		// Index the features for searching
		if(type != "cities_points") {
			searchCtrl.indexFeaturesMultipleLayers(data.features, ['Name', 'name', 'ville', 'ligne', 'region', 'Mode1', 'Region', 'Mode']);
		}
		
		// Only show this layer at certain zoom levels
		if(zoomRange != undefined) {
			map.on("zoomend", function() {
				toggleLayer();
			});
			shouldWeShowLayer(layerId); // should we show it now?
		} else {
			console.log("Layer doesn't have zoomRange, so we're adding a layerId '" + layerId + "' of type '" + type + "' now");
			if(special == undefined || special == false) {
				layerGroups[type].addLayer(geojsonLayers[layerId]);
			}
		}
	})
	.fail(function() {
		alert("Couldn't load your GeoJSON file; Is it where you said it is?")
	})
	.always(function() {

	});
}

function toggleLayer() {
	// Check to see if we're within range, and then hide or show the map layer
	zoom = map.getZoom();
	
	if(!special_toggle) {
		$.each(layers, function(i, v) {
			if(v.zoomRange != undefined) {
				var max = Math.max.apply(Math, v.zoomRange);
				var min = Math.min.apply(Math, v.zoomRange);
				
				if(zoom >= min && zoom <= max) {
					// current zoom is within the range
					if(layerGroups[v.type] != undefined && (v.special == undefined || v.special == false)) {
						layerGroups[v.type].addLayer(geojsonLayers[v.layerId]);
					}
				} else {
					if(layerGroups[v.type] != undefined && layerGroups[v.type].hasLayer(geojsonLayers[v.layerId]) && (v.special == undefined || v.special == false)) {
						layerGroups[v.type].removeLayer(geojsonLayers[v.layerId]);
					}
				}
			}
		});
	}
}

function shouldWeShowLayer(layerId) {
	zoom = map.getZoom();
	v = geojsonLayers[layerId].options;
	
	if(v.zoomRange != undefined) {
		var max = Math.max.apply(Math, v.zoomRange);
		var min = Math.min.apply(Math, v.zoomRange);
		
		if(zoom >= min && zoom <= max) {
			// current zoom is within the range
			if(layerGroups[v.type] != undefined && (v.special == undefined || v.special == false)) {
				layerGroups[v.type].addLayer(geojsonLayers[v.layerId]);
			}
		} else {
			if(layerGroups[v.type] != undefined && layerGroups[v.type].hasLayer(geojsonLayers[v.layerId]) && (v.special == undefined || v.special == false)) {
				layerGroups[v.type].removeLayer(geojsonLayers[v.layerId]);
			}
		}
	}
}

function toggleSpecialLayers(which_layer) {
	
	/* A special layer is essentially an alternative state of the map.
	* Turn on a special layer and other layers get turned off
	*/
	
	if(map.hasLayer(geojsonLayers[which_layer])) {
	
		// Remove the special layer
		map.removeLayer(geojsonLayers[which_layer]);
		special_toggle = false;
		
		// Remove the "night" layer
		if(map.hasLayer(night)) {
			map.removeLayer(night);
		}
		
		// Reset the style of existing lines (which was changed when a special layer was added)
		map.removeLayer(geojsonLayers["existing_lines"]);
		processLayers(layers, "existing_lines");
		
		// Re-add the regular, non-special layers
		$.each(layers, function(i, v) {
			if(v.status != "existing" && v.special != true) { // always show existing things along with the "special" (cancelled lines)
				if(layerGroups[v.type] != undefined && !layerGroups[v.type].hasLayer(geojsonLayers[v.layerId])) {
					layerGroups[v.type].addLayer(geojsonLayers[v.layerId]);
				}
			}
		});
		
		// return to the default "streets" map
		console.log("Returning to the default Streets map");
		toggleBaseMap("Streets");
		$("#baselayer_select").removeAttr("disabled");
		
	} else {
		special_toggle = true;
		
		if(!map.hasLayer(night)) {
			map.addLayer(night);
		}
		night.bringToFront();
		$("#baselayer_select").attr("disabled", "disabled");
		
		// Change the style of existing lines to something that goes better with the "night" base layer
		style = {
			color: "#fff",
			weight: 3
		}
		geojsonLayers["existing_lines"].setStyle(style);
		
		// Change the style of cancelled lines
/*
		style = {
			// leave this object empty and the style won't change
		}
		geojsonLayers[which_layer].setStyle(style);
*/
		map.addLayer(geojsonLayers[which_layer]);
		
		// Remove layers
		$.each(layers, function(i, v) {
			if(v.status != "existing" && v.special != true) { // always show existing things along with the "special" (cancelled lines)
				if(layerGroups[v.type] != undefined && layerGroups[v.type].hasLayer(geojsonLayers[v.layerId])) {
					layerGroups[v.type].removeLayer(geojsonLayers[v.layerId]);
				}
			}
		});
	}
	
}

function resizeMap() {
	
	/*
	* Resizes the map to fit the full height
	* It should be paired with a window.resize event so that it'll be resized
	* anytime the user resizes the window
	*/
	
	console.log("Window has been resized so let's resize the map to match");
	
	setTimeout(function() {
		height = $("body").outerHeight();
		$("#map").height( height );
		map.invalidateSize();
		
		return height;
	}, 100); // I don't know why we have to wait 100 ms before we can get the new height
	
}

function createIcons() {
	icons = [];
	
	icons["cities_points"] = L.divIcon({className: 'cities_points_css', iconSize: [10, 10], iconAnchor: [10, 10]});
	
	icons["stations_existing"] = L.divIcon({className: 'existing_stations_css', iconSize: [4, 4], iconAnchor: [4, 4]});
	
	icons["street_stations"] = L.divIcon({className: 'street_stations_css', iconSize: [3, 3], iconAnchor: [3, 3]});
	
	icons["rail_stations"] = L.divIcon({className: 'rail_stations_css', iconSize: [4, 4], iconAnchor: [4, 4]});
		
	icons["stations"] = L.AwesomeMarkers.icon({
		icon: 'subway',
		prefix: 'fa',
		markerColor: 'red'
		// non-existing station
	});

	return icons;
}

function onEachFeature(feature, layer, type, status) {
	
	/*
	* This function will be called for each feature in your GeoJSON file
	* and this is where you should customize whether there should be a popup on features
	* and how features should be styled
	*/
	
	if(feature.properties) {
		
		p = feature.properties;
		
		// Set popup content
		var content = "<p class='feature-heading'>" + p.ligne + "</p>";
		content += "<p class='feature-text'>" + showFeatureProperties(p) + "</p>";
		
		var lat = feature.geometry.coordinates[1];
		var lng = feature.geometry.coordinates[0];
		content += "<button onclick=\"zoomHere();\">Zoom in</button>";
		
		// Set popup options
		popupOptions = {maxWidth: 280, minWidth: 150}
		popup = L.popup(popupOptions, layer);
		popup.setContent(content);
		layer.bindPopup(popup);
		label = p.name;
		//layer.bindLabel(label);
		
		if(type == "cities_points") {
			layer.bindLabel(label, { noHide: true })/**;
			map**/.on('popupopen', function(centerMarker) {
       		 var cM = map.project(centerMarker.popup._latlng);
	        cM.y -= centerMarker.popup._container.clientHeight/200
    	    map.setView(map.unproject(cM),12, {animate: true});
    });
		}
		
		else{
			layer.bindLabel(label);
		}
		
		
		// Add the layer object to the feature itself so the Fuse search can deal with it
		feature.layer = layer;
		
		// Change the icons for stations
		if(type == "stations" || type == "cities_points" || type == "stations_existing" || type == "street_stations" || type == "rail_stations") {
			layer.setIcon(icons[type]);
		}
		
		// Change the styling for lines
		if(type == "lines") {
			style = chooseStyle(type, status, p);
			layer.setStyle(style);
		}
    }
}

function chooseStyle(type, status, properties) {
	
	p = properties;
	
	// set some default styles for lines
	var style = {};
	style.weight = 6;
	style.lineCap = 'round';
	
	mode = p.mode || p.Mode1;
	switch(mode) {
		case "Bus Rapid Transit":
		case "BRT":
		case "BHNS":
			style.color = "#b2182b";
		break;
		
		case "Tramway":
			style.color = "#B57600";
		break;
		
		case "RER":
			style.color = "#088A4B";
		break;
		
		case "Train":
			style.color = "#848484";
			style.weight = 2;
		break;
		
		default:
			style.color = "#0D608C";
		break;	
	}
	
	
	switch(status) {
		case "funded":
		case "new_starts":
				style.weight = 3;
				style.dashArray = [5,5,1,5];
				style.lineCap = 'square';
				style.opacity = 0.9;
				break;

		case "planned":
				style.dashArray = [2,10];
				break;
		
		case "renovating":
				style.weight = 4;
				style.color = "#88B4E0";
				break;
		
		case "future":
				style.weight = 3;
				style.dashArray = [5,8,1,8];
				style.lineCap = 'square';
				break;
						
		case "existing":
				style.weight = 3;
				style.lineCap = 'round';
			//	style.color = "#5E5E5E";
				style.opacity = 0.7;
				
				switch(mode) {
					case "Tram-Train":
					case "Tramway":
				//	style.color = "#5E5E5E";
					style.weight = 3;
				//	style.dashArray = [1,3];
					style.lineCap = 'round';
					break;
					}
					
				switch(mode) {
					case "BHNS":
				//	style.color = "#5E5E5E";
					style.weight = 3;
				//	style.dashArray = [5,3];
					style.lineCap = 'square';
					break;
					}
				
				break;
						
		case "under_construction":
		
		break;
		
		case "cancelled":
				style.weight = 6;
				style.color = "#ffff00";
				style.lineCap = 'square';
				break;
				
		case "ballot":
				style.weight = 6;
				style.color = "#ffff00";
				style.lineCap = 'square';
				break;
				
	}
	
	return style;
}

function showFeatureProperties(properties) {
	// Don't show these properties ever:
	var noshow = ["Name", "name", "Routes", "station", "ligne", "timestamp", "begin", "end", "altitudeMode", "tessellate", "extrude", "visibility", "drawOrder", "icon", "description"];
	
	html = "<dl class=''>"; // use <dl> for a simple data list
	
	// Iterate through each of the features and craft together a popup
	$.each(properties, function(i,v) {
		if(!in_array(i, noshow) && v != undefined && v != "") {
			
			// Display certain properties differently
			switch(i) {
			
				case "Cost_USD":
				case "Estimated_Cost":
				case "Estimated_":
				case "Cost":
				case "cout":
					i = "<b>Cout estim&eacute;</b>: ";
					v = number_format(v) + "&euro;"; // display a number with thousands separators
				break;
				
				case "Cost_per_Mi_":
				case "Cost_per_M":
					i = "<b>Cost per mile</b>: ";
					v = "$" + number_format(v); // display a number with thousands separators
				break;
				
				case "Expected_Daily_Ridership":
				case "Expected_D":
				case "traficjour":
					i = "<b>Trafic journalier estim&eacute;</b>: ";
					v = number_format(v); // display a number with thousands separators
				break;
				
				case "Project_Website":
				case "Website":
				case "Project_We":
				case "Web":
				case "siteweb":
					i = "";
					v = "<a href='" + v + "' target='_blank'>Site web</a>";
				break;
				
				case "Learn_More":
					i = "";
					v = "<a href='" + v + "' target='_blank'>Learn more about this project</a>";
				break;
				
				case "Project_status":
				case "Project_st":
					i = "<b>Status</b>: ";
				break;
				
				case "Travel_Time_Min_":
				case "Travel_Tim":
					i = "<b>Travel time</b>: ";
					v = v + " min.";
				break;
				
				case "Federal_funding_status":
					i = "<b>Federal status</b>: ";
				break;
				
				case "Mode":
				case "Mode1":
				case "Type":
				case "mode":
					i = "";
				break;
				
				case "Avg__Speed":
					i = "<b>Average speed</b>: ";
					v = v + " mph";
				break;
				
				case "Construction_Start":
				case "Constructi":
				case "Construct":
				case "constructi":
					i = "<b>Travaux</b>: ";
				break;
				
				case "Completion_Date":
				case "Date":
					i = "<b>Completion date</b>: ";
				break;
				
				case "Direct_Federal_Support":
					i = "<b>Direct federal support</b>: ";
				break;
				
				case "Direct_Fed_Share":
				case "Direct_Fed":
				case "Direct_F_1":
								case "Direct_Fed__Share":
					i = "<b>Direct federal funding share</b>: ";
				break;
				
				case "Miles":
				case "Mi_":
				case "Mi":
				case "km":
					i = "<b>Longeur</b>: ";
					v = v + " km"
				break;
				
				case "Riders":
					i = "<b>Daily riders projected before project opening</b>: ";
					v = number_format(v);
				break;
				
				case "ville":
					i = "";
					v = v
				break;
				
				case "Year_Open":
				case "year":
					i = "<b>Ann&eacute;e d'ouverture</b>: ";
					v = v
				break;
				
				case "Info":
					i = "<b>Ballot measure</b>: ";
					v = v
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

function getUrlParams() {
	var urlParams;
	(window.onpopstate = function () {
	    var match,
	        pl     = /\+/g,  // Regex for replacing addition symbol with a space
	        search = /([^&=]+)=?([^&]*)/g,
	        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	        query  = window.location.search.substring(1);
	
	    urlParams = {};
	    while (match = search.exec(query))
	       urlParams[decode(match[1])] = decode(match[2]);
	})();
	
	return urlParams;
}
