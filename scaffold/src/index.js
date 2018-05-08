// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)

// import from: https://github.com/d3/d3/blob/master/API.md
import {select, selectAll} from 'd3-selection';
import {scaleBand, scaleLinear, bandwidth, scaleLog, scaleQuantile} from 'd3-scale';
import {median, max, indexOf} from 'd3-array';
import {axisBottom, axisLeft, axisTop} from 'd3-axis';
import {format} from 'd3-format';
import {arc, line, radialArea, curveNatural, curveCardinalClosed} from 'd3-shape';
import {interpolateRdBu, schemeRdBu} from 'd3-scale-chromatic';
import {bboxCollide} from 'd3-bboxCollide';
import {hsl} from 'd3-color';
import {forceSimulation, forceManyBody, forceX, forceY, forceLink, forceCollide} from 'd3-force';

const domReady = require('domready');
domReady(() => {
  // this is just one example of how to import data. there are lots of ways to do it!
  // fetch('./data/delays_by_airport.json')
  //   .then(response => response.json())
  //   .then(data => myVis(data));

  Promise.all([
    './data/delay_counts.json',
    './data/delays_by_airport.json',
    './data/delays_by_airline.json',
    './data/seasonal_delays.json'
  ].map(filename => fetch(filename).then(response => response.json())))
  .then(arrayofDataBlobs => myVis(arrayofDataBlobs))
});

function drawBoundingBox(container, data, cutoff, xScale, yScale) {
    const xLow = Math.min(...data.slice(0, cutoff).map((d, i) => d.total))
    const yLow = Math.min(...data.slice(0, cutoff).map((d, i) => d.percent))
    const xHigh = Math.max(...data.slice(0, cutoff).map((d, i) => d.total))
    const yHigh = Math.max(...data.slice(0, cutoff).map((d, i) => d.percent))

    console.log(xScale(xLow))
    console.log(xScale(xHigh))
    console.log(yScale(yLow))
    console.log(yScale(yHigh))

    container.append('rect')
      .attr('x', xScale(xLow))
      .attr('y', yScale(yHigh))
      .attr('width', xScale(xHigh) - xScale(xLow))
      .attr('height', yScale(yLow) - yScale(yHigh))
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', '2px');
  }

function drawLabels(graphContainer, data, params) {

  //   // the points/nodes:

  //   const points = data.map(d => ({x: d.total, y: d.median, label: d.airport}));
  //   console.log(points);

  //   // the labels:
  //   const labels = [];
  //   // const labelLinks = [];

  //   for(var i = 0; i < points.length; i++) {
  //   var node = {
  //     label: points[i].label,
  //     x: points[i].x,
  //     y: points[i].y
  //   };
  //   labels.push({node : node }); labels.push({node : node }); // push twice
  //   // labelLinks.push({ source : i * 2, target : i * 2 + 1, index: i });
  // };
  //   // const labels = points.map(d => ({node: {label: d.label, x: d.x, y: d.y}}, {node: {label: d.label, x: d.x, y: d.y}}));
  //   const labelLinks = points.map((d, i) => ({ source : i * 2, target : i * 2 + 1, index: i }))

  // make nodes: alternates between the 'node' dot and a text label.

  const linkNodes = data.reduce((acc, row) => {
    const dot = {id: `${row.airport}_source`, type: 'source'};
    const label = {id: `${row.airport}_target`, type: 'target'};
    acc.push(label, dot);
    return acc;
  }, []);

  console.log(linkNodes);

  // make links between the sources and targets

  const links = data.map((d, i) => ({source: `${d.airport}_source`, target: `${d.airport}_target`, index: i}));
  console.log(links);


  //   console.log(labels);
  //   console.log(labelLinks);

    // var forceXs = forceX(d => xScale(d[xVar]))
    //   .strength(1)

    // var forceYs = forceY(d => yScale(d[yVar]))
    //   .strength(1)

  const collide = forceCollide()
    .radius(100)
    .iterations(200)
    .strength(1);

  const charge = forceManyBody();
    // .strength(-700);

  const linkForce = forceLink(links)
        .id(d => d.id)
        .strength(1);

  const forceSim = forceSimulation()
    // .nodes(labels)
     .nodes(linkNodes)
    // .velocityDecay(0.6)
    .force('link', linkForce)
        // .charge(-10))
        // .strength(.5)
        // .distance(0))
    .force('charge', charge)
    // .force('x', forceXs)
    // .force('y', forceYs)
    .force('collide', collide)
    // .on('tick', tick)
    .on('tick', updateNetwork);


  // var labelNode = graphContainer.selectAll("g")
  //   .data(labels)
  //   .enter().append("g")
  //     .attr("class", "labelNode");

  // labelNode.append("circle")
  //     .attr("r", 0)
  //     .style("fill", "red");

  // labelNode.append("text")
  //   .text(function(d, i) { return i % 2 == 0 ? "" : d.node.label })
  //   .style("fill", "#555")
  //   .style("font-size", 20);


//     function tick() {
//     labelNode.each(function(d, i) {
//       if(i % 2 == 0) {
//         d.x = d.node.x;
//         d.y = d.node.y;
//       } else {
//         var b = this.childNodes[1].getBBox();
//         var diffX = d.x - d.node.x,
//             diffY = d.y - d.node.y;
//         var dist = Math.sqrt(diffX * diffX + diffY * diffY);
//         var shiftX = Math.min(0, b.width * (diffX - dist) / (dist * 2));
//         var shiftY = 5;
//         this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
//       }
//     });
//     labelNode.call(updateNode);


// // Update nodes
//   function updateNode(){
//     graphContainer.selectAll("labelNode").attr("transform", function(d) {
//       return "translate(" + d.x + "," + d.y + ")";
//     });
//   }

//   }

   var labelNodes = graphContainer
    .selectAll('g.node')
    .data(linkNodes.filter(d => d.type = 'source'))
    .enter()
    .append('g')
    .attr('class', 'node');

    labelNodes.append('text')
      .data(data)
      .attr('text-anchor', 'start')
      .attr('font-family', params.textFont)
      .attr('font-size', '25px')
      .text(d => d.airport)
      .attr('x', d => params.xScale(d[params.xVar]))
      .attr('y', d => params.yScale(d[params.yVar]));


  function updateNetwork() {
    graphContainer.selectAll('g.node')
      .attr('transform', d => `translate(${d.x / 50}, ${d.y / 50})`);
  }
}

function scatterPlot(container, data, params) {
  const height = container.attr('height');
  const width = container.attr('width');
  const plotHeight = 0.85 * height;
  const plotWidth = 0.85 * width;
  const margin = 0.7 * Math.min(height - plotHeight, width - plotWidth);
  const plotMargin = 0.10;

  const xVar = params.xVar;
  const yVar = params.yVar;

  const colors = ['#3d5c8f', '#2985d6', '#63a7cf', '#89c6dc', '#aec3d1', '#cccccc', '#dabda5', '#f69a6f', '#d96b59', '#cc343e', '#923a44'];
  
  const maxPow = Math.ceil(Math.log10(Math.max(...data.map(d => d[xVar]))));
  const minPow = Math.floor(Math.log10(Math.min(...data.map(d => d[xVar]))));

  const maxPercent = Math.max(...data.map(d => d[yVar]))
  const minPercent = params.showZero ? 0 : Math.min(...data.map(d => d[yVar]));

  const xtickData = [...new Array(maxPow - minPow + 1)].map((d, i) => Math.pow(10, minPow + i));

  const xScale = scaleLog()
    .domain([Math.pow(10, minPow), Math.pow(10, maxPow)])
    .range([0, plotWidth]);

  const yMargin = plotMargin * (maxPercent - minPercent);
  const yScale = scaleLinear()
    .domain([minPercent - yMargin, maxPercent + yMargin])
    .range([plotHeight, 0]);

  const colorScale = scaleQuantile()
    .domain(data.map(d => d.median))
    .range(colors);

  const graphContainer = container.append('g')
    .attr('height', plotHeight)
    .attr('width', plotWidth)
    .attr('transform', `translate(${margin}, ${height - margin - plotHeight})`);

  graphContainer.append('g')
    .attr('transform', `translate(0, ${plotHeight})`)
    .call(axisBottom(xScale)
      .ticks(3, format(',.2r'))
      .tickValues(xtickData));

  graphContainer.append('g')
    .attr('transform', `translate(0, 0)`)
    .call(axisLeft(yScale));

  container.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', margin / 2)
    .attr('text-anchor', 'middle')
    .attr('font-size', '30px')
    .attr('font-family', params.textFont)
    .text(params.yLabel);

  container.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin / 4)
    .attr('text-anchor', 'middle')
    .attr('font-family', params.textFont)
    .attr('font-size', '30px')
    .text(params.xLabel);

  graphContainer.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 10)
    .attr('cx', d => xScale(d[xVar]))
    .attr('cy', d => yScale(d[yVar]))
    .style('fill', d => colorScale(d.median))
    .attr('stroke', 'black');

  params.xScale = xScale;
  params.yScale = yScale;
  params.showLabels ? drawLabels(graphContainer, data, params) : 0;

  params.bboxCutoff !== 'none' ? drawBoundingBox(graphContainer, data, params.bboxCutoff, xScale, yScale) : 0;

  // LEGEND

  const legendColors = schemeRdBu[10];
  // const tickVals = elevenStops.map((d, i) => Math.min(...length) + i * incr / 10);
  // console.log(tickVals);

  const legendContainer = container.append('g')
    .attr('width', width / 4)
    .attr('height', height / 6)
    .attr('transform', `translate(${0.7 * width},${height - height / 3})`);

  const legendWidth = legendContainer.attr('width');
  const legendHeight = legendContainer.attr('height');

  legendContainer.selectAll('.rect')
    .data(colors)
    .enter().append('rect')
      .attr('x', (d, i) =>  i * legendWidth / colors.length)
      .attr('y', legendHeight)
      .attr('width', legendWidth / colors.length)
      .attr('height', legendHeight / 20)
      .attr('fill', d => d);

  // legendContainer.selectAll('.line')
  //   .data(tenStops)
  //   .enter().append('line')
  //     .attr('x1', d =>  3 * width / 5 + (d + 1) * 9 * legWidth / 100)
  //     .attr('y1', legHeight / 10)
  //     .attr('x2', d =>  3 * width / 5 + (d + 1) * 9 * legWidth / 100)
  //     .attr('y2', legHeight / 20)
  //     .attr('transform',`translate(0, ${legendContainer.attr('height') - legHeight / 20})`)
  //     .attr('stroke', 'black');

  // legendContainer.selectAll('.text')
  //   .data(elevenStops)
  //   .enter().append('text')
  //     .attr('x', (d, i) => i * legendWidth / colors.length)
  //     .attr('y', legendHeight - legendHeight / 30)
  //     // .attr('transform', `translate(0, ${legWidth / 3})`)
  //     .text(d => tickVals[d - 1])
  //     .attr('text-anchor', 'middle')
  //     .attr('font-family', textFont)
  //     .attr('font-size', '13px')
  //     .attr('fill', 'black');

  // legend label

  legendContainer.append('text')
    .attr('x',  0)
    .attr('y', legendHeight - legendHeight / 8)
    .text('Length of Delay (mins)')
    .attr('text-anchor', 'middle')
    .attr('font-family', params.textFont)
    .attr('font-size', '25px')
    .attr('fill', 'black');

}

function createSeasonLegend(container, data, colors, season) {
  const graphHeight = container.attr('height');
  const graphWidth = container.attr('width');
  
  const height = 0.15 * graphHeight;
  const width = 0.35 * graphWidth;

  const legendContainer = container.append('g')
    .attr('height', height)
    .attr('width', width)
    .attr('transform', `translate(${0.5 * (graphWidth - width)},${0.97 * graphHeight})`);

  const textFont = 'montserrat';

  // legendContainer.append('rect')
  //   .attr('height', height)
  //   .attr('width', width)
  //   .attr('fill', 'None')
  //   .attr('stroke', 'black')
  //   .attr('stroke-width', '2px');

  const xScale = scaleBand()
    .domain([...new Array(2)].map((d,i) => i))
    .range([0, width])
    .paddingInner(0.1)
    .paddingOuter(0.1);
  const yScale = scaleBand()
    .domain([...new Array(2)].map((d,i) => i))
    .range([0, height])
    .paddingInner(0.1)
    .paddingOuter(0.1);

  legendContainer.selectAll('.legend-box')
    .data(data)
    .enter()
    .append('circle')
    .attr('r', 0.75 * yScale.bandwidth() / 2)
    .attr('cx', (d, i) => xScale((Math.floor(i / 2) + (i % 2)) % 2) + 0.5 * yScale.bandwidth() / 2)
    .attr('cy', (d, i) => yScale(Math.floor(i / 2)) + yScale.bandwidth() / 2)
    .attr('fill', (d, i) => colors[i]);

  legendContainer.selectAll('.legend-text')
    .data(data)
    .enter()
    .append('text')
    .attr('x', (d, i) => xScale((Math.floor(i / 2) + (i % 2)) % 2) + 0.85 * yScale.bandwidth())
    .attr('y', (d, i) => yScale(Math.floor(i / 2)) + 0.7 * yScale.bandwidth())
    .attr('font-family', textFont)
    .attr('font-size', '70px')
    .text(d => d.season.toUpperCase())
}

function createMonthLegend(container, data, colors, season) {
  const graphHeight = container.attr('height');
  const graphWidth = container.attr('width');

  const height = 0.2 * graphHeight;
  const width = 0.2 * graphWidth;

  const legendX = (season === 'spring') || (season === 'summer') ? 0.7 * graphWidth : 0.1 * graphWidth;
  
  const legendContainer = container.append('g')
    .attr('height', height)
    .attr('width', width)
    .attr('transform', `translate(${legendX},${0})`);


  const textFont = 'montserrat';

  const widthScale = scaleBand()
    .domain(data.map(d => d.month))
    .range([0, height])
    .paddingInner(0.1)
    .paddingOuter(0.1);

  // container.append('rect')
  //   .attr('height', height)
  //   .attr('width', width)
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr('fill', 'none')
  //   .attr('stroke', 'black')
  //   .attr('stroke-width', '10px');

  legendContainer.selectAll('.legend-box')
    .data(data)
    .enter()
    // .append('rect')
    // .attr('height', widthScale.bandwidth())
    // .attr('width', widthScale.bandwidth())
    // .attr('x', 0.05 * width)
    // .attr('y', d => widthScale(d.month))
    // .attr('fill', (d, i) => colors[i]);
    // .append('line')
    // .attr('x1', 0.05 * width)
    // .attr('y1', d => widthScale(d.month) + widthScale.bandwidth() / 2)
    // .attr('x2', 0.05 * width + widthScale.bandwidth())
    // .attr('y2', d => widthScale(d.month) + widthScale.bandwidth() / 2)
    // .attr('stroke', (d, i) => colors[i])
    // .attr('stroke-width', '10px');
    .append('circle')
    .attr('r', 0.75 * widthScale.bandwidth() / 2)
    .attr('cx', 0.15 * width)
    .attr('cy', d => widthScale(d.month) + widthScale.bandwidth() / 2)
    .attr('fill', (d, i) => colors[i]);

  legendContainer.selectAll('.legend-text')
    .data(data)
    .enter()
    .append('text')
    .attr('x', 0.3 * width)
    .attr('y', d => widthScale(d.month) + 0.7 * widthScale.bandwidth())
    .attr('font-family', textFont)
    .attr('font-size', '50px')
    .text(d => d.month)
}


function drawRadial(container, data, rVar, numLevels, colors, season, textFont) {
  const height = container.attr('height');
  const width = container.attr('width');
  const graphHeight = 0.9 * height;
  const graphWidth = 0.9 * width;
  const xOffset = graphWidth / 2;
  const yOffset = graphHeight / 2
  const m = Math.min(xOffset, yOffset) / 20;
  const radius = 0.8 * Math.min(xOffset, yOffset);
  const maxThick = 0.03 * radius;

  const titleFont = 'montserrat'

  const numHours = 24;


  const hours = [...new Array(numHours)].map((d, i) => i);
  const levels = [...new Array(numLevels)].map((d, i) => i);

  const axisScale = scaleLinear()
    .domain([0, numLevels])
    .range([0, radius]);

  const formatFunc = rVar === 'percent' ? format('.0%') : format('d');

  const maxVal = Math.ceil(10 * Math.max(...data.map(d => Math.max(...d[rVar])))) / 10;
  const maxRadius = rVar === 'percent' ? maxVal : 70;

  const rScale = scaleLinear()
    .domain([0, maxRadius])
    .range([0, radius]);

  const minTotal = Math.min(...data.map(d => Math.min(...d.total)));
  const maxTotal = Math.max(...data.map(d => Math.max(...d.total)));

  const thickScale = scaleLinear()
    .domain([minTotal, maxTotal])
    .range([maxThick, 2]);

  const axisData = [...new Array(numHours * numLevels)].map((x, i) => ({
     hour: i % numHours,
     level: Math.floor(i / numHours) + 1,
    }));

  if (season !== 'season') {
    container.append('text')
      .attr('x', 0.5 * width)
      .attr('y', 0.03 * height)
      .attr('font-family', 'montserrat')
      .attr('font-weight', 'bold')
      .attr('font-size', '80px')
      .attr('text-anchor', 'middle')
      .text(season.toUpperCase());
  }
  

  const graphContainer = container.append('g')
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .attr('transform', `translate(${(width - graphWidth) / 2}, ${(height - graphHeight) / 2})`)

  // container.selectAll('.lines')
  //   .data(axisData)
  //   .enter()
  //   .append('line')
  //   .attr('x1', d => axisScale(d.level) * (Math.sin(d.hour * 2 * Math.PI / numHours)))
  //   .attr('y1', d => axisScale(d.level) * (Math.cos(d.hour * 2 * Math.PI / numHours)))
  //   .attr('x2', d => axisScale(d.level) * (Math.sin((d.hour + 1) * 2 * Math.PI / numHours)))
  //   .attr('y2', d => axisScale(d.level) * (Math.cos((d.hour + 1) * 2 * Math.PI / numHours)))
  //   .attr('class', 'line')
  //   .attr('stroke', 'grey')
  //   .attr('stroke-opacity', '0.75')
  //   .attr('stroke-width', '0.3px')
  //   .attr('transform', `translate(${xOffset}, ${yOffset})`);

  graphContainer.selectAll('.lines')
    .data(levels)
    .enter()
    .append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', l => axisScale(l + 1))
    .attr('fill', 'none')
    .attr('stroke', 'grey')
    .attr('stroke-opacity', '0.75')
    .attr('stroke-width', '0.3px')
    .attr('transform', `translate(${xOffset}, ${yOffset})`);


  // container.append('clipPath')
  //   .attr('id', 'graphClip')
  //   .append('circle')
  //   .attr('cx', xOffset)
  //   .attr('cy', yOffset)
  //   .attr('r', axisScale(numLevels));


  graphContainer.selectAll('.lines')
    .data(hours)
    .enter().append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', h => axisScale(numLevels) * (Math.sin(h * 2 * Math.PI / numHours)))
    .attr('y2', h => axisScale(numLevels) * (Math.cos(h * 2 * Math.PI / numHours)))
    .attr('stroke-width', '1px')
    .attr('stroke-opacity', '0.75')
    .attr('stroke', 'grey')
    .attr('transform', `translate(${xOffset}, ${yOffset})`);

  graphContainer.selectAll('.axis-text')
    .data(levels)
    .enter().append('text')
    .style('font-family', textFont)
    .style('font-size', '22px')
    .attr('class', 'axis-text')
    .attr('x', 0)
    .attr('y', l => -axisScale(l + 1))
    .attr('transform', `translate(${xOffset}, ${yOffset})`)
    .text(l => formatFunc((l + 1)/ numLevels * maxRadius));

  graphContainer.selectAll('.hours-text')
    .data(hours)
    .enter().append('text')
    .style('font-family', textFont)
    .style('font-size', '22px')
    .attr('class', 'hours-text')
    .attr('transform', `translate(${xOffset}, ${yOffset})`)
    .attr('x', h => 1.05 * radius * (-Math.sin(-h * 2 * Math.PI / numHours)))
    .attr('y', h => 1.05 * radius * (-Math.cos(-h * 2 * Math.PI / numHours)))
    .attr('text-anchor', 'middle')
    .text(h => `${h}:00`)


  const areaFunction = radialArea()
    .angle((d, i) => i * 2 * Math.PI / numHours)
    .innerRadius((d, i) => rScale(d.rVar) - thickScale(d.total))
    .outerRadius((d, i) => rScale(d.rVar) + thickScale(d.total))
    .curve(curveCardinalClosed.tension(0.55));

  const arcGenerator = arc()
    .innerRadius(0)
    .outerRadius(radius);
    // .attr('clip-path', 'url(#graphClip)');

  // const lineData = 
  graphContainer.selectAll('.data-clip')
    .data(data)
    .enter().append('clipPath')
    .attr('id', (d, i) => `${season + i}`)
    .append('path')
    .attr('d', d => {
      d[rVar].push(d[rVar][0]);
      d.total.length === 24 ? d.total.push(d.total[0]) : '';
      return areaFunction(d[rVar].map((e, i) => ({rVar: e, total: d.total[i]})));
    })
    .attr('transform', `translate(${xOffset}, ${yOffset})`);

  graphContainer.selectAll('.base')
    .data(data)
    .enter().append('g')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(0, 0)')
    .attr('clip-path', (d, i) => `url(#${season + i})`)
    .selectAll('.base')
    .data((d, i) => d.total.slice(0, -1).map(t => ({total: t, color: colors[i]})))
    .enter().append('path')
    .attr('d', (d, i) => arcGenerator({startAngle: i / 12 * Math.PI, endAngle: (i + 1) / 12 * Math.PI}))
    .attr('transform', `translate(${xOffset}, ${yOffset})`)
    .attr('fill', d => d.color)
    .attr('opacity', d => 0.85 * d.total / maxTotal + 0.15);

  const legendFunc = season === 'season' ? createSeasonLegend : createMonthLegend;

  legendFunc(graphContainer, data, colors, season);
}


function drawBar(container, data, xLabel, yLabel, title, textFont) {

  const height = container.attr('height');
  const width = container.attr('width');
  const graphHeight = 0.85 * height;
  const graphWidth = 0.85 * width;
  const margin = 0.7 * Math.min(height - graphHeight, width - graphWidth);
  const airlines = data.map(d => d.airline)

  const xScale = scaleBand()
    .domain(airlines)
    .range([0, graphWidth])
    .paddingInner(0.1)
    .paddingOuter(0.1);
  const yScale = scaleLinear()
    .domain([0, Math.max(...data.map(d => d.percent))])
    .range([graphHeight, 0]);

  const graphContainer = container.append('g')
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .attr('transform', `translate(${margin}, ${height - margin - graphHeight})`);

  graphContainer.append('g')
    .attr('transform', `translate(0, ${graphHeight})`)
    .call(axisBottom(xScale));

  graphContainer.append('g')
    .attr('transform', `translate(0, 0)`)
    .call(axisLeft(yScale));

  const yellow = '#e0b506'

  const blue = '#307db6'

  graphContainer.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('width', xScale.bandwidth())
    .attr('height', d => yScale(d.percenta) - yScale(d.percent))
    .attr('x', d => xScale(d.airline))
    .attr('y', d => yScale(d.percent))
    .attr('fill', blue);


  graphContainer.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('width', xScale.bandwidth())
    .attr('height', d => graphHeight - yScale(d.percenta))
    .attr('x', d => xScale(d.airline))
    .attr('y', d => yScale(d.percenta))
    .attr('fill', yellow);

  // container.append('text')
  //   .attr('x', width / 2)
  //   .attr('y', 1.25 * margin)
  //   .attr('font-family', 'sans-serif')
  //   .attr('font-size', '80px')
  //   .attr('text-anchor', 'middle')
  //   .text(title);
  container.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin / 8)
    .attr('font-family', textFont)
    .attr('font-size', '40px')
    .attr('text-anchor', 'middle')
    .text(xLabel);
 container.append('text')
    .attr('transform', `translate(${margin / 2}, ${height / 2})rotate(-90)`)
    .attr('font-family', textFont)
    .attr('font-size', '40px')
    .attr('text-anchor', 'middle')
    .text(yLabel);
}


function makeContainer(vis, width, height, x, y, border) {
  const container = vis.append('g')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', `translate(${x}, ${y})`);

  if (border) {
    container.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', 'None')
      .attr('stroke', 'black');
  }

  return container;
}


function myVis(data) {
  // The posters will all be 24 inches by 36 inches
  // Your graphic can either be portrait or landscape, up to you
  // the important thing is to make sure the aspect ratio is correct.
  const textFont = 'open sans'
  // Eggshell
  const list1 = [1, 1, 1, 1];
  console.log(list1.reduce((ls, l) => ls.concat([l, l]), []))
  // const backgroundColor = '#EFF1ED';
  const backgroundColor = '#f7f7f7';
  // const backgroundColor = 'None';

  // const seasonColors = ['#0b66f1', // winter
  //                       '#1cd50a', // spring 
  //                       '#fff60a', //summer 
  //                       '#fd8308']; // fall
  const seasonColors = ['#375E97', '#3F681C', '#FFBB00', '#FF300C'];

  // const winterColors = ['#17bbff',
  //                       '#0b66f1',
  //                       '#5d4fff'];
  // const winterColors = ['#39bedd', '#5c81cf', '#4c69db'];
  const winterColors = ['#2A354E', '#375E97', '#008DFF']

  // const springColors = ['#52d585',
  //                       '#1cd50a',
  //                       '#8fd646']
  // const springColors = ['#58b87c', '#74b946', '#5a8339'];
  const springColors = ['#26391C', '#3F681C', '#469E00']
  // const summerColors = ['#cdff22',
  //                       '#fff60a',
  //                       '#f9da09'];
  // const summerColors = ['#ac882c', '#dec36c', '#d9ce3a'];
  const summerColors = ['#BE8E3B', '#FFBB00', '#FDEF00'];

  // const autumnColors = ['#f9b409',
  //                     '#fd8308',
  //                     '#f86607'];
  // const autumnColors = ['#ce8541', '#d5565e', '#dd502b'];
  // const autumnColors = [hsl(351.82, 0.91, 0.55), hsl(7.90, 0.56, 0.55), hsl(12.66, 0.88, 0.55) ];
  const autumnColors = ['#C30000', '#FF300C', '#FFA26C']

  const width = 5000; // was 5000, changed to 500 for viewing in browser
  const height = 36 / 24 * width;
  const margin = 70;

  const vis = select('.vis-container')
    .attr('width', width)
    .attr('height', height);

  vis.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', backgroundColor);

  vis.append('text')
    .attr('x', 0.5 * width)
    .attr('y', 0.03 * height)
    .attr('font-family', 'montserrat')
    .attr('font-weight', 'bold')
    .attr('font-size', '150px')
    .attr('text-anchor', 'middle')
    .text('AVOIDING FLIGHT DELAYS');

  const radialContainer = makeContainer(vis,  width, 0.4 * height, 0, 0.06 * height, false);

  const rHeight = radialContainer.attr('height');
  const rWidth = radialContainer.attr('width');
  const radialSeasons = makeContainer(radialContainer, 0.7 * rWidth, 0.7 * rHeight, 0.15 * rWidth, 0.15 * rHeight, false);
  const radialWinter = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0, false);
  const radialSpring = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0, false);
  const radialAutumn = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0.5 * rHeight, false);
  const radialSummer = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0.5 * rHeight, false);

  const fullScatterContainer = makeContainer(vis, 0.4 * width, 0.2 * height, 0.05 * width, 0.58 * height, false);
  const zoomScatterContainer = makeContainer(vis, 0.4 * width, 0.2 * height, 0.5 * width, 0.5 * height, false);
  const barContainer = makeContainer(vis, 0.4 * width, 0.2 * height, 0.5 * width, 0.77 * height, false);

  // console.log(data[0].slice(8, 11))

  drawRadial(radialSeasons, data[3], 'percent', 8, seasonColors, 'season', textFont);
  drawRadial(radialWinter, data[0].slice(-1).concat(data[0].slice(0, 2)), 'percent', 8, winterColors, 'winter', textFont);
  drawRadial(radialSpring, data[0].slice(2, 5), 'percent', 8, springColors, 'spring', textFont);
  drawRadial(radialSummer, data[0].slice(5, 8), 'percent', 8, summerColors, 'summer', textFont);
  drawRadial(radialAutumn, data[0].slice(8, 11), 'percent', 8, autumnColors, 'autumn', textFont);
  // drawRadial(radialAvgContainer, data[3], 'average', 10);
  // drawRadial(radialContainer, data[3], 'percent', 8);

  const fullParams = {
    xVar: 'total', 
    yVar: 'percent', 
    xLabel: 'Total Outbound Flights', 
    yLabel: 'Proportion of Delayed Flights',
    showLabels: false, 
    showZero: true, 
    textFont: textFont,
    bboxCutoff: 50,
  };

  const zoomParams = {
    xVar: 'total', 
    yVar: 'percent', 
    xLabel: 'Total Outbound Flights', 
    yLabel: 'Proportion of Delayed Flights',
    showLabels: true, 
    showZero: false, 
    textFont: textFont,
    bboxCutoff: 'none'
  };

  scatterPlot(fullScatterContainer, data[1], fullParams);
  scatterPlot(zoomScatterContainer, data[1].slice(0, 50), zoomParams);

  // drawBar(container, data, var1, var2, xLabel, yLabel, title)
  drawBar(barContainer, data[2], 'Airlines', 'Percentage', 'Plot of Delays by Airlines', textFont);
}
