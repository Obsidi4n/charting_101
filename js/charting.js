Chart.defaults.global.responsive = true;
var chart, chartType;
var canvas = document.getElementById("chart");
var ctx = canvas.getContext("2d");
var globalHigh, globalLow;

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

function setGlobals(values)
{
	if(globalHigh<values[1])
		globalHigh=values[1];
	if(!globalLow)
		globalLow=values[2];
	else if(globalLow>values[2])
		globalLow=values[2];
}

function randomNumberJesus()
{
	var count = 50;
	var data = {};
	for(var i=0;i<count;i++)
	{
		var values = [];
		for(var j=0;j<4;j++)
			values.push(  Math.random() * 1000 );
		values = reorderOhlc(values);
		setGlobals(values);
		data[i] = values;
	}
	return data;
}

function getData(ohlc)
{
	globalHigh=0;
	globalLow=undefined;

	var randomResults = randomNumberJesus();
	var data;
	if (typeof(ohlc)==='undefined')
	{
		closePoints = [];
		for(var  key in randomResults)
			closePoints.push(randomResults[key][3])
		data = {
		labels: Object.keys(randomResults),
		datasets: [
			{
				label: "Sample data",
				fillColor: "rgba(220,220,220,0.7)",
				strokeColor: "rgba(220,220,220,0.8)",
				highlightFill: "rgba(220,220,220,0.75)",
				highlightStroke: "rgba(220,220,220,1)",
				data: closePoints //[65, 59, 80, 81, 56, 55, 40]
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
		if(typeof(chart) === 'object')
			chart.destroy();
		chart = undefined;
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
	{
		draw(getData(true));
		chart = true;
	}
}

function redraw(e)
{
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	if(chartType)
		document.getElementById(chartType).click();
}

function draw(data)
{
	var xLabelSeparation = 30;
	var axesPadding = 30;
	var smallPadding = 10;
	var offset = 3
	var overflow = 5;
    
    globalHigh = Math.ceil(globalHigh/100)*100;
    globalLow = Math.floor(globalLow/100)*100;

    var neededPixels=globalHigh-globalLow;
    var availablePixels = canvas.height-axesPadding-smallPadding;
    var yfactor=neededPixels/availablePixels;

	ctx.lineWidth = 2;
	ctx.lineCap = 'round';
	ctx.strokeStyle = '#000';
	
	ctx.beginPath();
	ctx.moveTo(axesPadding, smallPadding);
	ctx.lineTo(axesPadding, canvas.height-axesPadding+overflow);
	ctx.stroke();

	//TODO Draw yLabels here
	ctx.textAlign='right';
	ctx.fillText(globalHigh, axesPadding-2, smallPadding+offset);

	ctx.fillText(globalLow, axesPadding-overflow-2, canvas.height-axesPadding+offset);

	ctx.moveTo(axesPadding-overflow, canvas.height-axesPadding);
	ctx.lineTo(canvas.width-smallPadding, canvas.height - axesPadding);
	ctx.stroke();

	ctx.closePath();

	count = (((((canvas.width-axesPadding-smallPadding)/xLabelSeparation)+ 0.5) << 1) >> 1);
	
	ctx.lineWidth = 1;
	ctx.textAlign="center";
	// ctx.strokeStyle = '#555';
	// ctx.beginPath();
	keys = Object.keys(data);
	for (var i=0;i<count;i++)
	{
		xcoord = axesPadding+i*xLabelSeparation;
		key = keys[i];
		var p = {};
		p["x"] = xcoord;
		for(var j=0; j<4 ; j++)
			data[key][j]=canvas.height-axesPadding-(data[key][j]/yfactor);
		p["y"] = data[key];
		if(i>0)
		{
			// ctx.moveTo(xcoord, smallPadding);
			// ctx.lineTo(xcoord, canvas.height-axesPadding);
			// ctx.stroke();
			drawCandle(p);
		}
		ctx.fillText(key, xcoord, canvas.height-axesPadding/2);
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
	ctx.moveTo(x,high);
	ctx.lineTo(x,low);
	ctx.stroke();
	ctx.fillRect(x-width/2, open, width, close-open);
}

function setup(){
	console.log("setting up");

	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	var buttons = document.getElementsByClassName("button");
	for (var i=0;i<buttons.length;i++)
		buttons[i].addEventListener("click",drawChart);
	window.addEventListener("resize",redraw);
	buttons[2].click();

	console.log("setup complete");
}
setup();