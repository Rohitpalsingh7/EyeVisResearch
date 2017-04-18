//Initialize Foundation
$( document ).foundation();
// Polyfill for IE include
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        // NOTE: === provides the correct "SameValueZero" comparison needed here.
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}
var margin = {top: 20, right: 20, bottom: 30, left: 20},
	width = 649 - margin.left - margin.right,
	height = 475 - margin.top - margin.bottom;

var initial, prev, done = 0;
var seek = 0;
var svg = d3.select(".stage").append("svg")
			.attr("width", width)
			.attr("height", height)
      .attr("class","vis-item float-center");
var time = 0;

var x = d3.scaleLinear()
    .rangeRound([0,width]);

var y = d3.scaleLinear()
    .rangeRound([0,height]);

var g = d3.scaleLinear()
      .domain([0,1000])
      .rangeRound([9,20]);

var gazeline = d3.line()
      .defined(function(d) { return d; })
      .x(function(d) {  return +d.X;})
      .y(function(d) {  return +d.Y; });
var repeat = [];
var mySlider = new Foundation.Slider($("#playback"));
var speed=10;
var gazeClicked = 0;
var heatClicked = 0;
var tile = 50; // global var for heatmap size, ie 10x10
var totalData; // global var for total amount of data points
var data;
var xpoint, ypoint;

//image is 609x425
var margin = {top: 20, right: 20, bottom: 30, left: 20},
  width = 649 - margin.left - margin.right,
  height = 475 - margin.top - margin.bottom;

//Determine pixel range of image
var heatx = d3.scaleLinear().rangeRound([0, width]),
  heaty = d3.scaleLinear().rangeRound([0, height]),
  heatz = d3.scaleLinear().range([0, 1]);


//Document Ready
$( document ).ready(function(){
  drawStage();
  $('#playback').on('moved.zf.slider',function(){
    var slideVal = $(this).children('.slider-handle').attr('aria-valuenow');
    drawVision(slideVal,0);
  })
});

$('#playback-hand').on("click",function(){
  time = parseInt($('#playback').children('.slider-handle').attr('aria-valuenow'));
})
$('#playback').on("click",function(){
  time = parseInt($('#playback').children('.slider-handle').attr('aria-valuenow'));
})

$('#playback-hand').mouseenter(function(){
  for (var i = 1; i < 99999; i++){
    window.clearInterval(i);
  }
  $('#pauseMe').css("display","none");
  $('#play').css("display","block");
})


$("#showGaze").on("click",function(event) {
  if (gazeClicked == 0){
    drawGaze();
    gazeClicked=1
  }
  if ($("#showGaze").is(":checked")){
    showGaze();
  }else{
    hideGaze();
  }

});

$("#showHeat").on("click",function(event) {
  if (heatClicked == 0){
    drawHeat();
    heatClicked=1
  }
  if ($("#showHeat").is(":checked")){
    showHeat();
  }else{
    hideHeat();
  }

});
$("#play").on("click",function(event) {
  event.preventDefault();

  $(this).css("display","none");
  $('#pauseMe').css("display","block");


  var autoPlay = setInterval(function(){
    mySlider._setHandlePos($("#playback-hand"),time);
    if(time <= ($("#playback").data("end"))){
      time = time+10;
    }else{
      time=0;
      mySlider._setHandlePos($("#playback-hand"),0);
      window.clearInterval(autoPlay);
      for (var i = 1; i < 99999; i++){
        window.clearInterval(i);
      }
      $('#play').css("display","block");
      $('#pauseMe').css("display","none");
    }
  },speed)
});

$("#pauseMe").on("click",function(event) {
  event.preventDefault();
  $(this).css("display","none");
  $('#play').css("display","block");
  for (var i = 1; i < 99999; i++){
    window.clearInterval(i);
  }
});

function drawStage(){
  svg.append("defs")
    .append("pattern")
    .attr("id", "bg")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width",width)
    .attr("height", height)
    .append("image")
    .attr("xlink:href","resources/img/bestbuyads.png")
    .attr("width", width)
    .attr("height", height);
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#bg)");
}
function drawVision(seek,done,speed){
	d3.csv("resources/data/modified_data.csv", function(error, data){
		data = data.filter(function(d){
				if ((d.GazeX == 0 && d.GazeY == 0) ) {
					return false;
				}
				if (d.GazePointIndex == 1) { // Looking for first recording timestamp
					initial = +d.RecordingTimestamp;
				}

				if( ((d.RecordingTimestamp - initial) > seek) && !done){
					d.RecordingTimestamp = +d.RecordingTimestamp - initial;
					d.GazeX = +d.GazePointX;
					d.GazeY = +d.GazePointY;
					d.GazePointIndex = +d.GazePointIndex;
					done = 1;
				return true;
				}

				return false;
			});

		var ourG = svg.selectAll(".dot")
			.data(data);

    ourG.enter()
      .append("circle")
  			.attr("class","dot")
  			.attr("fill-opacity" , .8)
        .attr("fill","red")
        .attr("r",10)
      .merge(ourG)
  			.attr("cx",function(d) { return d.GazeX; })
  			.attr("cy", function(d) { return d.GazeY; })
      .transition()
        .duration((speed*2))
        .attr("cx",function(d) { return d.GazeX; })
        .attr("cy", function(d) { return d.GazeY; });
    ourG.exit().transition()
      .remove();
	});
};

function drawGaze(){
  d3.csv("resources/data/modified_data.csv", function(error, data){
    data2 = data.filter(function(d){
        if ((d.FixationPointX == 0 && d.FixationPointY == 0) || repeat.includes(d.FixationPointX)) {
          return false;
        }

        repeat.push(d.FixationPointX);
        d.X = +d.FixationPointX;
        d.Y = +d.FixationPointY;
        d.dur = +d.GazeEventDuration;
        d.index = +d.FixationIndex;

        return true;
      });

    svg.append("path")
      .datum(data2)
      .attr("fill","none")
      .attr("class",'saccade')
      .attr("stroke", "steelblue")
      .attr("stroke-width" , 2)
      .attr("d", gazeline);


    var ourG2 = svg.selectAll(".gazedot")
      .data(data2)
      .enter().append("g")
      .attr("class" , "gazefixation");

    ourG2.append("circle")
      .attr("class","gazedot")
      .attr("fill-opacity" , 0.5)
      .attr("r",function(d) { return g(d.dur);})
      .attr("cx",function(d) { return d.X; })
      .attr("cy", function(d) { return d.Y; });


    ourG2.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline" , "central")
      .attr("fill" , "white")
      .attr("stroke", "white")
      .attr("class","gazelabel")
      .attr("font-size", "12px")
      .attr("font-family", "system-ui")
      .attr("dx", function(d){ return d.X; })
      .attr("dy", function(d){ return d.Y;})
      .text(function(d) { return d.index; });
  });
}
function hideGaze(){
  svg.selectAll(".gazedot").transition().attr("opacity",0);
  svg.selectAll(".gazelabel").attr("font-size",0);
  svg.selectAll(".saccade").transition().attr("stroke-width",0);
}
function showGaze(){
  svg.selectAll(".gazedot").transition().attr("opacity",1);
  svg.selectAll(".gazelabel").attr("font-size",12);
  svg.selectAll(".saccade").transition().attr("stroke-width",2);
}
function drawHeat(){

  //make a tileXtile array for heatmap
  var heatmapArray = new Array(tile);
  // create array of arrays, and zero the values
  for (var i=0; i<tile; i++) {
  		heatmapArray[i] = new Array(tile);
  		for (var j=0; j<tile; j++){
  				heatmapArray[i][j] = 0; //zero
  		}
  }
  d3.csv("resources/data/modified_data.csv", function(error, data) {
  				if (error) throw error;

  				data.forEach(function(d) {
  								d.GazePointX = +d.GazePointX;
  								d.GazePointY = +d.GazePointY;
  								});

  				//in the tile by tile, which box should we increase.
  				//increases shows the viewer put there eyes in that area more
  				//tetermines color
  				data.forEach(function(d) {
  								xpoint = Math.floor((d.GazePointX)*tile/609);
  								ypoint = Math.floor((d.GazePointY)*tile/425);
  								if (d.GazePointX!=0 && d.GazePointY!=0){
  								heatmapArray[xpoint][ypoint] = heatmapArray[xpoint][ypoint] + 1;
  								}
  								});

  				//find max value.
  				var maxVal = 0;
  				var temp;
  				for (var i=0; i<tile; i++){
  						temp = Math.max.apply(null, heatmapArray[i]);
  						if (temp > maxVal){
  								maxVal = temp;
  						}
  				}

  				// scale domains
  				heatx.domain([0, tile]);
  				heaty.domain([0, tile]);
  				heatz.domain([0, maxVal]);

  				var t = 0;
  				var u = 0;

  				svg.selectAll("heatColumn")
  					.data(heatmapArray)
  					.enter().append("g").attr("class","heatColumn").selectAll("rect")
  						.data(function (d, i) {return d;})
  					.enter().append("rect")
  						.attr("class", "tile")
  						.attr("y", function(d,i){ return heaty(i) ;})
  						.attr("x", function(d,i){
  							if (i == 0 && u==1){
  								t++;
  								u = 0;
  							}
  							if (i == 9){
  								u = 1;
  							}
  							return heatx(t);
  						})
  					.attr("width", Math.round(width/tile))
  						.attr("height", Math.round(height/tile))
  						.attr("fill", "red")
  						.attr("opacity", function(d,i){ return heatz(d) ;});
            });
};
function hideHeat(){
  svg.selectAll(".tile").transition().attr("fill","none");
}
function showHeat(){
  svg.selectAll(".tile").transition().attr("fill","red");
}
