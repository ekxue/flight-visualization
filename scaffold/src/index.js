// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)

// import from: https://github.com/d3/d3/blob/master/API.md
import {select} from 'd3-selection';
import {scaleBand, scaleLinear, scaleLog, scaleQuantile} from 'd3-scale';
import {histogram} from 'd3-array';
import {axisBottom, axisLeft, axisTop, axisRight} from 'd3-axis';
import {format} from 'd3-format';
import {area, arc, radialArea, curveBasis, curveCardinalClosed} from 'd3-shape';
// import {interpolateRdBu, schemeRdBu} from 'd3-scale-chromatic';
// import {bboxCollide} from 'd3-bboxCollide';
// import {hsl} from 'd3-color';
import {annotation, annotationTypeBase, annotationLabel, annotationXYThreshold, annotationCallout, annotationCalloutCurve, annotationCalloutCircle, annotationCalloutRect} from 'd3-svg-annotation'; // need d3-drag for d3-annotation
import {forceSimulation, forceManyBody, forceLink, forceCollide} from 'd3-force';
import {TextBox} from 'd3plus-text';

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
  .then(arrayofDataBlobs => myVis(arrayofDataBlobs));
});


// Comments on how to use annotation functions:
// Usage: x, y, dx, dy are scaled from (0, 100) and annotationwidth is how many pixels wide you want the text wrapped
// dx and dy are change in x and y coordinates that you want the annotations to be relative to point on plot
// Example: lineAnnotation(barContainer, 'input some comments on the data', 'Annotation 1:', 20, 20, 5, 5, 150);
// rectAnnotation and circleAnnotation have attributes width and height and radius respectively, which are also scaled,
//    i.e. values between (0, 100)
// circleAnnotation(barContainer, 'more comments on data...', 'Annotation 2:', 50, 50, 10, 0, 8, 200);
// Use function in myVis
// Side notes: need to yarn add d3-drag and also keep styling from main.scss
function lineAnnotation(container, note, dx, dy, flipX, flipY) {
  const containerHeight = container.attr('height');
  const containerWidth = container.attr('width');
  const xScale = scaleLinear()
    .domain([0, 1])
    .range([0, containerWidth]);
  const yScale = scaleLinear()
    .domain([0, 1])
    .range([0, containerHeight]);

  const annotations = [{
    note: {
      title: note.title,
      label: note.label
    },
    type: annotationCallout,
    x: xScale(note.x), y: yScale(note.y),
    dx: (flipX) ? - xScale(dx) : xScale(dx), dy: (flipY) ? - yScale(dy): yScale(dy),
  }];

  container.append('g')
    .attr('class', 'annotation-group')
    .attr('font-family', 'Montserrat')
    .attr('font-size', 25)
    .attr('text-anchor', 'center')
    .call(annotation().textWrap(250).annotations(annotations));
}

function circleAnnotation(container, note, dx, dy, radius) {
  const containerHeight = container.attr('height');
  const containerWidth = container.attr('width');
  const xScale = scaleLinear()
    .domain([0, 1])
    .range([0, containerWidth]);
  const yScale = scaleLinear()
    .domain([0, 1])
    .range([0, containerHeight]);
  const maxRadius = Math.min(containerWidth, containerHeight);
  const radiusScale = scaleLinear(). domain([0, 100]).range([0, maxRadius]);

  const annotations = [{
    note: {
      title: note.title,
      label: note.label
    },
    type: annotationCalloutCircle,
    x: xScale(note.x), y: yScale(note.y),
    dx: xScale(dx), dy: yScale(dy),
    subject: {
      radius: radiusScale(radius),
      radiusPadding: 5
    }
  }]

  container.append('g')
    .attr('class', 'annotation-group')
    .attr('font-family', 'Montserrat')
    .call(annotation().textWrap(250).annotations(annotations));
}

function titleAnnotation(container, note, dx, dy, fontSize, boxSize) {
  const containerHeight = container.attr('height');
  const containerWidth = container.attr('width');
  const xScale = scaleLinear()
    .domain([0, 1])
    .range([0, containerWidth]);
  const yScale = scaleLinear()
    .domain([0, 1])
    .range([0, containerHeight]);

  const annotations = [{
    note: {
      title: note.title,
      label: note.label
    },
    type: annotationCallout,
    x: xScale(note.x), y: yScale(note.y),
    dx: xScale(dx), dy: yScale(dy),
  }];

  container.append('g')
    .attr('class', 'annotation-group')
    .attr('font-family', 'Montserrat')
    .attr('font-size', fontSize)
    .attr('text-anchor', 'center')
    .call(annotation().textWrap(boxSize).annotations(annotations));
}


// function brackAnnotation(container, label, title, x, y, dx, dy, y1, y2, annotationWidth, fontSize, fontFamily) {
//   const containerHeight = container.attr('height');
//   const containerWidth = container.attr('width');
//   const xScale = scaleLinear().domain([0, 100]).range([0, containerWidth]);
//   const yScale = scaleLinear().domain([0, 100]).range([0, containerHeight]);

//   const annotations = [{
//   note: {
//     title: title,
//     label: label
//   },
//   type: annotationXYThreshold,
//   x: xScale(x), y: yScale(y),
//   dx: (flipX) ? - xScale(dx) : xScale(dx), dy: (flipY) ? - yScale(dy): yScale(dy),
//   subject: {
//     y1: 0, 
//     y2: 500
//   }
// }];

//   container.append('g')
//     .attr('class', 'annotation-group')
//     .attr('font-family', fontFamily)
//     .call(annotation().textWrap(annotationWidth).annotations(annotations));
// }

function drawBoundingBox(container, data, params) {
  const xScale = params.xScale;
  const yScale = params.yScale;
  const cutoff = params.bboxCutoff;

  const xLow = Math.min(...data.slice(0, cutoff).map((d, i) => d.total));
  const yLow = Math.min(...data.slice(0, cutoff).map((d, i) => d.percent));
  const xHigh = Math.max(...data.slice(0, cutoff).map((d, i) => d.total));
  const yHigh = Math.max(...data.slice(0, cutoff).map((d, i) => d.percent));

  const width = xScale(xHigh) - xScale(xLow);
  const height = yScale(yLow) - yScale(yHigh);
  const xMargin = width * 0.10;
  const yMargin = height * 0.10;

  const bbox = container.append('rect')
    .attr('x', xScale(xLow) - 0.5 * xMargin)
    .attr('y', yScale(yHigh) - 0.5 * yMargin)
    .attr('width', width + xMargin)
    .attr('height', height + yMargin)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', '2px');

  return {
    x1: parseInt(bbox.attr('x'), 10),
    y1: parseInt(bbox.attr('y'), 10),
    x2: parseInt(bbox.attr('x'), 10) + parseInt(bbox.attr('width'), 10),
    y2: parseInt(bbox.attr('y'), 10) + parseInt(bbox.attr('height'), 10)
  };
}

function drawLabels(graphContainer, data, params) {
  // make nodes: alternates between the 'node' dot and a text label.

  const linkNodes = data.reduce((acc, row) => {
    const dot = {id: `${row.airport}_source`, type: 'source'};
    const label = {id: `${row.airport}_target`, type: 'target'};
    acc.push(label, dot);
    return acc;
  }, []);

  // make links between the sources and targets

  const links = data.map((d, i) => ({
    source: `${d.airport}_source`,
    target: `${d.airport}_target`,
    index: i
  }));

  const collide = forceCollide()
    .radius(100)
    .iterations(200)
    .strength(1);

  const charge = forceManyBody();

  const linkForce = forceLink(links)
    .id(d => d.id)
    .strength(1);

  forceSimulation()
    .nodes(linkNodes)
    .force('link', linkForce)
    .force('charge', charge)
    .force('collide', collide)
    .on('tick', updateNetwork);

  const labelNodes = graphContainer
    .selectAll('g.node')
    .data(linkNodes.filter(d => d.type === 'source'))
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

function drawScatterLegend(container, data, params) {
  const colors = params.colors;
  const width = container.attr('width');
  const height = container.attr('height');

  const legendWidth = 0.25 * width;
  const legendHeight = 0.2 * height;

  const bins = params.colorScale.quantiles();
  const xMin = Math.min(...data.map(d => d.median));
  const xMax = Math.max(...data.map(d => d.median));
  const lowerBounds = [xMin].concat(bins);
  const upperBounds = bins.concat([xMax]);

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([0, legendWidth]);

  const legendContainer = container.append('g')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('transform', `translate(${0.6 * width}, ${0.6 * height})`);

  // legendContainer.append('rect')
  //   .attr('height', legendHeight)
  //   .attr('width', legendWidth)
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr('fill', 'none')
  //   .attr('stroke', 'black');

  const times = xScale.ticks(xMax - xMin);
  const histogramGenerator = histogram(xScale.domain())
    .thresholds(times);
  const intervals = histogramGenerator(data.map(d => d.median));
  const counts = intervals.map(d => d.length);

  const histData = counts.map((c, i) => ({time: times[i], count: c}));

  const heightScale = scaleLinear()
    .domain([0, Math.max(...counts)])
    .range([0.95 * legendHeight, 0]);

  // const lineGenerator = area()
  //   .x(d => xScale(d.time))
  //   .y1(d => heightScale(d.count))
  //   .y0(d => heightScale(d.count) - 5)
  //   .curve(curveBasis);

  const areaGenerator = area()
    .x(d => xScale(d.time))
    .y1(d => heightScale(d.count))
    .y0(heightScale(0))
    .curve(curveBasis);

  legendContainer.append('clipPath')
    .attr('id', `legend-area-clip${params.colors.length}`)
    .append('path')
    .attr('d', areaGenerator(histData));

  legendContainer.append('g')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('transform', 'translate(0, 0)')
    .attr('clip-path', `url(#legend-area-clip${params.colors.length})`)
    .selectAll('.legend-rect')
    .data(colors)
    .enter().append('rect')
    .attr('x', (d, i) => xScale(lowerBounds[i]))
    .attr('y', 0)
    .attr('width', (d, i) => xScale(upperBounds[i]) - xScale(lowerBounds[i]))
    .attr('height', legendHeight)
    .attr('fill', d => d)
    .attr('opacity', 0.5);

  legendContainer.selectAll('.rect')
    .data(colors)
    .enter().append('rect')
    .attr('x', (d, i) => legendWidth * i / colors.length)
    .attr('y', 1.1 * legendHeight)
    .attr('width', (d, i) => legendWidth / colors.length)
    .attr('height', 0.05 * legendHeight)
    .attr('fill', d => d);

  legendContainer.selectAll('.rect')
    .data(colors)
    .enter().append('rect')
    .attr('x', (d, i) => xScale(lowerBounds[i]))
    .attr('y', 0.95 * legendHeight)
    .attr('width', (d, i) => xScale(upperBounds[i]) - xScale(lowerBounds[i]))
    .attr('height', 0.05 * legendHeight)
    .attr('fill', d => d);

  legendContainer.selectAll('.legend-text')
    .data([...new Array(colors.length + 1)].map((d, i) => i / colors.length))
    .enter()
    .append('text')
    .attr('x', (d, i) => legendWidth * i / colors.length)
    .attr('y', 1.2 * legendHeight)
    .attr('text-anchor', 'middle')
    .attr('font-family', params.textFont)
    .attr('font-size', '12px')
    .text(d => format('.0%')(d));
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

  const colors = params.colors;

  const maxPow = Math.ceil(Math.log10(Math.max(...data.map(d => d[xVar]))));
  const minPow = Math.floor(Math.log10(Math.min(...data.map(d => d[xVar]))));

  const maxPercent = Math.max(...data.map(d => d[yVar]));
  const minPercent = params.showZero ? 0 : Math.min(...data.map(d => d[yVar]));

  // const xtickData = [...new Array(maxPow - minPow + 1)].map((d, i) => Math.pow(10, minPow + i));
  // console.log(xtickData);
  // const xMargin = params.fullBorder ? 0.02 * plotWidth : 0;
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

  graphContainer.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', graphContainer.attr('height'))
    .attr('width', graphContainer.attr('width'))
    .attr('fill', 'none')
    .attr('stroke', 'black');

  const bottomAxis = params.fullBorder ? axisTop : axisBottom;
  const leftAxis = params.fullBorder ? axisRight : axisLeft;

  graphContainer.append('g')
    .attr('transform', `translate(0, ${plotHeight})`)
    .call(bottomAxis(xScale)
      .tickFormat(d => {
        return (Math.log10(d) % 1) === 0 ? format(',.2r')(d) : '';
      }));

  graphContainer.append('g')
    .attr('transform', 'translate(0, 0)')
    .call(leftAxis(yScale)
      .tickFormat(format('.0%')));

  graphContainer.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', plotHeight)
    .attr('width', plotWidth)
    .attr('fill', 'none')
    .attr('stroke', params.fullBorder ? 'black' : 'none')
    .attr('stroke-width', '3px');

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
  if (params.showLabels) {
    drawLabels(graphContainer, data, params);
  }

  const graphCorners = {
    x1: margin,
    y1: height - margin - plotHeight,
    x2: margin + plotWidth,
    y2: height - margin
  };

  const bboxCorners = params.bboxCutoff > 0 ? drawBoundingBox(graphContainer, data, params) : graphCorners;

  const corners = params.bboxCutoff < 0 ? graphCorners : {
    x1: bboxCorners.x1 + graphCorners.x1,
    y1: bboxCorners.y1 + graphCorners.y1,
    x2: bboxCorners.x2 + graphCorners.x1,
    y2: bboxCorners.y2 + graphCorners.y1
  };

  // LEGEND
  params.colors = colors;
  params.colorScale = colorScale;
  drawScatterLegend(container, data, params);

  return corners;
}

function createSeasonLegend(container, data, colors, season) {
  const graphHeight = container.attr('height');
  const graphWidth = container.attr('width');

  const height = 0.15 * graphHeight;
  const width = 0.35 * graphWidth;

  const legendContainer = container.append('g')
    .attr('height', height)
    .attr('width', width)
    .attr('transform', `translate(${0.5 * (graphWidth - width)}, ${- 0.15 * graphHeight})`);

  const textFont = 'montserrat';

  // legendContainer.append('rect')
  //   .attr('height', height)
  //   .attr('width', width)
  //   .attr('fill', 'None')
  //   .attr('stroke', 'black')
  //   .attr('stroke-width', '2px');

  const xScale = scaleBand()
    .domain([...new Array(2)].map((d, i) => i))
    .range([0, width])
    .paddingInner(0.1)
    .paddingOuter(0.1);
  const yScale = scaleBand()
    .domain([...new Array(2)].map((d, i) => i))
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
    .text(d => d.season.toUpperCase());
}

function createMonthLegend(container, data, colors, season) {
  const graphHeight = container.attr('height');
  const graphWidth = container.attr('width');

  const height = 0.2 * graphHeight;
  const width = 0.2 * graphWidth;

  const legendX = (season === 'spring') || (season === 'summer') ? 0.81 * graphWidth : 0.01 * graphWidth;

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

  legendContainer.selectAll('.legend-box')
    .data(data)
    .enter()
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
    .text(d => d.month);
}

function drawRadial(container, data, rVar, numLevels, colors, season, textFont) {
  const height = container.attr('height');
  const width = container.attr('width');
  const graphHeight = 0.9 * height;
  const graphWidth = 0.9 * width;
  const xOffset = graphWidth / 2;
  const yOffset = graphHeight / 2;
  const radius = 0.8 * Math.min(xOffset, yOffset);
  const maxThick = 0.03 * radius;

  // const titleFont = 'montserrat';

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

  // const axisData = [...new Array(numHours * numLevels)].map((x, i) => ({
  //   hour: i % numHours,
  //   level: Math.floor(i / numHours) + 1
  // }));

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
    .attr('transform', `translate(${(width - graphWidth) / 2}, ${(height - graphHeight) / 2})`);

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
    .text(l => formatFunc((l + 1) / numLevels * maxRadius));

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
    .text(h => `${h}:00`);

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
      if (d.total.length === 24) {
        d.total.push(d.total[0]);
      }
      // d.total.length === 24 ?  : '';
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
  const graphHeight = 0.6 * height;
  const graphWidth = 0.6 * width;
  const margin = 0.7 * Math.min(height - graphHeight, width - graphWidth);
  const airlines = data.map(d => d.airline);

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
    .attr('transform', `translate(${margin}, ${height - margin * 0.5 - graphHeight})`);

  graphContainer.append('g')
    .attr('transform', `translate(0, ${graphHeight})`)
    .call(axisBottom(xScale));

  graphContainer.append('g')
    .attr('transform', 'translate(0, 0)')
    .call(axisLeft(yScale));

  const yellow = '#e0b506';

  const blue = '#307db6';

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
    .attr('y', height - margin * 0.25)
    .attr('font-family', textFont)
    .attr('font-size', '40px')
    .attr('text-anchor', 'middle')
    .text(xLabel);

  container.append('text')
    .attr('transform', `translate(${margin * 0.75}, ${height / 2})rotate(-90)`)
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

// lineAnnotation(container, annotation, dx, dy, flipX, flipY)
// circleAnnotation(container, annotation, dx, dy, radius)

function drawRadarAnnotations(radialContainer, radialSeasons) {
  const rHeight = radialContainer.attr('height');
  const rWidth = radialContainer.attr('width');

  const seasonsAnn = makeContainer(radialSeasons, radialSeasons.attr('width'), radialSeasons.attr('height'), 0, 0);

  const seasonWidth = parseInt(seasonsAnn.attr('width'), 10);
  const seasonHeight = parseInt(seasonsAnn.attr('height'), 10);

  const fallNote = {
    label: 'Fall has the lowest percentage of delayed flights.',
    title: '',
    x: 0.36,
    y: 0.5
  }

  console.log(fallNote.x);
  console.log(fallNote.y);

  const dayNote = {
    label: 'The proportion of delays gradually increases throughout waking hours of the day.',
    title: '',
    x: 0.4,
    y: 0.3
  }

  const winterNote = {
    label: 'Winter has the most early morning delays.',
    title: '',
    x: 0.565,
    y: 0.7
  }

  lineAnnotation(seasonsAnn, fallNote, .1, .05, true, false);
  lineAnnotation(seasonsAnn, dayNote, .026, .1, false, false);
  lineAnnotation(seasonsAnn, winterNote, .015, .015, false, false);

  const radarTitle = makeContainer(radialContainer, rWidth * 0.33 , rHeight * 0.1, rWidth * 0.33 , rHeight * 0.8);
  const radarExplain = {
    label: 'Each circular line in the seasons graph represents one average day in the time period specified by the legend. The lines shooting out from the center each represent one hour in the 24-hour average day. Radius of the line represents the percent of delayed flights at that time of day. The fewer total flights there are at a given hour of day, the wider and less opaque the line is.',
    title: '',
    x: 0,
    y: 0
  };
  titleAnnotation(radarTitle, radarExplain, 0, 0, 50, 1630);

}

function drawScatterAnnotations(fullScatterContainer, zoomScatterContainer) {
  const s1Height = fullScatterContainer.attr('height');
  const s1Width = fullScatterContainer.attr('width');

  const sp1Ann = makeContainer(fullScatterContainer, s1Width,  s1Height, 10, 10, false);
  const sp2Ann = makeContainer(zoomScatterContainer, s1Width,  0.1 * s1Height, 0.05 * s1Width, 0);

  const largeNote = {
    label: 'Larger airports have shorter delay times',
    title: '',
    x: 0.65,
    y: 0.4
  }
  lineAnnotation(sp1Ann, largeNote, .05, .1, true, true);
  // lineAnnotation(seasonsAnn, dayNote, .05, .1, false, false);
  // lineAnnotation(seasonsAnn, winterNote, .015, .015, false, false);

  const scatterNote = {
    label: 'The leftmost scatterplot has the largest 150 IATA airports (where size is measured by total number of outbound flights). The color of each dot represents the median length of a delay at that airport. Red represents a longer median delay time, while blue represents a shorter median delay time. The rightmost graph is a zoomed-in view of the first graph that shows the largest 50 airports and labels them so that you can find the airports that you frequently fly from.',
    title: '',
    x: 0.15,
    y: - 0.4
  };

  titleAnnotation(sp1Ann, scatterNote, 0, 0, 60, 1600);

  const mdwNote = {
    label: 'Midway has shorter delays than O\'Hare, but a higher percentage of delays', 
    title: 'Midway',
    x: 0.51,
    y: 0.17
  };

  const ordNote = {
    label: 'O\'Hare has longer delays than Midway, but a lower percentage of delays',
    title: 'O\'Hare',
    x: 0.74,
    y: 0.41
  };

  const jfkNote = {
    label: 'JFK has moderately long delays, and a lower percentage of delays than Newark',
    title: 'JFK',
    x: 0.53,
    y: 0.53
  };

  const ewrNote = {
    label: 'Newark has the shortest delays of any NY airport, but a higher percentage of delays',
    title: 'Newark',
    x: 0.55,
    y: 0.36
  };

  const lgaNote = {
    label: 'LaGuardia has the longest delays of any NY airport or any top 50 airport, but a lower percentage of delays than other NY airports',
    title: 'LaGuardia',
    x: 0.54,
    y: 0.58
  };

  lineAnnotation(zoomScatterContainer, mdwNote, 0.2, 0.14, true, true);
  lineAnnotation(zoomScatterContainer, ordNote, 0.05, 0.1, false, true);
  lineAnnotation(zoomScatterContainer, jfkNote, 0.15, 0.25, true, true);
  lineAnnotation(zoomScatterContainer, ewrNote, 0.05, 0.1, false, true);
  lineAnnotation(zoomScatterContainer, lgaNote, 0.27, 0.16, true, false);

}

function drawBarAnnotations(barContainer) {
  const bHeight = barContainer.attr('height');
  const bWidth = barContainer.attr('width');

  const barExplain = {
    label: 'Each bar represents the percentage of delays for a particular airline. The bars are divided into two parts based on the cause for the delay. The bottom blue portion represents delays caused by the airline. The upper light yellow portion represents all other types of delays.',
    title: '',
    x: - 0.8,
    y: 0.75,
  };

  titleAnnotation(barContainer, barExplain, 0, 0, 50, 1730);

  const barNote = {
    label: 'Virgin Airlines has a proportionally low amount of airline-related delays.',
    title: '',
    x: 0.45,
    y: 0.45,
  };

  lineAnnotation(barContainer, barNote, 0.05, .1, false, true);

}


function drawAnnotations(radialContainer, radialSeasons, fullScatterContainer, zoomScatterContainer, barContainer){


 

  // brackAnnotation(sp1AnnS, 'Smaller airports do not appear to have a strong tendency to have longer or shorter delays', '', 10, sp1AnnS.attr('height') / 2, 0, 0, 0, 20, 200, 20, 'montserrat');
  // brackAnnotation(sp1AnnM, 'Mid-sized airports have longer and more severe delays', '', 10, - sp1AnnM.attr('height') / 2, 0, 0, 10, 20, 200, 20, 'montserrat', false, true);
  // brackAnnotation(sp1AnnL, 'Larger airports have the shortest delays', '', 10, sp1AnnL.attr('height') / 2, 0, 0, 10, 20, 200, 20, 'montserrat');
  
  // brackAnnotation(sp2Ann, 'Midway has shorter delays than O\'Hare, but a higher percentage of delays', 'Midway', 43, 80, 5, 40, 0, 0, 200, 20, 'montserrat', false, true);
  // brackAnnotation(sp2Ann, 'O\'Hare has longer delays than Midway, but a lower percentage of delays', 'O\'Hare', 68, 225, 5, 60, 0, 0, 200, 20, 'montserrat', false, true);
  // brackAnnotation(sp2Ann, 'JFK has moderately long delays, and a lower percentage of delays than Newark', 'JFK', 46, 295, 5, 360, 0, 0, 200, 20, 'montserrat', true, false);
  // brackAnnotation(sp2Ann, 'Newark has the shortest delays of any NY airport, but a higher percentage of delays', 'Newark', 47, 198, 20, 300, 0, 0, 200, 20, 'montserrat', true, false);
  // brackAnnotation(sp2Ann, 'LaGuardia has the longest delays of any NY airport or any top 50 airport, but a lower percentage of delays than other NY airports', 'LaGuardia', 47, 320, 10, 200, 0, 0, 200, 20, 'montserrat', false, false);
  // brackAnnotation(barAnn, 'Virgin Airlines has a proportionally low amount of airline-related delays.', 'Virgin America', 35, 300, 5, 50, 5, 50, 200, 20, 'montserrat', false, true);

}


function drawRadarPlots(vis, data, width, height) {
  const labelFont = 'open sans';
  const seasonColors = ['#375E97', '#3F681C', '#FFBB00', '#FF300C'];
  const winterColors = ['#2A354E', '#375E97', '#008DFF'];
  const springColors = ['#26391C', '#3F681C', '#469E00'];
  const summerColors = ['#BE8E3B', '#FFBB00', '#FDEF00'];
  const autumnColors = ['#C30000', '#FF300C', '#FFA26C'];

  const radialContainer = makeContainer(vis, width, 0.4 * height, 0, 0.1 * height, false);

  const rHeight = radialContainer.attr('height');
  const rWidth = radialContainer.attr('width');

  const radialSeasons =
    makeContainer(radialContainer, 0.7 * rWidth, 0.7 * rHeight, 0.15 * rWidth, 0.15 * rHeight, false);
  const radialWinter = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0, false);
  const radialSpring = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0, false);
  const radialAutumn = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0.5 * rHeight, false);
  const radialSummer =
    makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0.5 * rHeight, false);

  drawRadial(radialSeasons, data[3], 'percent', 8, seasonColors, 'season', labelFont);
  drawRadial(radialWinter, data[0].slice(-1).concat(data[0].slice(0, 2)),
   'percent', 8, winterColors, 'winter', labelFont);
  drawRadial(radialSpring, data[0].slice(2, 5), 'percent', 8, springColors, 'spring', labelFont);
  drawRadial(radialSummer, data[0].slice(5, 8), 'percent', 8, summerColors, 'summer', labelFont);
  drawRadial(radialAutumn, data[0].slice(8, 11), 'percent', 8, autumnColors, 'autumn', labelFont);

  drawRadarAnnotations(radialContainer, radialSeasons);
}

function drawScatterPlots(vis, data, width, height) {
  const labelFont = 'open sans';
  const divergingColors = [
    '#3d5c8f',
    '#2985d6',
    '#63a7cf',
    '#89c6dc',
    '#aec3d1',
    '#cccccc',
    '#dabda5',
    '#f69a6f',
    '#d96b59',
    '#cc343e',
    '#923a44'
  ];

  const zoomX = 0.5 * width;
  const zoomY = 0.5 * height;
  const fullX = 0.05 * width;
  const fullY = 0.63 * height;

  const fullScatterContainer = makeContainer(vis, 0.4 * width, 0.27 * height, fullX, fullY, false);
  const zoomScatterContainer = makeContainer(vis, 0.4 * width, 0.27 * height, zoomX, zoomY, false);

  const fullParams = {
    xVar: 'total',
    yVar: 'percent',
    xLabel: 'Total Outbound Flights',
    yLabel: 'Proportion of Delayed Flights',
    showLabels: false,
    showZero: true,
    textFont: labelFont,
    bboxCutoff: 50,
    colors: divergingColors,
    fullBorder: false
  };

  const zoomParams = {
    xVar: 'total',
    yVar: 'percent',
    xLabel: '',
    yLabel: '',
    showLabels: true,
    showZero: false,
    textFont: labelFont,
    bboxCutoff: -1,
    colors: divergingColors.slice(3, 8),
    fullBorder: true
  };

  const corner1 = scatterPlot(fullScatterContainer, data[1], fullParams);
  const corner2 = scatterPlot(zoomScatterContainer, data[1].slice(0, 50), zoomParams);

  vis.append('line')
    .attr('x1', corner1.x1 + fullX)
    .attr('y1', corner1.y1 + fullY)
    .attr('x2', corner2.x1 + zoomX)
    .attr('y2', corner2.y1 + zoomY)
    .attr('stroke', 'black')
    .attr('stroke-width', '2px');
  vis.append('line')
    .attr('x1', corner1.x2 + fullX)
    .attr('y1', corner1.y2 + fullY)
    .attr('x2', corner2.x2 + zoomX)
    .attr('y2', corner2.y2 + zoomY)
    .attr('stroke', 'black')
    .attr('stroke-width', '2px');

  drawScatterAnnotations(fullScatterContainer, zoomScatterContainer);

}

function drawBarPlot(vis, data, width, height) {
  const labelFont = 'open sans';
  const barContainer = makeContainer(vis, 0.4 * width, 0.2 * height, 0.5 * width, 0.77 * height, false);
  drawBar(barContainer, data[2], 'Airlines', 'Percentage', 'Plot of Delays by Airlines', labelFont);
  drawBarAnnotations(barContainer);
}

function myVis(data) {
  // The posters will all be 24 inches by 36 inches
  // Your graphic can either be portrait or landscape, up to you
  // the important thing is to make sure the aspect ratio is correct.
  const width = 5000;
  const height = 36 / 24 * width;
  // const margin = 70;

  // const list1 = [1, 1, 1, 1];
  // const backgroundColor = '#EFF1ED';
  const backgroundColor = '#f7f7f7';
  // const backgroundColor = 'None';

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

  const subtitle = makeContainer(vis, width * 0.33 , height * 0.1, width * 0.33 , height * 0.03);

  const subNote = {
    label: 'Flight delays are dependent on a number of factors. Here, we investigate three factors that affect airline delays: time, airport, and airline.',
    title: '',
    x: 0.33,
    y: 0.05
  }

  titleAnnotation(vis, subNote, 0, 0, 80, 1730)

  // const subText = [
  //   {text: 'Flight delays are dependent on a number of factors. Here, we investigate three factors that affect airline delays: time, airport, and airline.'}
  // ]

  // new TextBox()
  //   .data(subText)
  //   .x(width * 0.33)
  //   .y(height * 0.03)
  //   .fontResize(true)
  //   .width(width * 0.33)
  //   .height(height * 0.1)
  //   .render();
  // vis.append('text')
  //   .attr('x', 0.5 * width)
  //   .attr('y', 0.06 * height)
  //   .attr('font-family', 'montserrat')
  //   .attr('font-size', '70px')
  //   .attr('text-anchor', 'middle')
  //   .text('Flight delays are dependent on a number of factors. Here, we investigate three factors that affect airline delays: time, airport, and airline.');

  // drawAnnotations(radialContainer, radialSeasons, fullScatterContainer, zoomScatterContainer, barContainer);
  drawRadarPlots(vis, data, width, height);
  drawScatterPlots(vis, data, width, height);
  drawBarPlot(vis, data, width, height);
}
