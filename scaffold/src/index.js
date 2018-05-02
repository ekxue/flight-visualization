// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)

// import from: https://github.com/d3/d3/blob/master/API.md
import {select, selectAll} from 'd3-selection';
import {scaleBand, scaleLinear, bandwidth} from 'd3-scale';
import {max} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {format} from 'd3-format';
import {line} from 'd3-shape';

const domReady = require('domready');
domReady(() => {
  // this is just one example of how to import data. there are lots of ways to do it!
  // fetch('./data/delays_by_airport.json')
  //   .then(response => response.json())
  //   .then(data => myVis(data));

  Promise.all([
    './data/delay_counts.json',
    './data/delays_by_airport.json'
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

  // data = data.slice(0, 50);

  const xScale = scaleLinear()
    .domain([0, Math.max(...data.map(d => d[xVar]))])
    .range([margin, width - margin]);

  const yScale = scaleLinear()
    // .domain([Math.min(...data.map(d => d[yVar])), Math.max(...data.map(d => d[yVar]))])
    .domain([0, Math.max(...data.map(d => d[yVar]))])
    .range([height - margin, margin]);

  // const vis = select('.vis-container')
  //   .attr('width', width)
  //   .attr('height', height);

  const vis = container;

  vis.append('g')
    .attr('transform', `translate(0, ${height - margin})`)
    .call(axisBottom(xScale));

  vis.append('g')
    .attr('transform', `translate(${margin}, 0)`)
    .call(axisLeft(yScale));

  vis.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', margin / 2)
    .attr('text-anchor', 'middle')
    .text(yLabel);

  vis.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin / 4)
    .attr('text-anchor', 'middle')
    .text(xLabel);

  vis.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 2)
    .attr('cx', d => xScale(d[xVar]))
    .attr('cy', d => yScale(d[yVar]));

  if (text) {
    vis.selectAll('.text')
    .data(data)
    .enter().append('text')
    .attr('x', d => xScale(d[xVar]))
    .attr('y', d => yScale(d[yVar]))
    .attr('text-anchor', 'start')
    .attr('font-size', '10px')
    .text(d => d.airport);
  }
}


function drawRadial(container, data, rVar) {
  const height = container.attr('height');
  const width = container.attr('width');
  const centerOffset = Math.min(width, height) / 2;
  const m = centerOffset / 20;
  const radius = 0.8 * centerOffset;

  const colors = ['#3366cc',
                  '#dc3912',
                  '#ff9900',
                  '#109618',
                  '#990099',
                  '#0099c6',
                  '#dd4477',
                  '#66aa00',
                  '#b82e2e',
                  '#316395',
                  '#994499',
                  '#22aa99',
                  '#aaaa11',
                  '#aaaa11',
                  '#e67300',
                  '#8b0707',
                  '#651067',
                  '#329262',
                  '#5574a6',
                  '#3b3eac'];

  container.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', 'black')
    .attr('fill-opacity', 0.05);

  const numLevels = 8;
  const numHours = 24;


  const hours = [...new Array(numHours)].map((d, i) => i);
  const levels = [...new Array(numLevels)].map((d, i) => i);

  const axisScale = scaleLinear()
    .domain([0, numLevels])
    .range([0, radius]);

  const formatFunc = rVar === 'percent' ? format('.0%') : format('d');
  // const formatInt = ;

  console.log(Math.max(...data.map(d => Math.max(...d[rVar]))));

  const maxVal = Math.ceil(10 * Math.max(...data.map(d => Math.max(...d[rVar])))) / 10;

  const rScale = scaleLinear()
    .domain([0, maxVal])
    .range([0, radius]);

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
    .attr('transform', `translate(${centerOffset}, ${centerOffset})`);

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
    .attr('transform', `translate(${centerOffset}, ${centerOffset})`);

  container.selectAll('.axis-text')
    .data(levels)
    .enter().append('text')
    .style('font-family', 'sans-serif')
    .style('font-size', '11px')
    .attr('class', 'axis-text')
    .attr('x', 0)
    .attr('y', l => -axisScale(l + 1))
    .attr('transform', `translate(${centerOffset}, ${centerOffset})`)
    .text(l => formatFunc((l + 1)/ numLevels * maxVal));

  container.selectAll('.hours-text')
    .data(hours)
    .enter().append('text')
    .style('font-family', 'sans-serif')
    .style('font-size', '11px')
    .attr('class', 'hours-text')
    .attr('transform', `translate(${centerOffset}, ${centerOffset})`)
    .attr('x', h => axisScale(numLevels + 1) * (-Math.sin(-h * 2 * Math.PI / numHours)))
    .attr('y', h => axisScale(numLevels + 1) * (-Math.cos(-h * 2 * Math.PI / numHours)))
    .attr('text-anchor', 'middle')
    .text(h => `${h}:00`)

  const lineFunction = line()
    .x((d, i) => rScale(d) * (-Math.sin(-i * 2 * Math.PI / numHours)))
    .y((d, i) => rScale(d) * (-Math.cos(-i * 2 * Math.PI / numHours)));
    // .curve('linear');

  container.selectAll('.graph')
    .data(data)
    .enter().append('path')
    .attr('d', d => {
      d[rVar].push(d[rVar][0])
      return lineFunction(d[rVar]);
    })
    .attr('fill', 'none')
    .attr('stroke', (d, i) => colors[i])
    .attr('stroke-width', '2px')
    .attr('transform', `translate(${centerOffset}, ${centerOffset})`);

  const legend = container.append('g')
    .attr('height', centerOffset * 1.5)
    .attr('width', centerOffset / 2)
    .attr('transform', `translate(${ 2 * centerOffset}, ${0.25 * centerOffset})`)

  legend.append('rect')
    .attr('class', 'legend')
    .attr('height', legend.attr('height'))
    .attr('width', legend.attr('width'))
    .attr('fill', 'None')
    .attr('stroke', 'black')
    .attr('stroke-width', '2px');

  legend.selectAll('.box')
    .data(data)
    .enter()
    .append('rect')
    .attr('width', 0.7 * legend.attr('height') / 12)
    .attr('height', 0.7 * legend.attr('height') / 12)
    .attr('x', 0.05 * legend.attr('width'))
    .attr('y', (d, i) => (i + 0.15) * legend.attr('height') / 12)
    .attr('fill', (d, i) => colors[i]);

  legend.selectAll('.text')
    .data(data)
    .enter()
    .append('text')
    .attr('font-family', 'sans-serif')
    .attr('x', 0.2 * legend.attr('width'))
    .attr('y', (d, i) => (i + 0.15) * legend.attr('height') / 12)
    .text(d => d.month)
}


function myVis(data) {
  // The posters will all be 24 inches by 36 inches
  // Your graphic can either be portrait or landscape, up to you
  // the important thing is to make sure the aspect ratio is correct.

  const height = 5000; // was 5000, changed to 500 for viewing in browser
  const width = 36 / 24 * height;
  const margin = 70;

  const vis = select('.vis-container')
    .attr('width', width)
    .attr('height', height);

  vis.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', 'black')
    .attr('fill-opacity', 0.05);

  const airportAverageContainer = vis.append('g')
    .attr('width', width/4)
    .attr('height', height/3)
    .attr('transform', `translate(0, ${height/2})`);

  const radialContainer = vis.append('g')
    .attr('width', 0.4 * height)
    .attr('height', 0.3 * height )
    .attr('transform', `translate(${width / 8}, ${height / 15})`);

  const radialAvgContainer = vis.append('g')
    .attr('width', 0.4 * height)
    .attr('height', 0.3 * height)
    .attr('transform', `translate(${width / 8}, ${2 * height / 5})`);


  drawRadial(radialContainer, data[0], 'percent');
  drawRadial(radialAvgContainer, data[0], 'average');

  scatterPlot(airportAverageContainer, data[1], 'total', 'percent', 'Total Outbound Flights', 'Proportion of Delayed Flights', false);
  // scatterPlot(data.slice(0,150), 'total', 'percent', 'Total Outbound Flights', 'Proportion of Delayed Flights', true);
  
  // scatterPlot(data, 'total', 'average', 'Total Outbound Flights', 'Average Delay Time (min)', false);
  // scatterPlot(data.slice(0,150), 'total', 'average', 'Total Outbound Flights', 'Average Delay Time (min)', true);
  
  // scatterPlot(data, 'total', 'median', 'Total Outbound Flights', 'Median Delay Time (min)', false);
  // scatterPlot(data.slice(0,150), 'total', 'median', 'Total Outbound Flights', 'Median Delay Time (min)', true);
  

}
