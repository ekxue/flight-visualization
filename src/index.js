// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)

// import from: https://github.com/d3/d3/blob/master/API.md
import {select} from 'd3-selection';
import {scaleBand, scaleLinear, scaleLog, scaleQuantile} from 'd3-scale';
import {axisBottom, axisLeft, axisTop, axisRight} from 'd3-axis';
import {format} from 'd3-format';
import {arc, radialArea, curveCardinalClosed} from 'd3-shape';
import {annotation, annotationLabel, annotationCallout} from 'd3-svg-annotation';

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
    dx: (flipX) ? -xScale(dx) : xScale(dx), dy: (flipY) ? -yScale(dy) : yScale(dy)
  }];

  container.append('g')
    .attr('class', 'annotation-group')
    .attr('font-family', 'Montserrat')
    .attr('font-size', 25)
    .attr('fill', '#FFFFFF')
    .attr('text-anchor', 'center')
    .call(annotation().textWrap(250).annotations(annotations));

  container.selectAll('.annotation text')
    .attr('fill', 'black');

  container.selectAll('.annotation line')
    .attr('fill', 'black');
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
    type: annotationLabel,
    x: xScale(note.x), y: yScale(note.y),
    dx: xScale(dx), dy: yScale(dy)
  }];

  container.append('g')
    .attr('class', 'annotation-group')
    .attr('font-family', 'Montserrat')
    .attr('font-size', fontSize)
    .attr('text-anchor', 'right')
    .attr('fill', '#575757')
    .call(annotation().textWrap(boxSize).annotations(annotations));

  container.selectAll('text').enter()
    .attr('fill', 'black');
}

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
  graphContainer.selectAll('.labels')
    .data(data)
    .enter().append('text')
    .attr('text-anchor', 'start')
    .attr('font-family', params.textFont)
    .attr('font-size', '25px')
    .attr('id', d => d.airport)
    .text(d => d.airport)
    .attr('x', d => params.xScale(d[params.xVar]))
    .attr('y', d => params.yScale(d[params.yVar]))
    .attr('dx', 15);

  graphContainer.selectAll('#PIT, #CLT')
    .attr('dx', -55);

  graphContainer.selectAll('#MSY, #FLL, #MKE, #LGA, #SMF')
    .attr('dx', -65);

  graphContainer.selectAll('#CMH, #RSW, #RDU')
    .attr('dx', -75);

  graphContainer.selectAll('#HNL, #TPA, #PHL, #RDU, #BOS, #PIT')
    .attr('dy', 20);
  graphContainer.selectAll('#MKE')
    .attr('dy', 30);
}

function drawScatterLegend(container, data, params) {
  // const colors = params.colors;
  const width = container.attr('width');
  const height = container.attr('height');

  const legendWidth = params.fullBorder ? 0.30 * width : 0.35 * width;
  const legendHeight = 0.2 * height;

  const xMin = Math.min(...data.map(d => d.median));
  const xMax = Math.max(...data.map(d => d.median));

  const legendContainer = container.append('g')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('transform', `translate(${0.6 * width}, ${0.6 * height})`);

  const percentScale = scaleLinear()
    .domain([0, params.colors.length])
    .range([0, legendWidth]);

  legendContainer.selectAll('.rect')
    .data(params.colors)
    .enter().append('rect')
    .attr('x', (d, i) => percentScale(i))
    .attr('y', 1.1 * legendHeight)
    .attr('width', (d, i) => legendWidth / params.colors.length)
    .attr('height', 0.05 * legendHeight)
    .attr('fill', d => d);

  legendContainer.selectAll('.legend-text')
    .data([...new Array(params.colors.length + 1)].map((d, i) => i / params.colors.length))
    .enter()
    .append('text')
    .attr('x', (d, i) => percentScale(i))
    .attr('y', 1.2 * legendHeight)
    .attr('text-anchor', 'middle')
    .attr('font-family', params.textFont)
    .attr('font-size', '18px')
    .text(d => format('.0%')(d));

  legendContainer.append('text')
    .attr('x', 0.5 * legendWidth)
    .attr('y', 1.28 * legendHeight)
    .attr('font-family', params.textFont)
    .attr('font-size', '20px')
    .attr('text-anchor', 'middle')
    .text('Percentile');

  legendContainer.append('text')
    .attr('x', 0)
    .attr('y', 1.08 * legendHeight)
    .attr('text-anchor', 'middle')
    .attr('font-family', params.textFont)
    .attr('font-size', '18px')
    .text(`${format(',.0f')(xMin)} min`);

  legendContainer.append('text')
    .attr('x', legendWidth)
    .attr('y', 1.08 * legendHeight)
    .attr('text-anchor', 'middle')
    .attr('font-family', params.textFont)
    .attr('font-size', '18px')
    .text(`${format(',.0f')(xMax)} min`);

  legendContainer.append('text')
    .attr('x', 0.5 * legendWidth)
    .attr('y', legendHeight)
    .attr('font-family', params.textFont)
    .attr('font-size', '20px')
    .attr('text-anchor', 'middle')
    .text('Median Delay Times');
}

function scatterAxis(graphContainer, data, params) {
  const bottomAxis = params.fullBorder ? axisTop : axisBottom;
  const leftAxis = params.fullBorder ? axisRight : axisLeft;

  const zoomFormat = d => d > 100000 ? `${d / 1000000}M` : `${d / 1000}K`;
  const formatFunc = params.fullBorder ? zoomFormat : format(',.2r');

  graphContainer.append('g')
  .attr('transform', `translate(0, ${params.plotHeight})`)
  .call(bottomAxis(params.xScale)
    .tickFormat(d => {
      return (Math.log10(d) % 1) === 0 ? formatFunc(d) : '';
    })
    .tickSize(10));

  graphContainer.append('g')
    .attr('transform', 'translate(0, 0)')
    .call(leftAxis(params.yScale)
      .tickFormat(format('.0%'))
      .tickSize(10));

  graphContainer.selectAll('.tick text')
    .attr('font-size', '25px')
    .attr('font-family', 'Montserrat');

  select('body > svg > g:nth-child(6) > g:nth-child(1) > g:nth-child(1) > g:nth-child(2) > text')
    .attr('dx', 30);

  select('body > svg > g:nth-child(6) > g:nth-child(1) > g:nth-child(1) > g:nth-child(20) > text')
    .attr('dx', -24);

  graphContainer.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', params.plotHeight)
    .attr('width', params.plotWidth)
    .attr('fill', 'none')
    .attr('stroke', params.fullBorder ? 'black' : 'none')
    .attr('stroke-width', '3px');

  graphContainer.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 10)
    .attr('cx', d => params.xScale(d[params.xVar]))
    .attr('cy', d => params.yScale(d[params.yVar]))
    .style('fill', d => params.colorScale(d.median))
    .attr('stroke', 'black');
}

function scatterPlot(container, data, params) {
  const height = container.attr('height');
  const width = container.attr('width');
  params.plotHeight = 0.85 * height;
  params.plotWidth = 0.85 * width;
  const margin = 0.7 * Math.min(height - params.plotHeight, width - params.plotWidth);
  const plotMargin = 0.10;

  const maxPow = Math.ceil(Math.log10(Math.max(...data.map(d => d[params.xVar]))));
  const minPow = Math.floor(Math.log10(Math.min(...data.map(d => d[params.xVar]))));

  const maxPercent = Math.max(...data.map(d => d[params.yVar]));
  const minPercent = params.showZero ? 0 : Math.min(...data.map(d => d[params.yVar]));

  params.xScale = scaleLog()
    .domain([Math.pow(10, minPow), Math.pow(10, maxPow)])
    .range([0, params.plotWidth]);

  params.yScale = scaleLinear()
    .domain([minPercent - plotMargin * (maxPercent - minPercent),
      maxPercent + plotMargin * (maxPercent - minPercent)])
    .range([params.plotHeight, 0]);

  params.colorScale = scaleQuantile()
    .domain(data.map(d => d.median))
    .range(params.colors);

  const graphContainer = container.append('g')
    .attr('height', params.plotHeight)
    .attr('width', params.plotWidth)
    .attr('transform', `translate(${margin}, ${height - margin - params.plotHeight})`);

  scatterAxis(graphContainer, data, params);

  container.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', margin / 2)
    .attr('text-anchor', 'middle')
    .attr('font-size', '35px')
    .attr('font-family', params.textFont)
    .text(params.yLabel);

  container.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin / 4)
    .attr('text-anchor', 'middle')
    .attr('font-family', params.textFont)
    .attr('font-size', '35px')
    .text(params.xLabel);

  if (params.showLabels) {
    drawLabels(graphContainer, data, params);
  }

  const graphCorners = {
    x1: margin,
    y1: height - margin - params.plotHeight,
    x2: margin + params.plotWidth,
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
    .attr('transform', `translate(${0.5 * (graphWidth - width)}, ${-0.15 * graphHeight})`);

  const textFont = 'Montserrat';

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

  const textFont = 'Montserrat';

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

function drawAreas(graphContainer, data, params) {
  const rScale = scaleLinear()
    .domain([0, params.maxRadius])
    .range([0, params.radius]);

  const rVar = params.rVar;
  const maxThick = 0.03 * params.radius;

  const thickScale = scaleLinear()
    .domain([Math.min(...data.map(d => Math.min(...d.total))),
      Math.max(...data.map(d => Math.max(...d.total)))])
    .range([maxThick, 2]);

  const areaFunction = radialArea()
    .angle((d, i) => i * 2 * Math.PI / 24)
    .innerRadius((d, i) => rScale(d.rVar) - thickScale(d.total))
    .outerRadius((d, i) => rScale(d.rVar) + thickScale(d.total))
    .curve(curveCardinalClosed.tension(0.55));

  const arcGenerator = arc()
    .innerRadius(0)
    .outerRadius(params.radius);

  graphContainer.selectAll('.data-clip')
    .data(data)
    .enter().append('clipPath')
    .attr('id', (d, i) => `${params.season + i}`)
    .append('path')
    .attr('d', d => {
      d[rVar].push(d[rVar][0]);
      if (d.total.length === 24) {
        d.total.push(d.total[0]);
      }
      // d.total.length === 24 ?  : '';
      return areaFunction(d[rVar].map((e, i) => ({rVar: e, total: d.total[i]})));
    })
    .attr('transform', `translate(${params.xOffset}, ${params.yOffset})`);

  graphContainer.selectAll('.base')
    .data(data)
    .enter().append('g')
    .attr('width', graphContainer.attr('width'))
    .attr('height', graphContainer.attr('height'))
    .attr('transform', 'translate(0, 0)')
    .attr('clip-path', (d, i) => `url(#${params.season + i})`)
    .selectAll('.base')
    .data((d, i) => d.total.slice(0, -1).map(t => ({total: t, color: params.colors[i]})))
    .enter().append('path')
    .attr('d', (d, i) => arcGenerator({startAngle: i / 12 * Math.PI, endAngle: (i + 1) / 12 * Math.PI}))
    .attr('transform', `translate(${params.xOffset}, ${params.yOffset})`)
    .attr('fill', d => d.color)
    .attr('opacity', d => 0.85 * d.total / Math.max(...data.map(e => Math.max(...e.total))) + 0.15);
}

function drawRadial(container, data, params) {
  const height = container.attr('height');
  const width = container.attr('width');
  const graphHeight = 0.9 * height;
  const graphWidth = 0.9 * width;
  const rVar = params.rVar;
  // const maxVal = Math.ceil(10 * Math.max(...data.map(d => Math.max(...d[rVar])))) / 10;
  const maxVal = 0.7;

  params.xOffset = graphWidth / 2;
  params.yOffset = graphHeight / 2;
  params.radius = 0.8 * Math.min(params.xOffset, params.yOffset);
  params.maxRadius = rVar === 'percent' ? maxVal : 70;

  const hours = [...new Array(24)].map((d, i) => i);
  const levels = [...new Array(params.numLevels)].map((d, i) => i);

  const axisScale = scaleLinear()
    .domain([0, params.numLevels])
    .range([0, params.radius]);

  const formatFunc = rVar === 'percent' ? format('.0%') : format('d');

  if (params.season !== 'season') {
    container.append('text')
      .attr('x', 0.5 * width)
      .attr('y', 0.03 * height)
      .attr('font-family', 'Montserrat')
      .attr('font-weight', 'semi-bold')
      .attr('font-size', '80px')
      .attr('text-anchor', 'middle')
      .text(params.season.toUpperCase());
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
    .attr('transform', `translate(${params.xOffset}, ${params.yOffset})`);

  graphContainer.selectAll('.lines')
    .data(hours)
    .enter().append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', h => axisScale(params.numLevels) * (Math.sin(h * 2 * Math.PI / 24)))
    .attr('y2', h => axisScale(params.numLevels) * (Math.cos(h * 2 * Math.PI / 24)))
    .attr('stroke-width', '1px')
    .attr('stroke-opacity', '0.75')
    .attr('stroke', 'grey')
    .attr('transform', `translate(${params.xOffset}, ${params.yOffset})`);

  graphContainer.selectAll('.axis-text')
    .data(levels)
    .enter().append('text')
    .style('font-family', params.labelFont)
    .style('font-size', '22px')
    .attr('class', 'axis-text')
    .attr('x', 0)
    .attr('y', l => -axisScale(l + 1))
    .attr('transform', `translate(${params.xOffset}, ${params.yOffset})`)
    .text(l => formatFunc((l + 1) / params.numLevels * params.maxRadius));

  graphContainer.selectAll('.hours-text')
    .data(hours)
    .enter().append('text')
    .style('font-family', params.labelFont)
    .style('font-size', '22px')
    .attr('class', 'hours-text')
    .attr('transform', `translate(${params.xOffset}, ${params.yOffset})`)
    .attr('x', h => 1.05 * params.radius * (-Math.sin(-h * 2 * Math.PI / 24)))
    .attr('y', h => 1.05 * params.radius * (-Math.cos(-h * 2 * Math.PI / 24)))
    .attr('text-anchor', 'middle')
    .text(h => `${h}:00`);

  drawAreas(graphContainer, data, params);

  const legendFunc = params.season === 'season' ? createSeasonLegend : createMonthLegend;

  legendFunc(graphContainer, data, params.colors, params.season);
}

function drawBar(container, data, xLabel, yLabel, textFont, accentColor) {

  const height = container.attr('height');
  const width = container.attr('width');
  const graphHeight = 0.6 * height;
  const graphWidth = 0.6 * width;
  const margin = 0.7 * Math.min(height - graphHeight, width - graphWidth);
  const colors = [accentColor, '#cccccc'];

  const xScale = scaleBand()
    .domain(data.map(d => d.iatacode))
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
    .call(axisBottom(xScale)
      .tickSize(10));

  graphContainer.append('g')
    .attr('transform', 'translate(0, 0)')
    .call(axisLeft(yScale)
      .tickFormat(format('.0%'))
      .tickSize(10));

  graphContainer.selectAll('.tick text')
    .attr('font-size', '20px')
    .attr('font-family', 'Montserrat');

  graphContainer.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('width', xScale.bandwidth())
    .attr('height', d => yScale(d.percenta) - yScale(d.percent))
    .attr('x', d => xScale(d.iatacode))
    .attr('y', d => yScale(d.percent))
    .attr('fill', colors[1]);

  graphContainer.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('width', xScale.bandwidth())
    .attr('height', d => graphHeight - yScale(d.percenta))
    .attr('x', d => xScale(d.iatacode))
    .attr('y', d => yScale(d.percenta))
    .attr('fill', colors[0]);

  const legendWidth = 0.25 * width;
  const legendHeight = 0.1 * height;
  const legendScale = scaleBand()
    .domain([...new Array(2)].map((d, i) => i))
    .range([legendHeight, 0])
    .paddingInner(0.1)
    .paddingOuter(0.1);

  const legendContainer = container.append('g')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('transform', `translate(${0.85 * width}, ${0.7 * height})`);

  legendContainer.selectAll('.legend-rect')
    .data(colors)
    .enter()
    .append('rect')
    .attr('x', 0.05 * legendWidth)
    .attr('y', (d, i) => legendScale(i))
    .attr('width', legendScale.bandwidth())
    .attr('height', legendScale.bandwidth())
    .attr('fill', d => d);

  legendContainer.selectAll('.legend-text')
    .data(colors)
    .enter()
    .append('text')
    .attr('x', 0.1 * legendWidth + legendScale.bandwidth())
    .attr('y', (d, i) => legendScale(i) + 0.7 * legendScale.bandwidth())
    .attr('font-family', textFont)
    .attr('font-size', `${0.7 * legendScale.bandwidth()}px`)
    .text((d, i) => (i % 2) === 1 ? 'Total Delays' : 'Airline Delays');

  container.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin * 0.25)
    .attr('font-family', textFont)
    .attr('font-size', '35px')
    .attr('text-anchor', 'middle')
    .text(xLabel);

  container.append('text')
    .attr('transform', `translate(${margin * 0.75}, ${0.55 * height})rotate(-90)`)
    .attr('font-family', textFont)
    .attr('font-size', '35px')
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

function drawRadarAnnotations(radialContainer, radialSeasons, accentColor) {
  const rHeight = radialContainer.attr('height');
  const rWidth = radialContainer.attr('width');

  const seasonsAnn =
    makeContainer(radialSeasons, radialSeasons.attr('width'), radialSeasons.attr('height'), 0, 0);

  const fallNote = {
    label: 'Autumn had the lowest percentage of delayed flights.',
    title: '',
    x: 0.36,
    y: 0.5
  };

  const dayNote = {
    label: 'The proportion of delays gradually increases throughout waking hours of the day.',
    title: '',
    x: 0.4,
    y: 0.3
  };

  const winterNote = {
    label: 'Winter had the most early morning delays.',
    title: '',
    x: 0.565,
    y: 0.7
  };

  lineAnnotation(seasonsAnn, fallNote, 0.1, 0.05, true, false);
  lineAnnotation(seasonsAnn, dayNote, 0.026, 0.1, false, false);
  lineAnnotation(seasonsAnn, winterNote, 0.015, 0.015, false, false);

  const radarTitle =
    makeContainer(radialContainer, rWidth * 0.25, 300, rWidth * 0.375, rHeight * 0.8, false);
  const radarExplain = {
    label: [
      'Each circular line in represents an average day within the specified time period. ',
      'The width and transparency of the line increase as the total number of flights decreases ',
      'for a particular hour within the specified time period.'
    ].join(''),
    title: '',
    x: 0.505,
    y: 0
  };
  titleAnnotation(radarTitle, radarExplain, 0, 0, 50, 0.97 * radarTitle.attr('width'));

  radarTitle.append('rect')
    .attr('height', radarTitle.attr('height'))
    .attr('width', 15)
    .attr('fill', accentColor);
}

function drawScatterAnnotations(fullScatterContainer, zoomScatterContainer, accentColor) {
  const s1Height = fullScatterContainer.attr('height');
  const s1Width = fullScatterContainer.attr('width');

  const s2Height = zoomScatterContainer.attr('height');
  const s2Width = zoomScatterContainer.attr('width');

  const sp1Ann = makeContainer(fullScatterContainer, s1Width, s1Height, 10, 10);

  const annContainer = makeContainer(zoomScatterContainer, 1500, 480, -s2Width, 0.08 * s2Height, false);

  const largeNote = {
    label: 'Larger airports have shorter delay times',
    title: '',
    x: 0.65,
    y: 0.4
  };
  lineAnnotation(sp1Ann, largeNote, 0.05, 0.1, true, true);

  annContainer.append('rect')
    .attr('height', annContainer.attr('height'))
    .attr('width', 15)
    .attr('fill', accentColor);

  const scatterNote = {
    label: [
      'The scatterplot below shows the relationship between airport size (as measured ',
      'by number of outbound flights), proportion of delays, and median delay time for all 323 ',
      'airports within the United States. The color of each dot represents the median length ',
      'of a delay at that airport. Red represents a longer median delay time, while blue represents ',
      'a shorter median delay time. The graph on the right shows a rescaled plot of the 50 largest ',
      'airports.'
    ].join(''),
    title: '',
    x: 0.5,
    y: 0
  };

  titleAnnotation(annContainer, scatterNote, 0, 0, 50, 0.98 * annContainer.attr('width'));

  const mdwNote = {
    label: 'Midway had a shorter median delay than O\'Hare, but a higher percentage of delays',
    title: 'Midway',
    x: 0.508,
    y: 0.17
  };

  const ordNote = {
    label: 'O\'Hare had a longer median delay than Midway, but a lower percentage of delays',
    title: 'O\'Hare',
    x: 0.741,
    y: 0.41
  };

  const jfkNote = {
    label: 'JFK had a median delay of (17 min), and a lower percentage of delays than Newark',
    title: 'JFK',
    x: 0.5335,
    y: 0.534
  };

  const ewrNote = {
    label: [
      'Newark had the shortest median delay (16 min) of any NYC airport, despite being one of ',
      'the worst among the top 50 airports in terms of median delay time.'
    ].join(''),
    title: 'Newark',
    x: 0.55,
    y: 0.36
  };

  const lgaNote = {
    label: [
      'LaGuardia had the longest median delay (20 min) of any NY airport or any top 50 airport, but a lower ',
      'percentage of delays than other NY airports'
    ].join(''),
    title: 'LaGuardia',
    x: 0.544,
    y: 0.578
  };

  lineAnnotation(zoomScatterContainer, mdwNote, 0.2, 0.14, true, true);
  lineAnnotation(zoomScatterContainer, ordNote, 0.05, 0.1, false, true);
  lineAnnotation(zoomScatterContainer, jfkNote, 0.20, 0.2, true, true);
  lineAnnotation(zoomScatterContainer, ewrNote, 0.05, 0.1, false, true);
  lineAnnotation(zoomScatterContainer, lgaNote, 0.275, 0.158, true, false);

}

function drawBarAnnotations(barContainer, accentColor) {
  const bHeight = barContainer.attr('height');
  const bWidth = barContainer.attr('width');

  const barExplain = {
    label: [
      'The barchart to the right shows the proportion of delays for the 14 largest domestic air ',
      'carriers in the US. The bars are divided into two portions, the lower of which shows the proportion ',
      'of delays caused by circumstances within the airline\'s control. The upper portion shows all ',
      'other delays.'
    ].join(''),
    title: '',
    x: 0.5,
    y: 0
  };

  const barBox = makeContainer(barContainer, bWidth * 0.8, 295, -bWidth * 0.8, bHeight * 0.68, false);

  titleAnnotation(barBox, barExplain, 0, 0, 50, 0.98 * barBox.attr('width'));

  const barNote = {
    label: 'Virgin America Airlines had a proportionally low amount of airline-related delays.',
    title: '',
    x: 0.467,
    y: 0.45
  };

  lineAnnotation(barContainer, barNote, 0.05, 0.1, false, true);

  barBox.append('rect')
    .attr('height', barBox.attr('height'))
    .attr('width', 15)
    .attr('fill', accentColor);

}

function drawRadarPlots(vis, data, width, height, accentColor) {
  const textFont = 'Montserrat';
  const seasonColors = ['#375E97', '#3F681C', '#FFBB00', '#FF300C'];
  const winterColors = ['#2A354E', '#375E97', '#008DFF'];
  const springColors = ['#26391C', '#3F681C', '#469E00'];
  const summerColors = ['#BE8E3B', '#FFBB00', '#FDEF00'];
  const autumnColors = ['#C30000', '#FF300C', '#FFA26C'];

  const radialContainer = makeContainer(vis, width, 0.4 * height, 0, 0.1 * height, false);

  const rHeight = radialContainer.attr('height');
  const rWidth = radialContainer.attr('width');

  const radialSeasons =
    makeContainer(radialContainer, 0.7 * rWidth, 0.7 * rHeight, 0.15 * rWidth, 0.10 * rHeight, false);
  const radialWinter = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0, false);
  const radialSpring = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0, false);
  const radialAutumn = makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0, 0.5 * rHeight, false);
  const radialSummer =
    makeContainer(radialContainer, 0.4 * rWidth, 0.5 * rHeight, 0.6 * rWidth, 0.5 * rHeight, false);

  const seasonParams = {
    rVar: 'percent',
    numLevels: 8,
    colors: seasonColors,
    season: 'season',
    labelFont: textFont
  };

  const winterParams = {
    rVar: 'percent',
    numLevels: 8,
    colors: winterColors,
    season: 'winter',
    labelFont: textFont
  };

  const springParams = {
    rVar: 'percent',
    numLevels: 8,
    colors: springColors,
    season: 'spring',
    labelFont: textFont
  };

  const summerParams = {
    rVar: 'percent',
    numLevels: 8,
    colors: summerColors,
    season: 'summer',
    labelFont: textFont
  };

  const autumnParams = {
    rVar: 'percent',
    numLevels: 8,
    colors: autumnColors,
    season: 'autumn',
    labelFont: textFont
  };

  drawRadial(radialSeasons, data[3], seasonParams);
  drawRadial(radialWinter, data[0].slice(-1).concat(data[0].slice(0, 2)), winterParams);
  drawRadial(radialSpring, data[0].slice(2, 5), springParams);
  drawRadial(radialSummer, data[0].slice(5, 8), summerParams);
  drawRadial(radialAutumn, data[0].slice(8, 11), autumnParams);

  drawRadarAnnotations(radialContainer, radialSeasons, accentColor);
}

function drawScatterPlots(vis, data, width, height, accentColor) {
  const labelFont = 'Montserrat';
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
    colors: divergingColors,
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

  drawScatterAnnotations(fullScatterContainer, zoomScatterContainer, accentColor);

}

function drawBarPlot(vis, data, width, height, accentColor) {
  const labelFont = 'Montserrat';
  const barContainer = makeContainer(vis, 0.45 * width, 0.25 * height, 0.45 * width, 0.74 * height, false);
  drawBar(barContainer, data[2], 'Airline', 'Proportion of Delayed Flights', labelFont, accentColor);
  drawBarAnnotations(barContainer, accentColor);
}

function myVis(data) {
  // The posters will all be 24 inches by 36 inches
  // Your graphic can either be portrait or landscape, up to you
  // the important thing is to make sure the aspect ratio is correct.
  const width = 5000;
  const height = 36 / 24 * width;
  const accentColor = '#469E00';

  const backgroundColor = '#f7f7f7';

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
    .attr('font-family', 'Montserrat')
    .attr('font-weight', 'bold')
    .attr('font-size', '150px')
    .attr('text-anchor', 'middle')
    .text('AVOIDING FLIGHT DELAYS');

  const subtitle = makeContainer(vis, width * 0.5, height * 0.0455, width * 0.265, height * 0.045, false);

  const subNote = {
    label: [
      'Of the 5,819,079 domestic (US) flights in 2015, 2,125,618 were delayed. We ',
      'examined the effect of departure time, departure airport, and flight carrier on the number of ',
      'departure delays in 2015.'
    ].join(''),
    title: '',
    x: 0.5,
    y: 0
  };

  titleAnnotation(subtitle, subNote, 0, 0, 75, 0.98 * subtitle.attr('width'));

  subtitle.append('rect')
    .attr('height', subtitle.attr('height'))
    .attr('width', 15)
    .attr('fill', accentColor);

  drawRadarPlots(vis, data, width, height, accentColor);
  drawScatterPlots(vis, data, width, height, accentColor);
  drawBarPlot(vis, data, width, height, accentColor);

  vis.append('text')
    .attr('x', 0.015 * width)
    .attr('y', 0.995 * height)
    .attr('font-family', 'Montserrat')
    .attr('font-size', '30px')
    .text('Created by Larry Chen, Emily Xue, and Arthur Tseng');
}
