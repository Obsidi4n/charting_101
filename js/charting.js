Chart.defaults.global.responsive = true;
var chart, chartType;
var canvas = document.getElementById("chart");
var ctx = canvas.getContext("2d");

function randomNumberJesus()
{
	var min = Math.random() * 1000;
	var max = Math.random() * 1000;

	var labels = [];
	var values = [];

	var count = 10;
	for(var i=0;i<count;i++)
	{
		labels.push(i);
		values.push( (Math.random()*(max-min)) + min )
	}
	return {"x":labels,"y":values}
}
function getData()
{
	var randomResults = randomNumberJesus();
	var data = {
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
		ctx.fillText("Still working on this", canvas.width/2, canvas.height/2);
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
	if(chartType)
		document.getElementById(chartType).click();
}

function setup(){
	console.log("setting up");
	var buttons = document.getElementsByClassName("button");
	for (var i=0;i<buttons.length;i++)
		buttons[i].addEventListener("click",drawChart);
	window.addEventListener("resize",redraw);
	buttons[0].click();
	console.log("setup compelte");
}
setup();