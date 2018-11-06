var dataset;
var mapWidth = 1000;
var mapHeight = 600;
var ratings;
var counts;
var averages = [];
var countries;
var data2;
var color;

d3.csv("zomato-restaurants-data/Country-Code.csv", function(error, data){
	if(error){
		console.log("Error loading CSV data");
	}else{
		countries = data;
	}
});

d3.csv("zomato-restaurants-data/zomato.csv", function(error, data){

	if(error){
		console.log("Error loading CSV data");
	}else{
		dataset = data;

		ratings = d3.nest()
		  .key(function(d) { return d.Country_Code;})
		  .rollup(function(d) { 
		   return d3.sum(d, function(g) {return g.Aggregate_rating; });
		  }).entries(data);

		counts = d3.nest()
		  .key(function(d) { return d.Country_Code;})
		  .rollup(function(d) { 
		   		return d.length;
		  }).entries(data);

		data2 = d3.nest()
				  .key(function(d) { return d.Country_Code; })
				  .rollup(function(v) { 

				  	var c1 = 0;
				  	var c2 = 0;
				  	var c3 = 0;
				  	var c4 = 0;

				  	for(var i=0; i<v.length; i++){
				  		if(v[i].Price_range == 1)
				  			c1 += 1;
				  		else if(v[i].Price_range == 2)
				  			c2 += 1;
				  		else if(v[i].Price_range == 3)
				  			c3 += 1;
				  		else if(v[i].Price_range == 4)
				  			c4 += 1;
				  	}

				  	return {
					    c1: c1,
					    c2: c2,
					    c3: c3,
					    c4: c4
				  	}; 
				})
  				.entries(dataset);
  		console.log(data2);

		generateMap();
	}
	
});



function generateMap(){

	// console.log(ratings);
	// console.log(counts);

	var svg = d3.select("body")
				.append("svg")
				.attr("width", mapWidth)
				.attr("height", mapHeight)
				.attr("id", "map_svg");


	var projection = d3.geoMercator()
					    .scale(mapWidth / 2 / Math.PI)
					      //.scale(100)
      					.translate([mapWidth / 2, 3*mapHeight/4]);

    var path = d3.geoPath()
      .projection(projection);
    
    d3.json("world.geo.json-master/countries.geo.json", function(err, geojson) {


		for (var i = 0; i < countries.length; i++) {
		
			var code = countries[i].Country_Code;
			var name = countries[i].Country;
			// console.log(name);
	
			for (var j = 0; j < geojson.features.length; j++) {

				var geoName = geojson.features[j].properties.name;
				
				
				if (name == geoName) {
					// console.log(geoName);
					// var average_rating = ratings[code];
					geojson.features[j].properties.country_code = code;
					index = -1;
					for(var k=0; k<ratings.length; k++){
						if(ratings[k].key == code)
							index = k;
					}

					// console.log(code);

					if(index != -1){

						geojson.features[j].properties.average_rating = ratings[index].value/counts[index].value;
						averages.push(ratings[index].value/counts[index].value);
						
					}
					
					
				}
			}
		}
		// console.log(averages);
		averages.sort();
		// console.log(averages);
		color = d3.scaleLinear()
					.domain(averages)
					.interpolate(d3.interpolateHcl)
					.range([d3.rgb("#FF4500"), d3.rgb('#FFA500'), d3.rgb('#FFFF00'), d3.rgb('#FFFF00'), d3.rgb('#FFFF00'), d3.rgb('#90EE90'), d3.rgb('#90EE90'),
						d3.rgb("#90EE90"), d3.rgb('#90EE90'), d3.rgb('#008000'), d3.rgb('#008000'), d3.rgb('#008000'), d3.rgb('#008000'), d3.rgb('#006400')]);

      
        svg.selectAll("path")
      	.data(geojson.features)
      	.enter()
      	.append("path")
        .attr("d", path)
        .style("fill", function(d) {
			//Get data value
			var value = d.properties.average_rating;
			// console.log(value);
			if (value) {
			//If value exists...
				return color(value);
			} else {
			//If value is undefined...
				return "#ccc";
			}
		})
		.on("click", function(d){
			if(d.properties.country_code)
				drawPieChart(d.properties.country_code, d.properties.name);
		})
		.on("mouseover", function(d){
			
		});

    });

    var north = svg.append("g")
					.attr("class", "pan")
					.attr("id", "north");
//All share the 'pan' class
//The ID will tell us which direction to head
	north.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", mapWidth)
			.attr("height", mapHeight)
			.style("fill", "#EEEEEE");
	
	north.append("text")
			.attr("x", mapWidth/2)
			.attr("y", mapHeight)
			.html("&uarr;");

	d3.selectAll(".pan")
			.on("click", function() {

				//Get current translation offset
				var offset = projection.translate();
				//Set how much to move on each click
				var moveAmount = 50;
				//Which way are we headed?
				var direction = d3.select(this).attr("id");

				switch (direction) {
					case "north":
						offset[1] += moveAmount;
						break;
					case "south":
						offset[1] -= moveAmount;
						break;
					case "west":
						offset[0] += moveAmount;
						break;
					case "east":
						offset[0] -= moveAmount;
						break;
					default:
						break;
				}

				projection.translate(offset);

				svg.selectAll("path")
						.attr("d", path);
			//... Do stuff!
			});

	//Update all paths and circles
		svg.selectAll("path")
			.transition()
			// <-- New!
			.attr("d", path);

    // console.log("yo yo yo");
	//Define what to do when dragging
	var dragging = function(d) {
		console.log(d);
		//Log out d3.event, so you can see all the goodies inside
		//console.log(d3.event);
		//Get the current (pre-dragging) translation offset
		var offset = projection.translate();
		//Augment the offset, following the mouse movement
		offset[0] += d3.event.dx;
		offset[1] += d3.event.dy;

		//Update projection with new offset
		projection.translate(offset);
		//Update all paths and circles
		svg.selectAll("path")
			.attr("d", path);
	}

	// console.log("yo yo");
	//Then define the drag behavior
	var drag = d3.drag()
				.on("drag", dragging);

    // console.log("yo");

	//Create a container in which all pan-able elements will live
	var map = svg.append("g")
				.attr("id", "map")
				.call(drag); //Bind the dragging behavior

	map.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", mapWidth)
		.attr("height", mapHeight)
		.attr("opacity", 0);

	drawPieChart(1, "India");


}

function drawPieChart(code, name){


    var countryData  = [];
    for(var i=0; i<data2.length; i++){
    	if(data2[i].key == code){

    		if(data2[i].value.c1 != 0)
    			countryData.push(data2[i].value.c1);
    		if(data2[i].value.c2 != 0)
    			countryData.push(data2[i].value.c2);
    		if(data2[i].value.c3 != 0)
    			countryData.push(data2[i].value.c3);
    		if(data2[i].value.c4 != 0)
    			countryData.push(data2[i].value.c4);

    		break;
    	}
    }

    var width = 800,
	height = 400,
	radius = Math.min(width, height) / 2;

	var color = d3.scaleOrdinal()
		    .range(["#4682B4","#1E90FF", "#00BFFF", "#87CEFA"]);

	var arc = d3.arc()
		    .outerRadius(radius-30)
		    .innerRadius(0);

	var labelArc = d3.arc()
		    .outerRadius(radius-10)
		    .innerRadius(radius-10);

	var pie = d3.pie()
		    .sort(null)
		    .value(function(d) { return d; });
    var svg;
    var g;


    	d3.select("body").select("#pie").remove();
    	d3.select("body").select("#cname").remove();



		svg = d3.select("body").append("svg")
		    .attr("width", width)
		    .attr("height", height)
		    .attr("id", "pie")
		  	.append("g")
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		g = svg.selectAll(".arc")
	      	.data(pie(countryData))
	    	.enter().append("g")
	      	.attr("class", "arc");

	     g.append("path")
	      .attr("d", arc)
	      .style("fill", function(d) { return color(d.data); });

		g.append("text")
		      .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
		      .attr("dy", ".25em")
		      .text(function(d, i) { i += 1; var str = ""; while(i--){str += "$"} return str + " (" + d.data + ")"; });

		d3.select("body").append("h2")
			.text("Country Selected: "+ name )
			.attr("margin-right", "100px")
			.attr("id", "cname")
			.attr("align", "right");
        

}
