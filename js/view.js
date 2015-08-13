var socket = io();

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var respData;
var getData =function(){
	var xhr = new XMLHttpRequest()
	xhr.open('POST', '/dataSource');
	xhr.setRequestHeader('content-type','application/x-www-form-urlencoded');
	xhr.onreadystatechange = function (e) {
		if (xhr.readyState==4 && xhr.status==200)
		{
			respData = JSON.parse(this.response);
			console.log('Data received', Object.keys(respData).length);

			a.setData(respData);
			// drawLine();
			//drawBar();
			// drawCandlestick();
		}
	};
	var date = new Date();
	console.log(date.toISOString());

	urlParams = 'date='+ date.toString() +'&scale=15min&count='+3*a.globals.plottablePoints ;
	xhr.send( urlParams );
}

function drawLine()
{
	// var lineData = {};
	// var keys = Object.keys(respData);
	// for(var i=0; i<keys.length;i++)
	// {
	// 	var key = keys[i];
	// 	if (!respData[key])
	// 		console.log(key);
	// 	lineData[key] = respData[key][3];
	// }
	// a.Line(lineData);
	a.Line(respData);
}

function drawBar()
{
	a.Bar();
}

function drawCandlestick()
{
	a.CandleStick();
}

canvas.addEventListener('click', function(evt) {
	mousePos = {
      x: evt.clientX,
      y: evt.clientY
    };
    var selected = a.checkClick(mousePos);
    if (selected)
    	console.log('Clicked point', selected);
    else
    	console.log('nothing clicked');
 	// showTooltip(mousePos, 5);
}, false);

a = new Alice(ctx);
getData();

document.getElementById('line').addEventListener('click',drawLine);
document.getElementById('bar').addEventListener('click',drawBar);
document.getElementById('candlestick').addEventListener('click',drawCandlestick);
socket.on('realtime', function(data){
	console.log(data);
	var key = Object.keys(data)[0];
	respData[key] = data[key];
	if (a.chartType == 'Line')
	{
		data[key] = data[key][3];
	}
	a.updateDataByKey(data);
});