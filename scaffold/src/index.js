// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)

// import from: https://github.com/d3/d3/blob/master/API.md
import {select, selectAll} from 'd3-selection';
import {scaleBand, scaleLinear, bandwidth, scaleLog} from 'd3-scale';
import {max} from 'd3-array';
import {axisBottom, axisLeft, axisTop} from 'd3-axis';
import {format} from 'd3-format';
import {line, radialArea, curveNatural, curveCardinalClosed} from 'd3-shape';
import {interpolateRdBu, schemeRdBu} from 'd3-scale-chromatic';
import {bboxCollide} from 'd3-bboxCollide';
import {forceSimulation, forceManyBody, forceX, forceY} from 'd3-force';

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

function scatterPlot(container, data, xVar, yVar, xLabel, yLabel, text) {
  // The posters will all be 24 inches by 36 inches
  // Your graphic can either be portrait or landscape, up to you
  // the important thing is to make sure the aspect ratio is correct.

  const height = container.attr('height');
  const width = container.attr('width');
  const margin = 70;

  if (text) {
    data = data.slice(0, 50);
  }

  const maxPow = Math.ceil(Math.log10(Math.max(...data.map(d => d[xVar]))));
  const minPow = Math.floor(Math.log10(Math.min(...data.map(d => d[xVar]))));

  const xtickData = [... new Array(maxPow - minPow + 1)].map((d, i) => Math.pow(10, minPow + i));
  // console.log(xtickData);

  const xScale = scaleLog()
    .domain([Math.pow(10, minPow), Math.pow(10, maxPow)])
    .range([margin, width - margin]);

    console.log(xScale.domain());

  const yScale = scaleLinear()
    // .domain([Math.min(...data.map(d => d[yVar])), Math.max(...data.map(d => d[yVar]))])
    .domain([0, Math.max(...data.map(d => d[yVar]))])
    .range([height - margin, margin]);

  // Array of median lengths of flights

  const length = data.map(d => d.median);

  const incr = Math.max(...length) - Math.min(...length);

  // Scale for dot color

  const colorScale = scaleLinear()
      .domain([Math.min(...length), Math.max(...length)])
      .range([1,0]);

  const vis = container;

  const graphContainer = vis.append('g');

  graphContainer.append('g')
    .attr('transform', `translate(0, ${height - margin})`)
    .call(axisBottom(xScale)
      .ticks(3, format(',.2r'))
      .tickValues(xtickData));

  graphContainer.append('g')
    .attr('transform', `translate(${margin}, 0)`)
    .call(axisLeft(yScale));

  graphContainer.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', margin / 2)
    .attr('text-anchor', 'middle')
    .attr('font-size', '25px')
    .attr('font-family', 'Arial')
    .text(yLabel);

  graphContainer.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin / 4)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Arial')
    .attr('font-size', '25px')
    .text(xLabel);

  graphContainer.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 10)
    .attr('cx', d => xScale(d[xVar]))
    .attr('cy', d => yScale(d[yVar]))
    .style('fill', d => interpolateRdBu(colorScale(d.median)))
    .attr('stroke', 'black');

  // if (text) {
  //   graphContainer.selectAll('.text')
  //   .data(data)
  //   .enter().append('text')
  //   .attr('x', d => xScale(d[xVar])+ width / 200)
  //   .attr('y', d => yScale(d[yVar]) + width / 300)
  //   .attr('text-anchor', 'start')
  //   .attr('font-family', 'Arial')
  //   .attr('font-size', '25px')
  //   .text(d => d.airport);

  // }

  if (text) {

    // force directing the labels so they don't collide.

    var forceXs = forceX(d => xScale(d[xVar]))
      .strength(1)

    var forceYs = forceY(d => yScale(d[yVar]))
      .strength(0.5)

    window.collide = bboxCollide((d, i) =>
          [[xScale(d[xVar]) - 5, xScale(d[xVar])],[yScale(d[yVar]) + 5, yScale(d[yVar])]])
      .strength(1);

    window.forceSim = forceSimulation()
    .velocityDecay(0.6)
    .force('charge', forceManyBody())
    .force('x', forceXs)
    .force('y', forceYs)
    .force('collide', window.collide)
    .nodes(data)
    .on("tick", updateNetwork);

     var labelNodes = graphContainer
      .selectAll("g.node")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "node")

      labelNodes.append("text")
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial')
        .attr('font-size', '25px')
        .text(d => d.airport)
        .attr("x", function (d) {return xScale(d[xVar]) - width / 4})
        .attr("y", function (d) {return yScale(d[yVar]) + width / 300});


    function updateNetwork() {
      graphContainer.selectAll("g.node")
        .attr("transform", function (d) {return "translate(" + d.x + "," + d.y + ")"})
    }
  }

  if (!text){
    graphContainer.append('line')
      .attr('x1', xScale(Math.min(...(data.slice(0, 50)).map((d, i) => d.total))) - 10)
      .attr('x2', xScale(Math.min(...(data.slice(0, 50)).map((d, i) => d.total))) - 10)
      .attr('y1', yScale(.55))
      .attr('y2', yScale(.25))
      .attr('stroke', 'black');

    graphContainer.append('line')
      .attr('x1', xScale(Math.max(...(data.slice(0, 50)).map((d, i) => d.total))) + 10)
      .attr('x2', xScale(Math.max(...(data.slice(0, 50)).map((d, i) => d.total))) + 10)
      .attr('y1', yScale(.55))
      .attr('y2', yScale(.25))
      .attr('stroke', 'black');

    graphContainer.append('line')
      .attr('x1', xScale(Math.min(...(data.slice(0, 50)).map((d, i) => d.total))) - 10)
      .attr('x2', xScale(Math.max(...(data.slice(0, 50)).map((d, i) => d.total))) + 10)
      .attr('y1', yScale(.55))
      .attr('y2', yScale(.55))
      .attr('stroke', 'black');

    graphContainer.append('line')
      .attr('x1', xScale(Math.min(...(data.slice(0, 50)).map((d, i) => d.total))) - 10)
      .attr('x2', xScale(Math.max(...(data.slice(0, 50)).map((d, i) => d.total))) + 10)
      .attr('y1', yScale(.25))
      .attr('y2', yScale(.25))
      .attr('stroke', 'black');
  }

  // LEGEND

  const legendColors = schemeRdBu[10];
  const tenStops = [1,2,3,4,5,6,7,8,9,10];
  const elevenStops = [1,2,3,4,5,6,7,8,9,10,11];
  const tickVals = elevenStops.map((d, i) => Math.min(...length) + i * incr / 10);
  console.log(tickVals);

  const legendContainer = graphContainer.append('g')
    .attr('width', width / 5)
    .attr('height', height / 5)
    .attr('transform', `translate(0,${height - height / 3})`);

  const legWidth = legendContainer.attr('width');
  const legHeight = legendContainer.attr('height');

  const legs = legendContainer.selectAll('.rect')
    .data(tenStops)
    .enter().append('rect')
      .attr('x', d =>  3 * width / 5 + d * 9 * legWidth / 100)
      .attr('y', legHeight)
      .attr('width', legWidth / 10)
      .attr('height', legHeight / 20)
      .attr('fill', d => legendColors[10 - d]);

  legendContainer.selectAll('.line')
    .data(tenStops)
    .enter().append('line')
      .attr('x1', d =>  3 * width / 5 + (d + 1) * 9 * legWidth / 100)
      .attr('y1', legHeight / 10)
      .attr('x2', d =>  3 * width / 5 + (d + 1) * 9 * legWidth / 100)
      .attr('y2', legHeight / 20)
      .attr('transform',`translate(0, ${legendContainer.attr('height') - legHeight / 20})`)
      .attr('stroke', 'black');

  legendContainer.selectAll('.text')
    .data(elevenStops)
    .enter().append('text')
      .attr('x', d =>  3 * width / 5 + (d) * 9 * legWidth / 100)
      .attr('y', legHeight - legHeight / 30)
      // .attr('transform', `translate(0, ${legWidth / 3})`)
      .text(d => tickVals[d - 1])
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial')
      .attr('font-size', '13px')
      .attr('fill', 'black');

  // legend label

  legendContainer.append('text')
    .attr('x', 3 * width / 5 + 6 * 9 * legWidth / 100)
    .attr('y', legHeight - legHeight / 8)
    .text('Length of Delay (mins)')
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Arial')
    .attr('font-size', '25px')
    .attr('fill', 'black');

}


function drawRadial(container, data, rVar, numLevels, colors) {
  const height = container.attr('height');
  const width = container.attr('width');
  const xOffset = width / 2;
  const yOffset = height / 2
  const m = Math.min(xOffset, yOffset) / 20;
  const radius = 0.8 * Math.min(xOffset, yOffset);
  const maxThick = 0.03 * radius;


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
    .range([0, maxThick]);

  const axisData = [...new Array(numHours * numLevels)].map((x, i) => ({
     hour: i % numHours,
     level: Math.floor(i / numHours) + 1,
    }));

  container.selectAll('.lines')
    .data(axisData)
    .enter()
    .append('line')
    .attr('x1', d => axisScale(d.level) * (Math.sin(d.hour * 2 * Math.PI / numHours)))
    .attr('y1', d => axisScale(d.level) * (Math.cos(d.hour * 2 * Math.PI / numHours)))
    .attr('x2', d => axisScale(d.level) * (Math.sin((d.hour + 1) * 2 * Math.PI / numHours)))
    .attr('y2', d => axisScale(d.level) * (Math.cos((d.hour + 1) * 2 * Math.PI / numHours)))
    .attr('class', 'line')
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


  container.selectAll('.lines')
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

  container.selectAll('.axis-text')
    .data(levels)
    .enter().append('text')
    .style('font-family', 'sans-serif')
    .style('font-size', '22px')
    .attr('class', 'axis-text')
    .attr('x', 0)
    .attr('y', l => -axisScale(l + 1))
    .attr('transform', `translate(${xOffset}, ${yOffset})`)
    .text(l => formatFunc((l + 1)/ numLevels * maxRadius));

  container.selectAll('.hours-text')
    .data(hours)
    .enter().append('text')
    .style('font-family', 'sans-serif')
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
  .outerRadius((d, i) => rScale(d.rVar))
  .curve(curveCardinalClosed.tension(0.55));

  const graphContainer = container.append('g')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', `translate(${0}, ${0})`)
    // .attr('clip-path', 'url(#graphClip)');

  graphContainer.selectAll('.graph')
    .data(data)
    .enter().append('path')
    .attr('d', d => {
      d[rVar].push(d[rVar][0]);
      d.total.length === 24 ? d.total.push(d.total[0]) : '';
      return areaFunction(d[rVar].map((e, i) => ({rVar: e, total: d.total[i]})));
    })
    .attr('fill', (d, i) => colors[i])
    .attr('stroke', (d, i) => colors[i])
    .attr('stroke-width', '2px')
    .attr('transform', `translate(${xOffset}, ${yOffset})`)

  // const legend = container.append('g')
  //   .attr('height', yOffset * 1.5)
  //   .attr('width', xOffset / 2)
  //   .attr('transform', `translate(${ 2 * xOffset}, ${0.25 * yOffset})`)

  // legend.append('rect')
  //   .attr('class', 'legend')
  //   .attr('height', legend.attr('height'))
  //   .attr('width', legend.attr('width'))
  //   .attr('fill', 'None')
  //   .attr('stroke', 'black')
  //   .attr('stroke-width', '2px');

  // legend.selectAll('.box')
  //   .data(data)
  //   .enter()
  //   .append('rect')
  //   .attr('width', 0.7 * legend.attr('height') / 12)
  //   .attr('height', 0.7 * legend.attr('height') / 12)
  //   .attr('x', 0.05 * legend.attr('width'))
  //   .attr('y', (d, i) => (i + 0.15) * legend.attr('height') / 12)
  //   .attr('fill', (d, i) => colors[i]);

  // legend.selectAll('.text')
  //   .data(data)
  //   .enter()
  //   .append('text')
  //   .attr('font-family', 'sans-serif')
  //   .attr('x', 0.2 * legend.attr('width'))
  //   .attr('y', (d, i) => (i + 0.15) * legend.attr('height') / 12)
  //   .text(d => d.month)
}


function drawBar(container, data, barVar, yVar, xLabel, yLabel, title) {

  const height = container.attr('height');
  const width = container.attr('width');
  const margin = 70;
  const airlines = data.map(d => d[barVar])

  const xScale = scaleBand()
    .domain(airlines)
    .range([margin, width - margin])
    .paddingInner(0.1)
    .paddingOuter(0.1);
  const yScale = scaleLinear()
    .domain([0, max(data, d => d.percent * 100)])
    .range([height - margin, 2 * margin]);

  container.append('g')
    .attr('transform', `translate(0, ${height - margin})`)
    .call(axisBottom(xScale));
  container.append('g')
    .attr('transform', `translate(${margin}, 0)`)
    .call(axisLeft(yScale));
  container.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - margin - yScale(d.percent * 100))
    .attr('x', d => xScale(d.airline))
    .attr('y', d => yScale(d.percent * 100))
    .attr('fill', 'steelblue');
  container.append('text')
    .attr('x', width / 2)
    .attr('y', 1.25 * margin)
    .attr('font', 'sans-serif')
    .attr('font-size', '80px')
    .attr('text-anchor', 'middle')
    .text(title);
  container.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin / 8)
    .attr('font', 'sans-serif')
    .attr('font-size', '40px')
    .attr('text-anchor', 'middle')
    .text(xLabel);
 container.append('text')
    .attr('transform', `translate(${margin / 2}, ${height / 2})rotate(-90)`)
    .attr('font', 'sans-serif')
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

  // Eggshell

  const backgroundColor = '#EFF1ED';

  const seasonColors = ['#0b66f1', // winter
                        '#1cd50a', // spring 
                        '#fff60a', //summer 
                        '#fd8308']; // fall

  const winterColors = ['#17bbff',
                        '#0b66f1',
                        '#5d4fff'];

  const springColors = ['#52d585',
                        '#1cd50a',
                        '#8fd646']

  const summerColors = ['#cdff22',
                        '#fff60a',
                        '#f9da09'];

  const autumnColors = ['#f9b409',
                      '#fd8308',
                      '#f86607'];

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


  const fullAirportAverageContainer = makeContainer(vis, width / 4, height / 3, width / 2, height / 2, true);

  const zoomAirportAverageContainer = makeContainer(vis, width / 4, height / 3, 3 * width / 4, height / 2, true);

  const radialContainer = makeContainer(vis,  width, 0.4 * height, 0, 0, false);

  const rHeight = radialContainer.attr('height');
  const rWidth = radialContainer.attr('width');
  const radialSeasons = makeContainer(radialContainer, 0.7 * rWidth, 0.7 * rHeight, 0.15 * rWidth, 0.15 * rHeight);
  const radialWinter = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0);
  const radialSpring = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0);
  const radialSummer = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0.5 * rHeight);
  const radialAutumn = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0.5 * rHeight);


  // const radialAvgContainer = makeContainer(vis, 0.25 * width, 0.25 * height, width / 8, 0.4 * height)

  const barContainer = makeContainer(vis, 0.3 * height, 0.3 * height, 0.02 * width, 0.5 * height, true);

  // console.log(data[0].slice(8, 11))

  drawRadial(radialSeasons, data[3], 'percent', 8, seasonColors);
  drawRadial(radialWinter, data[0].slice(-1).concat(data[0].slice(0, 2)), 'percent', 8, winterColors);
  drawRadial(radialSpring, data[0].slice(2, 5), 'percent', 8, springColors);
  drawRadial(radialSummer, data[0].slice(5, 8), 'percent', 8, summerColors);
  drawRadial(radialAutumn, data[0].slice(8, 11), 'percent', 8, autumnColors);
  // drawRadial(radialAvgContainer, data[3], 'average', 10);
  // drawRadial(radialContainer, data[3], 'percent', 8);

  scatterPlot(fullAirportAverageContainer, data[1], 'total', 'percent', 'Total Outbound Flights (Airport Size)', 'Proportion of Delayed Flights', false);
  scatterPlot(zoomAirportAverageContainer, data[1], 'total', 'percent', 'Total Outbound Flights (Airport Size)', 'Proportion of Delayed Flights', true);

  // drawBar(container, data, barVar, yVar, xLabel, yLabel, title)
  drawBar(barContainer, data[2], 'airline', 'percent', 'Airlines', 'Percentage', 'Plot of Delays by Airlines');
}
