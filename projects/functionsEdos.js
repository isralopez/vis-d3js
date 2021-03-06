


/*
##############################
Variables y funciones globales
##############################
*/

/*Extiende d3.selection para poder mover objetos al frente*/
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

//Every year
var years = ["2006","2007","2008","2009","2010","2011","2012","2013","2014"]
// colores para los 32 estados
var colors = ["#058cfe", "#0cc402", "#ff1902", "#7d6b48", "#fd01af", "#8b35ff",
              "#08b9d1", "#e79805", "#d992c6", "#079a5c", "#cb2e4f", "#889d05",
               "#944cc0", "#546e9a", "#f08f6b", "#fe08fb", "#055ffb", "#88b296",
               "#bf4403", "#bb3a84", "#a15763", "#c5a555", "#fc71f9", "#bca2a5",
               "#18b3fd", "#258c05", "#58762b", "#b498fc", "#34777a", "#9b6004",
               "#fd829a", "#ff067d"];

var map = d3.select("#map");
i = 0;//year counter
var edos = map.append("g")
    .attr("id", "edos")
    .selectAll("path");

var proj =  d3.geo.mercator()
  .center([-97.16, 21.411])
  .scale(1000)
//  .translate([300,300]);//TODO: set this value

var quantize = d3.scale.quantize()
  .domain([0, 16000000])
  .range(d3.range(5).map(function(i) { return "q" + i; }));

var topology,
    geometries,
    carto_features,
    maxPerYear,
    maxRatePerYear,
    rates, //datos por tasa para el plot
    cantidad, //datos por cantidad para el plot
    byState,
    mySlider,
    cartoValue = 'cantidad',
    pplot;

//Insnantiate the cartogram with desired projection
var carto = d3.cartogram()
    .projection(proj)
    .properties(function (d) {
        // this add the "properties" properties to the geometries
        return d.properties;
    });

function main(){

  //Slider
  var axis = d3.svg.axis().orient("bottom").ticks(8)
  axis.tickFormat(d3.format("d"))
  mySlider = d3.slider()
  .axis(axis)
  .min(2006)
  .max(2014)
  .step(1)
  .on("slide", function(evt, value) {
    doUpdate(value);
  });
  d3.select('#slider').call(mySlider);

  //Build a queue to load all data files
  queue()
  .defer(d3.json, 'data/des_estado_simple.json')
  .defer(d3.csv, 'data/desaparecidos_estatal.csv', function(d) {
    if (d.estado === 'Baja California Sur'){
      d.estado = 'BCS';
    } else if (d.estado === 'Baja California'){
      d.estado = 'BC';
    } else if (d.estado === 'San Luis Potosí'){
      d.estado = 'SLP';
    } else if (d.estado === 'Distrito Federal'){
      d.estado = 'DF';
    } else if (d.estado === 'Nuevo León'){
      d.estado = 'Nuevo León';
    } else if (d.estado === 'Quintana Roo'){
      d.estado = 'Quintana Roo';
    } else {
      d.estado = d.estado.split(' ')[0];
    }
    years.forEach(function(y){
      d[y] = +d[y]
    })
    return d;
  })
  .await(ready);

  //Add listener to radio buttons and set cartogram variable
  d3.selectAll('input[name="cartogram-value"]')
    .on("change", function(event,data){
        if (data === 0){
          cartoValue = 'cantidad';
          var pplotData = cantidad;
        }else{
          cartoValue = 'tasa';
          var pplotData = rates;
        }
        doUpdate(mySlider.value());
        //d3.select('#chart').transition().duration(750).call(chart);
        ch = d3.select("#parallelPlot");
        ch.datum(pplotData);
        ch.transition()
        .duration(750)
        .ease("linear")
        .call(pplot)
      });

  d3.select('#play')
  .on("click", function(evt) {
    doAnimation(mySlider.value());
  });

}

window.onload = main




function ready(error,topo,csv){
  //Compute max values for each year and store it in maxPerYear
  maxPerYear = {}
  maxRatePerYear = {}
  years.forEach(function(y){
    thisYear = [];
    thisRate = [];
    csv.forEach(function(element){
      thisYear.push(parseInt(element[y]));
      var rate = (parseFloat(element[y])/parseFloat(element['POB1']))*100000;
      thisRate.push(rate);
    })
    maxPerYear[y] = d3.max(thisYear);
    maxRatePerYear[y] = d3.max(thisRate);
  });

  rates = csv.map(function(obj){
    rObj = {};
    years.forEach(function(y){
      rObj[y] = (+obj[y]/+obj["POB1"])*100000;
    })
    rObj["id"] = obj["id"];
    rObj["estado"] = obj["estado"];
    rObj["POB1"] = obj["POB1"];
    return rObj;
  })
  cantidad = csv;
  //nest values under state key
  byState = d3.nest().key(function(d){return d.estado}).map(csv);

  //make map
  makeMap(topo);

  //parallel plot
  pplot = parallelPlot()
  pplot.containerWidth(400);
  pplot.containerHeight(200);
  pplot.colors(colors)
    .filterColumns(["POB1",'estado'])
  d3.select("#parallelPlot")
  .datum(csv)
  .call(pplot)
  var legend = pplot.svg().append("g")
    .attr("class","legend")
    .attr("transform","translate(" + pplot.containerWidth() + ",50)")
    .style("font-size","12px")
    .call(d3.legend)

  // Bar Chart
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 860 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var svg = d3.select("#barChart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("data/des_estatalT.csv", type, function(error, data) {
    if (error) throw error;
    
    console.log(data)
    x.domain(data.map(function(d) { return d.año; }));
    y.domain([0, d3.max(data, function(d) { return d.A; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")      
        .text("Estado");

    svg.append("g")
        .attr("class", "y axis")
        .style("text-anchor", "end")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequencia");

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.año); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.A); })
        .attr("height", function(d) { return height - y(d.A); });
  });

  function type(d) {
    d.A = +d.A;
    return d;
  }


  //Aquí definimos las funciones a ejecutar en los mouse in/out de la
  //gráfica
  function actionHoverIn(d, i){
    // acciones on hover in de los poligonos de estados
    edos.style("stroke", function(d,j){
      return j != i ? "black" : colors[d.id];
    })
    .style("stroke-width", function(d,j){
      return j != i ? ".5" : 2.5;
    })
    // accion on hover in de las lineas del parallel plot
    pplot.svg().selectAll(".linea")
    .transition()
    .duration(100)
    .sort(function (a, b) { // select the parent and sort the path's
      if (a.id != d.id) return -1;               // a is not the hovered element, send "a" to the back
      else return 1;                             // a is the hovered element, bring "a" to the front
    })
    /*.style("stroke", function(d, j) {
      return j != i ? colors[d.id] : 'red';
    })*/
    .style("stroke-width", function(d, j) {
      return j != i ? '1' : '2.5';
    })
    .style("opacity", function(d, j) {
      return j != i ? .3 : 1;
    });

    // accion on hover in de la leyenda
    pplot.svg().selectAll(".legend-text")
    .transition()
    .duration(100)
    .style("opacity", function(d, j) {
      return j != i ? 0.25 : 1;
    });
    pplot.svg().selectAll(".legend-bullet")
    .transition()
    .duration(100)
    .style("opacity", function(d, j) {
      return j != i ? 0.25 : 1;
    });
  }

  function actionHoverOut(d, i){
    // acciones on hover out de los poligonos de estados
    edos.style("stroke", "black")
    .style("stroke-width", ".5")

    // accion on hover out de las lineas del parallel plot
    pplot.svg().selectAll(".linea")
     .transition()
     .duration(100)
     .style("stroke", function(d) {return colors[d.id];})
     .style({"stroke-width": "1.5"})
     .style({"opacity": 1});

     // accion on hover out de la leyenda
     pplot.svg().selectAll(".legend-text")
     .transition()
     .duration(100)
     .style("opacity", "1");
     pplot.svg().selectAll(".legend-bullet")
     .transition()
     .duration(100)
     .style("opacity", "1");
  }

  //Aquí le peganmos las funciones anteriores a los eventos correspondientes
  pplot.actionHoverIn(actionHoverIn)
    .actionHoverOut(actionHoverOut);

  // acciones de hover en la leyenda
  pplot.svg().selectAll(".legend-text")
    .on("mouseover", function(d, i) {
      actionHoverIn(d, i);
    })
    .on("mouseout", function(d, i) {
      actionHoverOut(d, i);
    })
}

//Triggers a callback at the end of the last transition
function endAll (transition, callback) {
    var n;
    if (transition.empty()) {
        callback();
    }
    else {
        n = transition.size();
        transition.each("end", function () {
            n--;
            if (n === 0) {
                callback();
            }
        });
    }
}

//Computes updated features and draws the new cartogram
function doUpdate(year) {
    // this sets the value to use for scaling, per state.
    // Here I used the total number of incidenes for 2012
    // The scaling is stretched from 0 to the max of that year and
    // mapped from 0 to max+1.
    // Otherwise I get an ERROR when the propertie has 0s...

    carto.value(function (d) {
      if (cartoValue === 'cantidad'){
        var scale = d3.scale.linear()
          .domain([0, maxPerYear[year]])
          .range([1, 1000]);
        return +scale(d.properties[year]);
      }else{
        var scale = d3.scale.linear()
          .domain([0, maxRatePerYear[year]])
          .range([1, 1000]);
        var rate = 100000*(parseFloat(d.properties[year])/parseFloat(d.properties["POB1"]));
        return +scale(rate);
      }
    });

    if (carto_features == undefined)
        //this regenrates the topology features for the new map based on
        carto_features = carto(topology, geometries).features;

    //update the map data
    edos.data(carto_features)
        .select("title")
        .text(function (d) {
          return d.properties.estado+ ': '+d.properties[year];
        });

    edos.transition()
        .duration(900)
        .each("end", function () {
            d3.select("#click_to_run").text("Listo!")
        })
        .attr("d", carto.path)
        .call(endAll, function () {
          carto_features = undefined;
        });
}

//Draws original map
function makeMap(data){
  topology = data;
  geometries = topology.objects.desaparecidos_estatal.geometries;

  //these 2 below create the map and are based on the topojson implementation
  var features = carto.features(topology, geometries),
      path = d3.geo.path()
          .projection(proj);

  edos = edos.data(features)
      .enter()
      .append("path")
      .attr("id", function (d) {
          return d.properties.estado;
      })
      .attr("class", function(d) {
        return quantize(d.properties['POB1']);
      })
      .attr("d", path);

  // darle a los estados borde de color on hover
  edos.on('mouseover', function(d,i){
    edos.style("stroke", function(d,j){
      return j != i ? "black" : colors[d.id];
    })
    .style("stroke-width", function(d,j){
      return j != i ? ".5" : 2.5;
    })
    var sel = d3.select(this);
    sel.moveToFront();
    //LLamamos la acción de hover de la gráfica;
    (pplot.actionHoverIn())(d,i);
  });
  // TODO: ligar el on hover de aqui con los de la grafica y leyenda
  edos.on('mouseout', function(d,i){
    edos.style("stroke", "black")
    .style("stroke-width", ".5");
    //LLamamos la acción de hover de la gráfica;
    (pplot.actionHoverOut())(d,i);
  });

  edos.append("title")
    .text(function (d) {
      return d.properties.estado;
    });

  d3.select("#click_to_run").text("Haz cartograma");
}

function doAnimation(startYear){
  startIndex = years.indexOf(startYear.toString())
  if (startIndex !== 0){
    startIndex = startIndex +1;
  }
  var frameCount = 0;
  for(i = startIndex; i < years.length; i++){
    window.setTimeout(function(step){
      mySlider.value(parseInt(years[step]))
    },frameCount*1500,i);
    frameCount ++;
  }
}
