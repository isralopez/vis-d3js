/*
Implementación reusable de parallelPlot
Uso básico:
pplot = parallelPlot()
d3.select("#container")
.datum(dataObject)
.call(pplot)

--Configuración--
pplot.containerWidth(value) -fija el ancho del contenedor
pplot.containerHeight(value) -fija el alto del contenedor
pplot.colors(value) - puede ser un string que represente el color para todas las líneas
                    - o un array con un color para cada linea (tantos colores como series)
pplot.filterColumns(array) - array con los nombres de las columnas que no se quieren graficar
pplot.idColumn(value) - nombre de la columna que sirve como id

--Configuración de los eventos mouseover y mouseout--
1.- Crear función para manejar el evento
function actionMouseIn(d,i){
    //d,i son los datos y el número de linea, respectivamente.
    //El svg de la gráfica lo obtienes con pplot.svg()
}
2.- Pegar la función al evento:
pplot.actionHoverIn(actionMouseIn)
pplot.actionHoverOut(actionMouseOut)
3.- Para llamar las acciones desde otro componente:
(pplot.actionHoverIn())(d,i)
d,i tienen que ser comunes entre los dos componentes
*/

function parallelPlot(){
    //Configuración:
    var containerWidth = 960,
        containerHeight = 500,
        svg, //el svg donde se renderea la gráfica (se puede consultar pero no modificar)
        margin = {top: 30, right: 0, bottom: 10, left: 10},
        colors = 'steelblue', //opciones válidas: 'random', array de colores o 'string';
        filterColumns = undefined, //Qué columnas no hay que desplegar (array)
        idColumn = 'id', //Columna para usarse como identificador
        actionHoverIn = function(d,i) {
          svg.selectAll(".linea")
          .transition()
          .duration(100)
          .sort(function (a, b) { // select the parent and sort the path's
            if (a.id != d.id) return -1;               // a is not the hovered element, send "a" to the back
            else return 1;                             // a is the hovered element, bring "a" to the front
          })
          .style("stroke-width", function(d, j) {
            return j != i ? '1' : '2.5';
          })
          .style("opacity", function(d, j) {
            return j != i ? .3 : 1;
          });

        },
        actionHoverOut = function(d,i) {
          svg.selectAll(".linea")
           .transition()
           .duration(100)
           .style("stroke", function(d) {return colors[d.id];})
           .style({"stroke-width": "1.5"})
           .style({"opacity": 1});
        }

    function plot(selection){

        var width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        var x = d3.scale.ordinal().rangePoints([0, width], 1),
            y = {};

        var line = d3.svg.line(),
            axis = d3.svg.axis().orient("left"),
            background,
            foreground,
            foregroundPath,
            backgroundPath;
        //this es la selección que llama a parallelPlot
        selection.each(function(data,i){
            //this es la selección que llama a parallelPlot,data son los datos
            plotSvg = d3.select("#pplot-svg")
            if (plotSvg.empty()){
                //Sólo creamos el svg si no existe
                svg = selection.append("svg")
                    .attr("id","pplot-svg")
                    .attr("width", width + margin.left + margin.right + 110)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            }


            if (filterColumns !== undefined){
              var dimensions = []
              d3.keys(data[0]).forEach(function(col){
                if (filterColumns.indexOf(col) === -1 && col !== 'id'){
                  dimensions.push(col)
                }
              })
            }else{
              dimensions = d3.keys(data[0])
            };
            dimensions.forEach(function(el){
              //TODO: opción para usar un único extent para todas las dimensiones
              y[el] = d3.scale.linear()
                .domain(d3.extent(data, function(d) {return +d[el];}))
                .range([height, 0]);
            })
            x.domain(dimensions);
            // Add grey background lines for context.
            if (d3.select(".background").empty()){
                //Solo se crea si no existe
                background = svg.append("g")
                    .attr("class", "background");
            }else{
                background = d3.selectAll(".background");
            }

            backgroundPath = background.selectAll("path")
                .data(data);
            backgroundPath.enter().append("path");
                //.attr("d", path);
            backgroundPath.exit().remove();
            backgroundPath.transition()
                .duration(750)
                .ease("linear")
                .attr("d", path);

            // Add colored foreground lines for focus.
            if (d3.select(".foreground").empty()){
                foreground = svg.append("g")
                    .attr("class", "foreground");
            }else{
                foreground = d3.selectAll(".foreground");
            }

            foregroundPath = foreground.selectAll("path")
                .data(data);
            //console.log(data);
            foregroundPath.enter().append("path")
                .attr("class", "linea");

            foregroundPath.attr("data-legend",function(d) { return d.estado }) //TODO: configurar variable de leyenda
                .attr("id", function(d){ return d.id;}) //TODO:checar que haya id
                //
                .style("stroke", function(data) {
                  if (colors instanceof Array){
                    //TODO: checar que el array sea del tamaño de los datos.
                    //TODO: checar cuál es el identificador
                    return colors[data.id];
                  }else{
                    if (colors == 'random'){
                      //TODO: llamar a un random color generator
                      return colors;
                    }else{
                      return colors;
                    }
                  }
                })
            foregroundPath.transition()
                .duration(750)
                .ease("linear")

                .attr("d", path);
            foregroundPath.exit().remove();

            // Add a group element for each dimension.
            if (svg.selectAll(".dimension").empty()){
                //Solo se crea si no existe
                var g = svg.selectAll(".dimension")
                    .data(dimensions)
                g.enter().append("g")
                    .attr("class", "dimension");
                g.exit().remove();
                g.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
                // Add an axis and title.
                g.append("g")
                    .attr("class", "axis")
                    .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
                  .append("text")
                    .style("text-anchor", "middle")
                    .attr("y", -9)
                    .text(function(d) { return d; });
            }else{
                //si ya existe sólo se ectualiza
                var g = svg.selectAll(".dimension")
                var a = g.selectAll(".axis")
                .each(function(d) {
                    d3.select(this).call(axis.scale(y[d]));
                });
            }




            // Add and store a brush for each axis.
            g.append("g")
                .attr("class", "brush")
                .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
                /* TODO: remove brush from ordinal axis */
              .selectAll("rect")
                .attr("x", -8)
                .attr("width", 16);

            // Returns the path for a given data point.
            function path(data) {
              return line(dimensions.map(function(p) {
                  return [x(p), y[p](data[p])];
                  }));
            }

            // Handles a brush event, toggling the display of foreground lines.
            function brush() {
              var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
                  extents = actives.map(function(p) { return y[p].brush.extent(); });
              foregroundPath.style("display", function(d) {
                return actives.every(function(p, i) {
                  return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                }) ? null : "none";
              });
            }

            //  acciones de hover en el parallel plot
            svg.selectAll(".foreground path")
              .on("mouseover", function(d, i) {
                actionHoverIn(d, i);
              })
              .on("mouseout", function(d, i) {
                actionHoverOut(d, i)
            });
        });
    }

    plot.containerWidth = function(value) {
        if (!arguments.length) return containerWidth;
        containerWidth = value;
        return plot;
    };

    plot.containerHeight = function(value) {
        if (!arguments.length) return containerHeight;
        containerHeight = value;
        return plot;
    };

    //TODO: getter/setter para los márgenes
    plot.svg = function() {
        return svg;
    };

    plot.colors = function(value) {
      if (!arguments.length) return colors;
      colors = value;
      return plot;
    }

    plot.filterColumns = function(value) {
      if (!arguments.length) return filterColumns;
      filterColumns = value;
      return plot;
    }

    plot.idColumn = function(value) {
      if (!arguments.length) return idColumn;
      idColumn = value;
      return plot;
    }

    plot.actionHoverIn = function(value) {
      if (!arguments.length) return actionHoverIn;
      actionHoverIn = value;
      return plot;
    }

    plot.actionHoverOut = function(value) {
      if (!arguments.length) return actionHoverOut;
      actionHoverOut = value;
      return plot;
    }
    return plot
}
