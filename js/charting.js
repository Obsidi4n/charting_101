Chart.defaults.global.responsive = true;
var chart, chartType;
var canvas = document.getElementById("chart");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var ctx = canvas.getContext("2d");

function reorderOhlc(values)
{
	var high = Math.max.apply(null, values);
	values.splice(values.indexOf(high),1);
	var low = Math.min.apply(null, values);
	values.splice(values.indexOf(low),1);

	var ohlc = [];
	ohlc.push(values.pop());
	ohlc.push(high);
	ohlc.push(low);
	ohlc.push(values.pop());

	return ohlc;
}
function randomNumberJesus()
{
	var xcoords = [];
	var ycoords = [];

	var count = 100;
	for(var i=0;i<count;i++)
	{
		xcoords.push(i);
		var values = [];
		for(var j=0;j<4;j++)
			values.push(  Math.random() * 1000 );
		values = reorderOhlc(values);
		ycoords.push(values);
	}
	return {"x":xcoords,"y":ycoords}
}
function getData(ohlc)
{
	var randomResults = randomNumberJesus();
	var data;
	if (typeof(ohlc)==='undefined')
	{
		data = {
		labels: randomResults["x"],
		datasets: [
			{
				label: "Samle data",
				fillColor: "rgba(220,220,220,0.7)",
				strokeColor: "rgba(220,220,220,0.8)",
				highlightFill: "rgba(220,220,220,0.75)",
				highlightStroke: "rgba(220,220,220,1)",
				data: randomResults["y"] //[65, 59, 80, 81, 56, 55, 40]
			}
		]
		};
	}
	else
		data = randomResults;
	return data;
}

function drawChart(el)
{
	chartType = el.currentTarget.id;
	if(chart)
	{
		chart.destroy();
    	delete chart;
    	ctx.clearRect(0,0,canvas.width,canvas.height);
	}

	if (chartType === "line")
		chart = new Chart(ctx).Line(getData(), {
			bezierCurve: false
			});
	else if (chartType === "bar")
	chart = new Chart(ctx).Bar(getData(), {
	    barShowStroke: false
		});
	else if (chartType === "candlestick")
		draw(getData(true));
		//ctx.fillText("Still working on this", canvas.width/2, canvas.height/2);
}
	// var options = {
	// 	caleShowGridLines : true,
	//     scaleGridLineColor : "rgba(0,0,0,.05)",
	//     scaleGridLineWidth : 1,
	//     scaleShowHorizontalLines: true,
	//     scaleShowVerticalLines: false,
	//     bezierCurve : false,
	//     bezierCurveTension : 0,
	//     pointDot : true,
	//     pointDotRadius : 1,
	//     pointDotStrokeWidth : 1,
	//     pointHitDetectionRadius : 20,
	//     datasetStroke : true,
	//     datasetStrokeWidth : 2,
	//     datasetFill : true,
	// }
function redraw(e)
{
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	if(chartType)
		document.getElementById(chartType).click();
}

function setup(){
	console.log("setting up");
	var buttons = document.getElementsByClassName("button");
	for (var i=0;i<buttons.length;i++)
		buttons[i].addEventListener("click",drawChart);
	window.addEventListener("resize",redraw);
	buttons[2].click();
	console.log("setup complete");
}
setup();

function draw(data)
{
	var xLabelSeparation = 30;
	var axesPadding = 30;
	var smallPadding = 10;
	var overflow = 5;

	ctx.lineWidth = 2;
	ctx.lineCap = 'round';
	ctx.strokeStyle = '#000';
	
	ctx.beginPath();
	ctx.moveTo(axesPadding, smallPadding);
	ctx.lineTo(axesPadding, canvas.height-axesPadding+overflow);
	ctx.stroke();

	ctx.moveTo(axesPadding-overflow, canvas.height-axesPadding);
	ctx.lineTo(canvas.width-smallPadding, canvas.height - axesPadding);
	ctx.stroke();

	count = (((((canvas.width-axesPadding-smallPadding)/xLabelSeparation)+ 0.5) << 1) >> 1);
	console.log(canvas.width-axesPadding-smallPadding);
	console.log(count);

	ctx.closePath();

	ctx.lineWidth = 1;
	// ctx.strokeStyle = '#555';
	// ctx.beginPath();
	for (var i=0;i<count;i++)
	{
		xcoord = axesPadding+i*xLabelSeparation;
		var p = {};
		p["x"] = xcoord;
		p["y"] = data["y"][i];
		if(i>0)
		{
			// ctx.moveTo(xcoord, smallPadding);
			// ctx.lineTo(xcoord, canvas.height-axesPadding);
			// ctx.stroke();
			drawCandle(p);
		}
		ctx.fillText(data["x"][i], xcoord-3, canvas.height-axesPadding/2);
	}
}
function drawCandle(point)
{
	var width = 10;
	ctx.fillStyle = "#6699FF";
	ctx.strokeStyle = "#333";

	var x = point["x"];
	var open  = point["y"][0];
	var high  = point["y"][1];
	var low   = point["y"][2];
	var close = point["y"][3];
	
	ctx.beginPath();
	ctx.moveTo(x,low);
	ctx.lineTo(x,high);
	ctx.stroke();
	ctx.fillRect(x-width/2, open, width, close-open);
}