Chart.defaults.global.responsive = true;
var chart, chartType;
var canvas = document.getElementById("chart");
var ctx = canvas.getContext("2d");
var globalHigh, globalLow;
var scale = 2;

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
	var open = Math.random() * 1000;
	for(var i=0;i<count;i++)
	{
		high = open + Math.random() * (1000-open);  //Random number greater than open
		low = open - Math.random() * open;   		//Random number lesser than open
		close = low + Math.random() * (high-low) ;	//Random number between high and low
		// values = reorderOhlc(values);
		var values = [open, high, low, close];
		setGlobals(values);
		data[i] = values;

		open = close;
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
		chart = undefined;
    	ctx.clearRect(0,0,canvas.width,canvas.height);
	}
	draw(chartType, getData(true));
	chart = true;
	// if (chartType === "line")
	// 	chart = new Chart(ctx).Line(getData(), {
	// 		bezierCurve: false
	// 		});
}

function redraw(e)
{
	canvas.width = scale*canvas.clientWidth;
	canvas.height = scale*canvas.clientHeight;
	if(chartType)
		document.getElementById(chartType).click();
}

function draw(chartType, data)
{
	var xLabelSeparation = scale*30;
	var axesPadding = scale*30;
	var smallPadding = scale*10;
	var offset = scale*3;
	var overflow = scale*5;
    
    globalHigh = Math.ceil(globalHigh/100)*100;
    globalLow = Math.floor(globalLow/100)*100;

    var businessLimits=globalHigh-globalLow;
    var displayLimits = canvas.height-axesPadding-smallPadding;
    var yfactor=businessLimits/displayLimits;

	count = (((((canvas.width-axesPadding-smallPadding)/xLabelSeparation)+ 0.5) << 1) >> 1);
	
	ctx.lineWidth = scale*1;
	ctx.lineJoin = 'round';
	ctx.textAlign = 'center';
	ctx.strokeStyle = '#6699FF';
	ctx.fillStyle = '#6699FF';
	ctx.font='24px sans-serif';
	ctx.beginPath();
	
	keys = Object.keys(data);
	for (var i=0;i<count;i++)
	{
		xcoord = axesPadding+i*xLabelSeparation;
		key = keys[i];
		var p = {};
		p["x"] = xcoord;
		scaledY = [];
		for(var j=0; j<4 ; j++)
			scaledY.push(canvas.height-axesPadding-(data[key][j]/yfactor));
		p["y"] = scaledY;
		if( chartType==='line' && i<count-1)
		{
			var p1 = {};
			p1["x"] = xcoord+xLabelSeparation;
			p1["y"] = canvas.height-axesPadding-(data[keys[i+1]][3]/yfactor);
			drawLine(p, p1, axesPadding);
		}
		else if (i>0)
		{
			if(chartType==='bar')
				drawBarcandle(p, overflow);
				// drawBar(p, axesPadding, xLabelSeparation);
			else if (chartType==='candlestick')
				drawCandle(p, xLabelSeparation);
		}
		ctx.fillText(key, xcoord, canvas.height-axesPadding/2);
	}

	ctx.closePath();

	ctx.lineWidth = 1;
	ctx.lineCap = 'round';
	ctx.fillStyle = '#6699FF';
	ctx.beginPath();

	ctx.moveTo(axesPadding, smallPadding);
	ctx.lineTo(axesPadding, canvas.height-axesPadding+overflow);
	ctx.stroke();

	//TODO Draw yLabels here
	ctx.textAlign='right';
	//ctx.fillText(globalHigh, axesPadding-2, smallPadding+offset);
	for (var i=globalLow+100; i<=globalHigh; i=i+100)
		ctx.fillText(i, axesPadding-offset, canvas.height-axesPadding-i/yfactor);
	ctx.fillText(globalLow, axesPadding-overflow-offset, canvas.height-axesPadding+offset);

	ctx.moveTo(axesPadding-overflow, canvas.height-axesPadding);
	ctx.lineTo(canvas.width-smallPadding, canvas.height - axesPadding);
	ctx.stroke();

	ctx.closePath();
}

function drawCandle(point, xLabelSeparation)
{
	var width = xLabelSeparation/3;
	ctx.strokeStyle = "#333";

	var x = point["x"];
	var open  = point["y"][0];
	var high  = point["y"][1];
	var low   = point["y"][2];
	var close = point["y"][3];
	if(close<=open)  				//Reversed operator since open and close are now coordinates from top 
		ctx.fillStyle = "#6699FF";
	else
		ctx.fillStyle = "#FF3366";
	
	ctx.beginPath();
	ctx.moveTo(x,high);
	ctx.lineTo(x,low);
	ctx.stroke();
	ctx.closePath();

	ctx.fillRect(x-width/2, open, width, close-open);
}
function drawBarcandle(point, overflow)
{
	var width =1;
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
	ctx.moveTo(x,open);
	ctx.lineTo(x-overflow,open);
	ctx.stroke();
	ctx.moveTo(x,close);
	ctx.lineTo(x+overflow,close);
	ctx.stroke();
	//ctx.fillRect(x-0.5, open-0.5, 1, 1);
	//ctx.fillRect(x-0.5, close-0.5, 1, 1);
	
}
function drawBar(point, axesPadding, xLabelSeparation)
{
	var width = xLabelSeparation/2;
	ctx.fillStyle = "#6699FF";
	ctx.strokeStyle = "#333";

	var x = point["x"];
	var close = point["y"][3];
	ctx.fillRect(x-width/2, canvas.height-axesPadding-close, width, close);
	
}
function drawLine(point, point1, axesPadding)
{
	var x = point["x"];
	var close = (((point["y"][3] + 0.5) <<1) >>1);

	var x1 = point1["x"];
	var close1 = (((point1["y"]+ 0.5) <<1) >>1);

	ctx.moveTo(x,close);
	ctx.lineTo(x1,close1);
	ctx.stroke();
}

function setup(){
	console.log("setting up");

	canvas.width = scale*canvas.clientWidth;
	canvas.height = scale*canvas.clientHeight;

	var buttons = document.getElementsByClassName("button");
	for (var i=0;i<buttons.length;i++)
		buttons[i].addEventListener("click",drawChart);
	window.addEventListener("resize",redraw);
	buttons[0].click();

	console.log("setup complete");
}
setup();