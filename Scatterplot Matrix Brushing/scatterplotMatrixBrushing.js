//CMPS263 Student: Ziye Han
var width = 960,
    size = 230, //Of each big square 
    padding = 20; //Padding beyween two blocks

var x = d3.scaleLinear()
    .range([padding / 2, size - padding / 2]); //Range of x axis, at two ends cut half padding

var y = d3.scaleLinear()
    .range([size - padding / 2, padding / 2]); //Range of y axis, at two ends cut half padding

var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(6); //Number of ticks on a x axis

var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(6); //Number of ticks on a y axis

var color = d3.scaleOrdinal(d3.schemeCategory10); //Ten different colors

d3.csv("flowers.csv", function (error, data) {
    if (error) throw error;

    var domainByTrait = {},
        traits = d3.keys(data[0]).filter(function (d) {
            return d !== "species";
        }),
        //How many traits we have from the first row, here is 4
        n = traits.length;

    traits.forEach(function (trait) {
        domainByTrait[trait] = d3.extent(data, function (d) {
            console.log("trait:" + trait + " value:" + d[trait]);
            return d[trait];
        });
        //Set value according to key(trait)
    });

    console.log(domainByTrait);

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    var brush = d3.brush() //D3 API, Creates a new two-dimensional brush
        .on("start", brushstart) //brushstart is a function
        .on("brush", brushmove) //brushmove is a function
        .on("end", brushend) //brushend is a function
        .extent([[0, 0], [size, size]]); //Upper left to lower right

    var svg = d3.select("body").append("svg") //SVG frame
        .attr("width", size * n + padding)
        .attr("height", size * n + padding)
        .append("g")
        .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

    svg.selectAll(".x.axis")
        .data(traits)
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function (d, i) {
            return "translate(" + (n - i - 1) * size + ",0)";
        })
        .each(function (d) {
            console.log(domainByTrait[d]);
            x.domain(domainByTrait[d]);  //Each 4 domainByTrait[d] has a sub-axis
            d3.select(this).call(xAxis);
        });

    svg.selectAll(".y.axis")
        .data(traits)
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function (d, i) {
            return "translate(0," + i * size + ")";
        })
        .each(function (d) {
            console.log(domainByTrait[d]);
            y.domain(domainByTrait[d]);  //Each 4 domainByTrait[d] has a sub-axis
            d3.select(this).call(yAxis);
        });

    var cell = svg.selectAll(".cell") //Each big square is a "cell"
        .data(cross(traits, traits)) //Cross is a function, setting field for each "circle"
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function (d) {
            // n = 4
            // i = row index count of a cell (see cross() function)
            // j = column index count of a cell (see cross() function)
            return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")";
        })
        .each(plot); //For each cell, add a rectangle and circles inside

    // Text titles at the diagonal.
    cell.filter(function (d) {
            return d.i === d.j;
        }).append("text")
        .attr("x", padding) //Location of text
        .attr("y", padding) //Location of text
        .attr("dy", ".71em") 
        .text(function (d) {
            return d.x; //Text
        });

    cell.call(brush); //Call brush on each cell

    //For each cell, add a rectangle and 150 circles inside (Every cell has 150 circles)
    function plot(p) {
        var cell = d3.select(this);

        x.domain(domainByTrait[p.x]);
        y.domain(domainByTrait[p.y]);

        cell.append("rect")  //Add a rectangle around each cell 
            .attr("class", "frame") 
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

        cell.selectAll("circle")  //Define the location and style of each little circle
            .data(data)
            .enter().append("circle")
            .attr("cx", function (d) {
                return x(d[p.x]);
            })
            .attr("cy", function (d) {
                return y(d[p.y]);
            })
            .attr("r", 4)
            .style("fill", function (d) {
                return color(d.species);
            });
    }

    var brushCell;
    // Clear the previously-active brush, if any.
    function brushstart(p) {
        if (brushCell !== this) { 
            d3.select(brushCell).call(brush.move, null);
            brushCell = this; //Set lower right end the brushCell 
            x.domain(domainByTrait[p.x]); //x domain
            y.domain(domainByTrait[p.y]); //y domain
        } 
    }

    // Drag, highlight the selected circles.
    function brushmove(p) {
        var e = d3.brushSelection(this);
        svg.selectAll("circle").classed("hidden", function (d) {
            return !e ? //If a circle is in my selection area, then it is not hidden 
                false :
                (
                    e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0] ||
                    e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
                );
        });
    }

    // If the brush is end, select all currently hidden circles and show them
    function brushend() {
        console.log("brushend");
        var e = d3.brushSelection(this);
        if (e === null) svg.selectAll(".hidden").classed("hidden", false); // Show all currently hidden circles
    }
});

function cross(a, b) { //a = traits, b = traits
    var c = [],
        n = a.length,
        m = b.length,
        i, j;
    for (i = -1; ++i < n;)  //Loop trait length n
        for (j = -1; ++j < m;)  //Loop trait length m
            c.push({ //Push object to array
                x: a[i], //Row value
                i: i, //Row index
                y: b[j], //Column value
                j: j  //Column index
            });
    return c;
}
