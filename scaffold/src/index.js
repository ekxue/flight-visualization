// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)

// import from: https://github.com/d3/d3/blob/master/API.md
import {select, selectAll} from 'd3-selection';
import {scaleBand, scaleLinear, bandwidth, scaleLog} from 'd3-scale';
import {max} from 'd3-array';
import {axisBottom, axisLeft, axisTop} from 'd3-axis';
import {format} from 'd3-format';
import {line} from 'd3-shape';
import {interpolateRdBu, schemeRdBu} from 'd3-scale-chromatic';

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

  data = data.slice(0, 50);

  const maxPow = Math.ceil(Math.log10(Math.max(...data.map(d => d[xVar]))));
  const minPow = Math.floor(Math.log10(Math.min(...data.map(d => d[xVar]))));

  const xtickData = [... new Array(maxPow - minPow + 1)].map((d, i) => Math.pow(10, minPow + i));
  // console.log(xtickData);

  const xScale = scaleLog()
    .domain([Math.pow(10, minPow), Math.pow(10, maxPow)])
    .range([margin, width - margin]);


  const yScale = scaleLinear()
    // .domain([Math.min(...data.map(d => d[yVar])), Math.max(...data.map(d => d[yVar]))])
    .domain([0, Math.max(...data.map(d => d[yVar]))])
    .range([height - margin, margin]);

  // Array of median lengths of flights

  const length = data.map(d => d.median);
  const incr = Math.max(...length) - Math.min(...length);
  console.log(incr);

  // Scale for dot color

  const colorScale = scaleLinear()
      .domain([Math.min(...length), Math.max(...length)])
      .range([1,0]);

  // const vis = select('.vis-container')
  //   .attr('width', width)
  //   .attr('height', height);

  const vis = container;

  const graphContainer = vis.append('g');

  graphContainer.append('g')
    .attr('transform', `translate(0, ${height - margin})`)
    .call(axisBottom(xScale)
      .ticks(3, format(",.2r"))
      .tickValues(xtickData));
      // tickValues());
      // .ticks(2)
      // .tickValues([1, 2]));

  graphContainer.append('g')
    .attr('transform', `translate(${margin}, 0)`)
    .call(axisLeft(yScale));

  graphContainer.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', margin / 2)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Arial')
    .text(yLabel);

  graphContainer.append('text')
    .attr('x', width / 2)
    .attr('y', height - margin / 4)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Arial')
    .text(xLabel);

  graphContainer.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 2)
    .attr('cx', d => xScale(d[xVar]))
    .attr('cy', d => yScale(d[yVar]))
    .style('fill', d => interpolateRdBu(colorScale(d.median)))
    .attr('stroke', 'black');

  if (text) {
    graphContainer.selectAll('.text')
    .data(data)
    .enter().append('text')
    .attr('x', d => xScale(d[xVar])+ width / 200)
    .attr('y', d => yScale(d[yVar]) + width / 300)
    .attr('text-anchor', 'start')
    .attr('font-family', 'Arial')
    .attr('font-size', '8px')
    .text(d => d.airport);
  }

  const legendColors = schemeRdBu[10];
  const tenStops = [1,2,3,4,5,6,7,8,9,10];
  const tickVals = tenStops.map((d, i) => Math.min(...length) + i * incr);
  console.log(tickVals);

  const legendContainer = graphContainer.append('g')
    .attr('width', width / 5)
    .attr('height', height / 5)
    .attr('transform', `translate(0,${height - margin * 2.5})`);

  const legWidth = legendContainer.attr('width');
  const legHeight = legendContainer.attr('height');

  const legs = legendContainer.selectAll('.rect')
    .data(tenStops)
    .enter().append("rect")
      .attr('x', d =>  3 * width / 5 + d * 9 * legWidth / 100)
      .attr('y', legHeight)
      .attr('width', legWidth / 10)
      .attr('height', legHeight / 20)
      .attr('fill', d => legendColors[10 - d]);

  legendContainer.selectAll('.line')
    .data(tenStops)
    .enter().append("line")
      .attr('x1', d =>  3 * width / 5 + (d + 1) * 9 * legWidth / 100)
      .attr('y1', legHeight / 10)
      .attr('x2', d =>  3 * width / 5 + (d + 1) * 9 * legWidth / 100)
      .attr('y2', legHeight / 20)
      .attr('transform',`translate(0, ${legendContainer.attr('height') - legHeight / 20})`)
      .attr('stroke', 'black');

  legendContainer.selectAll('.text')
    .data(tenStops)
    .enter().append("text")
      .attr('x', d =>  3 * width / 5 + (d + 1) * 9 * legWidth / 100)
      .attr('y', legHeight / 2)
      .attr('transform', `translate(0, ${legWidth / 3})`)
      .text(d => tickVals[d - 1])
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial')
      .attr('font-size', '5px')
      .attr('fill', 'black');

  legendContainer.append('text')
    .attr('x', 3 * width / 5 + 6 * 9 * legWidth / 100)
    .attr('y', legHeight / 2)
    .attr('transform', `translate(0, ${legWidth / 4})`)
    .text('Length of Delay (mins)')
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Arial')
    .attr('font-size', '8px')
    .attr('fill', 'black');

}

function radialPlot(container, data) {

  const height = container.attr('height');
  const width = container.attr('width');
  const m = height / 20;

  const margin = {left: m, right: m, top: m, bottom: m};
  const plotHeight = height - margin.left - margin.right;
  const plotWidth = width - margin.top - margin.bottom;

  const g = container;
  // COLORS
  function c10(n) {
    const c10 = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    return c10[n % c10.length];
  };

  // for the scale on the percent radar graph to have nice numbers:
  function round10(x)
  {
      return (Math.ceil(x/10));
  }

  // for the scale on the avg radar graph to have nice numbers:

  function roundAvg(x)
  {
      return (Math.ceil(x/10)) * 10;
  }


    // const e = data.map(d => d.percent.map((p,i) => ({axis:`${i}`,value:p})));
  const e = data.map(d => (d.percent.map((p,i) => ({axis:`${i + 1}`,value:p}))).reverse());

  // CIRCULAR SEGMENTS
  const percentRadarChart = {
    draw: function(id, d, options){
    const cfg = {
     radius: 5,
     w: 600,
     h: 600,
     factor: 1,
     factorLegend: .85,
     levels: 3,
     maxValue: 0,
     radians: 2 * Math.PI,
     opacityArea: 0.5,
     ToRight: 5,
     TranslateX: 80,
     TranslateY: 30,
     ExtraWidthX: 100,
     ExtraWidthY: 100,
     color: c10()
    };
    
    if('undefined' !== typeof options){
      for(const i in options){
      if('undefined' !== typeof options[i]){
        cfg[i] = options[i];
      }
      }
    }
    cfg.maxValue = round10(Math.max(cfg.maxValue, max(d, function(i){return max(i.map(function(o){return o.value;}))})));
    console.log(cfg.maxValue);

    const allAxis = (d[0].map(function(i, j){return i.axis}));
    const total = allAxis.length;
    const radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
    const Format = format('%');
    select(id).select("svg").remove();
    
    // const g = select(id)
    //     .append("svg")
    //     .attr("width", cfg.w+cfg.ExtraWidthX)
    //     .attr("height", cfg.h+cfg.ExtraWidthY)
    //     .append("g")
    //     .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
    
    //Circular segments
    for(var j=0; j<cfg.levels-1; j++){
      const levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
      g.selectAll(".levels")
       .data(allAxis)
       .enter()
       .append("svg:line")
       .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
       .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
       .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
       .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
       .attr("class", "line")
       .style("stroke", "grey")
       .style("stroke-opacity", "0.75")
       .style("stroke-width", "0.3px")
       .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
    }

    //Text indicating at what % each level is

    for(var j=0; j<cfg.levels; j++){
      const levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
      g.selectAll(".levels")
       .data([1]) //dummy data
       .enter()
       .append("svg:text")
       .attr("x", function(d){return levelFactor*(1-cfg.factor*Math.sin(0));})
       .attr("y", function(d){return levelFactor*(1-cfg.factor*Math.cos(0));})
       .attr("class", "legend")
       .style("font-family", "sans-serif")
       .style("font-size", "10px")
       .attr("transform", "translate(" + (cfg.w/2-levelFactor + cfg.ToRight) + ", " + (cfg.h/2-levelFactor) + ")")
       .attr("fill", "#737373")
       .text(Format((j+1)*cfg.maxValue/cfg.levels));
    }
    
    let series = 0;

    const axis = g.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    axis.append("line")
      .attr("x1", cfg.w/2)
      .attr("y1", cfg.h/2)
      .attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
      .attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
      .attr("class", "line")
      .style("stroke", "grey")
      .style("stroke-width", "1px");

    axis.append("text")
      .attr("class", "legend")
      .text(d => `${d}:00`)
      .style("font-family", "sans-serif")
      .style("font-size", "11px")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .attr("transform", function(d, i){return "translate(0, -10)"})
      .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
      .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

   
    e.forEach(function(y, x){
      console.log(x);
      let dataValues = [];
      g.selectAll(".nodes")
      .data(y, function(j, i){
        dataValues.push([
        cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
        cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
        ]);
      });
      dataValues.push(dataValues[0]);
      g.selectAll(".area")
             .data([dataValues])
             .enter()
             .append("polygon")
             .attr("class", "radar-chart-serie"+series)
             .style("stroke-width", "2px")
             .style("stroke", c10((series)))
             .attr("points",function(d) {
               var str="";
               for(var pti=0;pti<d.length;pti++){
                 str=str+d[pti][0]+","+d[pti][1]+" ";
               }
               return str;
              })
             .style("fill", 'none')
      series++;
    });
    let series1 =0;

  // LEGEND 

  // Legend title

  const legTitle = g.append('text')
    .attr('class', 'title')
    .attr('x', width - width / 8)
    .attr('y', height / 100)
    .attr('font-size', '12px')
    .attr('fill', '#404040')
    .text('Month');
      
  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('height', height / 10)
    .attr('width', width / 10)
    .attr('transform', 'translate(90,20)');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December'];

  // The colors
  legend.selectAll('rect')
    .data(months)
    .enter()
    .append('rect')
    .attr('x', width - width / 4)
    .attr('y', (d, i) => i * 20)
    .attr('width', width / 65)
    .attr('height', 10)
    .style('fill', (d, i) => c10(i))
    ;

  // The labels on the legend
  legend.selectAll('text')
    .data(months)
    .enter()
    .append('text')
    .attr('x', width - width / 4 + 2 * width / 65)
    .attr('y', function(d, i){ return i * 20 + 9;})
    .attr('font-size', '11px')
    .attr('fill', '#737373')
    .text(d => d); 
  }



  };


  const w = 500,
    h = 500;

  //Legend titles
  const LegendOptions = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December'];

  //Options for the Radar chart, other than default
  const mycfg = {
    w: w,
    h: h,
    maxValue: 0.6,
    levels: 10,
    ExtraWidthX: 500
  }

  //Call function to draw the Radar chart
  //Will expect that data is in %'s
  percentRadarChart.draw('body', e, mycfg);

  // AVERAGES CHART

  // AVERAGES CHART

  // AVERAGES CHART

  // AVERAGES CHART

  // The averages

  const a = data.map(d => (d.average.map((p,i) => ({axis:`${i + 1}`,value:p}))).reverse());

  // The total number of flights 

  const totals = data.map(d => (d.total.map((p,i) => ({axis:`${i + 1}`,value:p}))).reverse());

  //makes an array of the values (ex. totals, averages, percentages)

  function vals(data){
    return data.map(d => d.value);
  }

  // Scale for playing with opacity of the radar graph lines

  function totalScale(totals){
    return scaleLinear()
      .domain([Math.min(vals(totals)), Math.max(vals(totals))])
      .range([0,1]);
  }

  const avgRadarChart = {
    draw: function(id, d, options){
    const cfg = {
     radius: 5,
     w: 600,
     h: 600,
     factor: 1,
     factorLegend: .85,
     levels: 10,
     maxValue: 0,
     radians: 2 * Math.PI,
     opacityArea: 0.5,
     ToRight: 5,
     TranslateX: 80,
     TranslateY: 30,
     ExtraWidthX: 100,
     ExtraWidthY: 100,
     color: c10()
    };
    
    if('undefined' !== typeof options){
      for(const i in options){
        if('undefined' !== typeof options[i]){
          cfg[i] = options[i];
        }
      }
    }
    cfg.maxValue = roundAvg(Math.max(cfg.maxValue, max(d, function(i){return max(i.map(function(o){return o.value;}))})));
    const allAxis = (d[0].map(function(i, j){return i.axis}));
    const total = allAxis.length;
    const radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
    const Format = format('%');
    select(id).select("svg").remove();
    
    const g1 = select(id)
        .append("svg")
        .attr("width", cfg.w+cfg.w +cfg.ExtraWidthX)
        .attr("height", cfg.h+cfg.w +cfg.ExtraWidthY)
        .append("g")
        .attr('transform', `translate(${cfg.w + cfg.w +cfg.TranslateX},${cfg. h + cfg.h + cfg.TranslateY })`);
    
    //Circular segments
    for(var j=0; j<cfg.levels-1; j++){
      const levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
      g1.selectAll(".levels")
       .data(allAxis)
       .enter()
       .append("svg:line")
       .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
       .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
       .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
       .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
       .attr("class", "line")
       .style("stroke", "grey")
       .style("stroke-opacity", "0.75")
       .style("stroke-width", "0.3px")
       .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
    }

    //Text indicating at what % each level is

    for(var j=0; j<cfg.levels; j++){
      const levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
      g1.selectAll(".levels")
       .data([1]) //dummy data
       .enter()
       .append("svg:text")
       .attr("x", function(d){return levelFactor*(1-cfg.factor*Math.sin(0));})
       .attr("y", function(d){return levelFactor*(1-cfg.factor*Math.cos(0));})
       .attr("class", "legend")
       .style("font-family", "sans-serif")
       .style("font-size", "10px")
       .attr("transform", "translate(" + (cfg.w/2-levelFactor + cfg.ToRight) + ", " + (cfg.h/2-levelFactor) + ")")
       .attr("fill", "#737373")
       .text((j+1)*cfg.maxValue/cfg.levels);
    }
    
    let series = 0;

    const axis = g1.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    axis.append("line")
      .attr("x1", cfg.w/2)
      .attr("y1", cfg.h/2)
      .attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
      .attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
      .attr("class", "line")
      .style("stroke", "grey")
      .style("stroke-width", "1px");

    axis.append("text")
      .attr("class", "legend")
      .text(d => `${d%24}:00`)
      .style("font-family", "sans-serif")
      .style("font-size", "11px")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .attr("transform", function(d, i){return "translate(0, -10)"})
      .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
      .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

   
    a.forEach(function(y, x){
      console.log(y);
      let dataValues = [];
      g1.selectAll(".nodes")
      .data(y, function(j, i){
        dataValues.push([
        cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
        cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
        ]);
      });
      dataValues.push(dataValues[0]);
      g1.selectAll(".area")
             .data([dataValues])
             .enter()
             .append("polygon")
             .attr("class", "radar-chart-serie"+series)
             .style("stroke-width", "2px")
             .style("stroke", c10((series)))
             .style("stroke-opacity", d => d.value/100)
             .attr("points",function(d) {
               var str="";
               for(var pti=0;pti<d.length;pti++){
                 str=str+d[pti][0]+","+d[pti][1]+" ";
               }
               return str;
              })
             .style("fill", 'none')
      series++;
    });
    let series1 =0;

  // LEGEND 

  // Legend title

  const legTitle = g1.append('text')
    .attr('class', 'title')
    .attr('x', width - width / 8)
    .attr('y', height / 100)
    .attr('font-size', '12px')
    .attr('fill', '#404040')
    .text('Month');
      
  const legend = g1.append('g')
    .attr('class', 'legend')
    .attr('height', height / 10)
    .attr('width', width / 10)
    .attr('transform', 'translate(90,20)');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December'];

  // The colors
  legend.selectAll('rect')
    .data(months)
    .enter()
    .append('rect')
    .attr('x', width - width / 4)
    .attr('y', (d, i) => i * 20)
    .attr('width', width / 65)
    .attr('height', 10)
    .style('fill', (d, i) => c10(i))
    ;

  // The labels on the legend
  legend.selectAll('text')
    .data(months)
    .enter()
    .append('text')
    .attr('x', width - width / 4 + 2 * width / 65)
    .attr('y', function(d, i){ return i * 20 + 9;})
    .attr('font-size', '11px')
    .attr('fill', '#737373')
    .text(d => d); 
  }

  };

  //Options for the Radar chart, other than default
  const avgCfg = {
    w: w,
    h: h,
    maxValue: 0.6,
    levels: 7,
    ExtraWidthX: 600,
    ExtraWidthY: 500,
  }

  avgRadarChart.draw('body', a, avgCfg);
}

function drawRectangle(container, data) {
  const height = container.attr('height');
  const width = container.attr('width');
  const m = height / 20;


  container.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', '#ff9900')
    .attr('width', width)
    .attr('height', height);
}


function drawRadial(container, data) {
  const height = container.attr('height');
  const width = container.attr('width');
  const m = height / 20;

  const numLevels = 8;
  const numHours = 24;
  const radius = 0.8 * width / 2;

  const hours = [...new Array(numHours)].map((d, i) => i);
  const levels = [...new Array(numLevels)].map((d, i) => i);

  const axisScale = scaleLinear()
    .domain([0, numLevels])
    .range([radius / numLevels, radius]);

  const formatPercent = format('.0%');

  const maxPercent = Math.ceil(10 * Math.max(...data.map((d => Math.max(...d.percent))))) / 10;

  const percentScale = scaleLinear()
    .domain([0, maxPercent])
    .range([0, radius]);

  const axisData = [...new Array(numHours * numLevels)].map((x, i) => ({
     hour: i % numHours,
     level: Math.floor(i / numHours),
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
    .attr('transform', `translate(${width / 2}, ${width / 2})`);

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
    .attr('transform', `translate(${width / 2}, ${width / 2})`);

  container.selectAll('.axis-text')
    .data(levels)
    .enter().append('text')
    .style('font-family', 'sans-serif')
    .style('font-size', '11px')
    .attr('class', 'axis-text')
    .attr('x', 0)
    .attr('y', l => -axisScale(l))
    .attr('transform', `translate(${width / 2}, ${width / 2})`)
    .text(l => formatPercent((l + 1)/ numLevels * maxPercent));

  container.selectAll('.hours-text')
    .data(hours)
    .enter().append('text')
    .style('font-family', 'sans-serif')
    .style('font-size', '11px')
    .attr('class', 'hours-text')
    .attr('transform', `translate(${width / 2}, ${width / 2})`)
    .attr('x', h => axisScale(numLevels) * (-Math.sin(-h * 2 * Math.PI / numHours)))
    .attr('y', h => axisScale(numLevels) * (-Math.cos(-h * 2 * Math.PI / numHours)))
    .attr('text-anchor', 'middle')
    .text(h => `${h}:00`)

  const lineFunction = line()
    .x((d, i) => percentScale(d) * (-Math.sin(-i * 2 * Math.PI / numHours)))
    .y((d, i) => percentScale(d) * (-Math.cos(-i * 2 * Math.PI / numHours)));
    // .curve('linear');

  container.selectAll('.graph')
    .data(data)
    .enter().append('path')
    .attr('d', d => {
      d.percent.push(d.percent[0])
      return lineFunction(d.percent);
    })
    .attr('fill', 'none')
    .attr('stroke', 'blue')
    .attr('stroke-width', '2px')
    .attr('transform', `translate(${width / 2}, ${width / 2})`);

}


function myVis(data) {
  // The posters will all be 24 inches by 36 inches
  // Your graphic can either be portrait or landscape, up to you
  // the important thing is to make sure the aspect ratio is correct.

  const width = 1000; // was 5000, changed to 500 for viewing in browser
  const height = 36 / 24 * width;
  const margin = 70;

  const vis = select('.vis-container')
    .attr('width', width)
    .attr('height', height);

  const airportAverageContainer = vis.append('g')
    .attr('width', width/2)
    .attr('height', height/4)
    .attr('transform', `translate(0, ${height/2})`);

  const radialContainer = vis.append('g')
    .attr('width', width / 2)
    .attr('height', width / 2)
    .attr('transform', `translate(${width / 2}, 0)`);


  drawRadial(radialContainer, data[0]);

  scatterPlot(airportAverageContainer, data[1], 'total', 'percent', 'Total Outbound Flights', 'Proportion of Delayed Flights', true);
  // scatterPlot(data.slice(0,150), 'total', 'percent', 'Total Outbound Flights', 'Proportion of Delayed Flights', true);
  
  // scatterPlot(data, 'total', 'average', 'Total Outbound Flights', 'Average Delay Time (min)', false);
  // scatterPlot(data.slice(0,150), 'total', 'average', 'Total Outbound Flights', 'Average Delay Time (min)', true);
  
  // scatterPlot(data, 'total', 'median', 'Total Outbound Flights', 'Median Delay Time (min)', false);
  // scatterPlot(data.slice(0,150), 'total', 'median', 'Total Outbound Flights', 'Median Delay Time (min)', true);
  

}
