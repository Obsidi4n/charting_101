var chart, chartType;
var canvas = document.getElementById("chart");
var ctx = canvas.getContext("2d");
var plottablePoints;

var globalHigh, globalLow;
var scale = 2;

var xLabelSeparation = scale*20;
var axesPadding = scale*30;
var smallPadding = scale*10;
var offset = scale*3;
var overflow = scale*5;

var ohlcData;
var screenData=[];
var selectedScale = '1days';

canvas.addEventListener('click', function(evt) {
		mousePos = getMousePos(canvas, evt);
	 	showTooltip(mousePos, 3);
    }, false);

canvas.addEventListener('touchstart', function(evt) {
		pos = {};
		pos.x=evt.touches[0].clientX;
		pos.y=evt.touches[0].clientY;
	    showTooltip(pos,10);
	    evt.preventDefault();
	}, false);

function showTooltip(pos, radius){
		
        var mouseX=pos.x;
        var mouseY=pos.y;
        // var message =  mouseX+ ',' + mouseY;
        found = false;
    //     
        for (var i = 0; i < screenData.length; i++) 
        {
        	var point = screenData[i];
        	var dx = mouseX - point["x"]/scale;
        	var dy = mouseY - point["y"][3]/scale;
        	if (dx * dx + dy * dy < radius*radius)
        	{
        		writeMessage(i);
        		found = true;
        		break;
        	}

    //         //tooltipSpan.style.left = (point["x"]) +40 +"px";
    //         //tooltipSpan.style.top = (point["y"][3] + 40) + "px";
    //         //tipctx.clearRect(0, 0, tipcanvas.width, tipcanvas.height);
    //         //                  tipCtx.rect(0,0,tipCanvas.width,tipCanvas.height);
    //         //document.getElementById('tooltip').innerHTML = message
    //         //tipctx.fillText(message, 5, 15);
    //         //hit = true;
    //     }

    	}
    	if (!found) 
    		document.getElementById("tooltip").innerHTML='';
    // }
    // writeMessage(message);
}

function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
}

function writeMessage(index) {
		var tooltipSpan = document.getElementById('tooltip');
		var x=index+1
		var y=Math.round(ohlcData[keys[x]][3],2)
		message = keys[x] + ',' + y;
        document.getElementById("tooltip").innerHTML=message;
        tooltipSpan.style.top = (y + 20) + 'px';
    	tooltipSpan.style.left = (index+1 + 20) + 'px';
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

function getData()
{
	globalHigh=0;
	globalLow=null;
	ohlcData = null;

	var randomResults = randomNumberJesus();
	
	var xhr = new XMLHttpRequest()
	xhr.open('POST', '/dataSource');
	xhr.setRequestHeader('content-type','application/x-www-form-urlencoded');
	xhr.onreadystatechange = function (e) {
		if (xhr.readyState==4 && xhr.status==200)
		{
			ohlcData = JSON.parse(this.response);
			draw();
		}
	};
	var date = new Date();
	console.log(date.toISOString());

	urlParams = 'date='+ date.toString() +'&scale='+selectedScale+'&count=' + 2*plottablePoints ;
	xhr.send( urlParams );
	// var data;
	// if (typeof(ohlc)==='undefined')
	// {
	// 	closePoints = [];
	// 	for(var  key in randomResults)
	// 		closePoints.push(randomResults[key][3])
	// 	data = {
	// 	labels: Object.keys(randomResults),
	// 	datasets: [
	// 		{
	// 			label: "Sample data",
	// 			fillColor: "rgba(220,220,220,0.7)",
	// 			strokeColor: "rgba(220,220,220,0.8)",
	// 			highlightFill: "rgba(220,220,220,0.75)",
	// 			highlightStroke: "rgba(220,220,220,1)",
	// 			data: closePoints //[65, 59, 80, 81, 56, 55, 40]
	// 		}
	// 	]
	// 	};
	// }
	// else
	// 	data = randomResults;
	return randomResults;
}

function redraw(e)
{
	canvas.width = scale*canvas.clientWidth;
	canvas.height = scale*canvas.clientHeight;
	plottablePoints = (((((canvas.width-axesPadding-smallPadding)/xLabelSeparation)+ 0.5) << 1) >> 1);
	if(chartType)
		document.getElementById(chartType).click();
}

function drawChart(el)
{
	chartType = el.currentTarget.id;
	if(chart)
	{
		chart = false;
    	ctx.clearRect(0,0,canvas.width,canvas.height);
	}
	if (ohlcData)
		draw();
	else
		getData();
	// if (chartType === "line")
	// 	chart = new Chart(ctx).Line(getData(), {
	// 		bezierCurve: false
	// 		});
}

function draw()
{
    
    globalHigh = Math.ceil(globalHigh/100)*100;
    globalLow = Math.floor(globalLow/100)*100;

    var businessLimits=globalHigh-globalLow;
    var displayLimits = canvas.height-axesPadding-smallPadding;
    var yfactor=businessLimits/displayLimits;
	
	ctx.lineWidth = scale*1;
	ctx.lineJoin = 'round';
	ctx.textAlign = 'center';
	ctx.strokeStyle = '#6699FF';
	ctx.fillStyle = '#6699FF';
	ctx.font='24px sans-serif';
	ctx.beginPath();
	
	keys = Object.keys(ohlcData);
	for (var i=0;i<plottablePoints-1;i++)
	{
		xcoord = axesPadding+(plottablePoints-i)*xLabelSeparation;
		key = keys[i];
		var p = {};
		p["x"] = xcoord;
		scaledY = [];
		for(var j=0; j<4 ; j++)
			scaledY.push(canvas.height-axesPadding-(ohlcData[key][j]/yfactor));
		p["y"] = scaledY;
		if( chartType==='line' && ohlcData[keys[i-1]])
		{
			var p1 = {};
			p1["x"] = xcoord+xLabelSeparation;
			p1["y"] = canvas.height-axesPadding-(ohlcData[keys[i-1]][3]/yfactor);
			drawLine(p, p1, axesPadding);
			screenData.push(p);
			drawCricle(p);
		}
		else if (i>0)
		{
			if(chartType==='bar')
				drawBarcandle(p, overflow);
			else if (chartType==='candlestick')
				drawCandle(p, xLabelSeparation);
		}
		if(i%4==0)
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

	chart = true;
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

function drawBar(point, axesPadding, xLabelSeparation)
{
	var width = xLabelSeparation/2;
	ctx.fillStyle = "#6699FF";
	ctx.strokeStyle = "#333";

	var x = point["x"];
	var close = point["y"][3];
	ctx.fillRect(x-width/2, canvas.height-axesPadding-close, width, close);
	
}

function drawBarcandle(point, overflow)
{
	var width =1;
	var x = point["x"];
	var open  = point["y"][0];
	var high  = point["y"][1];
	var low   = point["y"][2];
	var close = point["y"][3];
	if(close<=open)  
	{
		ctx.strokeStyle = '#6699FF';
		ctx.fillStyle = "#6699FF";	
	}				//Reversed operator since open and close are now coordinates from top 
		
	else{
		ctx.strokeStyle = "#FF3366";
		ctx.fillStyle = '#FF3366';
	}
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

function drawCricle(p)
{
	var radius=6;
    ctx.beginPath();
	ctx.arc(p["x"], p["y"][3], radius, 0, 2 * Math.PI);
	ctx.fillStyle = '#6699FF';
	//ctx.globalAlpha=0.5;
	ctx.fill();
	//ctx.globalAlpha=1;
	//ctx.globalAlpha=0.5;
	//ctx.strokeStyle = "#6699FF";
	ctx.stroke();
} 
function setup(){
	console.log("setting up");

	var buttons = document.getElementsByClassName("button");
	for (var i=0;i<buttons.length;i++)
		buttons[i].addEventListener("click",drawChart);
	window.addEventListener("resize",redraw);

	chartType = "line";
	redraw(null);

	console.log("setup complete");
}
setup();