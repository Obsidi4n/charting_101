var selectedScale='15min';
var socket = io();

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var respData;
var getData =function(){
	document.getElementById('loading').style.opacity = 1;

	var xhr = new XMLHttpRequest()
	xhr.open('POST', '/dataSource');
	xhr.setRequestHeader('content-type','application/x-www-form-urlencoded');
	xhr.onreadystatechange = function (e) {
		if (xhr.readyState==4 && xhr.status==200)
		{
			respData = JSON.parse(this.response);
			console.log('Data received', Object.keys(respData).length);

			a.setData(respData);
			a.draw();
			document.getElementById('loading').style.opacity = 0;
		}
	};
	var date = new Date();
	// console.log(date.toISOString());
	if(a.globals.plottablePoints<20)
		a.globals.plottablePoints = 20;

	urlParams = 'date='+ date.toString() +'&scale='+selectedScale+'&count='+3*a.globals.plottablePoints ;
	console.log(urlParams);
	xhr.send( urlParams );
}

function drawChart(el)
{
	tooltip.style.display = 'none';
	chartType = el.currentTarget.id;
	
	prevActive = document.getElementsByClassName('active')[0];
	prevActive.className = prevActive.className.replace( /(?:^|\s)active(?!\S)/g , '' );
	src = prevActive.children[0].src;
	lastIndex = src.lastIndexOf('/');
	prevActive.children[0].src = src.slice(0,lastIndex)+'/' + src.slice(lastIndex+1).replace( 'active', '' );
	
	el.currentTarget.className = el.currentTarget.className + ' active';
	src = el.currentTarget.children[0].src;
	lastIndex = src.lastIndexOf('/');
	el.currentTarget.children[0].src = src.slice(0,lastIndex)+'/active' + src.slice(lastIndex+1);
	
	if (chartType === 'line')
		a.Line();
	else if (chartType === 'bar')
		a.Bar();
	else if (chartType === 'candlestick')
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

function drop() {
  if (document.getElementById('scaleItems').style.display === 'block') 
    document.getElementById('scaleItems').style.display = 'none';
  else
    document.getElementById('scaleItems').style.display = 'block';
}

function changeScale(event)
{
	originClass = event.currentTarget.className;
	if (originClass.indexOf('active')===-1)
	{
		child = event.currentTarget;
		var i = 0;
		while( (child = child.previousElementSibling) != null ) 
			i++;
		
		prevActive = document.getElementsByClassName('activeTab')[0];
		prevActive.className = prevActive.className.replace( 'activeTab' , '' );

		prevActive = document.getElementsByClassName('activeScale')[0];
		prevActive.className = prevActive.className.replace( 'activeScale' , '' );
		
		document.getElementsByClassName('tab')[i].className += ' activeTab';
		document.getElementsByClassName('scale')[i].className += ' activeScale';

		document.getElementById('mainButton').innerHTML=document.getElementsByClassName('activeScale')[0].innerHTML;
  		if (originClass.indexOf('tab')===-1)	
  			drop();

		selectedScale = event.currentTarget.id;
		getData();
	}
}

window.onload = function setup(){
	a = new Alice(ctx);

	buttons = document.getElementsByClassName('button');
	for (var i=0;i<buttons.length;i++)
		buttons[i].addEventListener('click', drawChart);

	buttons[0].click();

	tabs = document.getElementsByClassName('tab');
	for (var i=0;i<tabs.length;i++)
		tabs[i].addEventListener('click', changeScale);

	scales = document.getElementsByClassName('scale');
	for (var i=0;i<scales.length;i++)
		scales[i].addEventListener('click', changeScale);

	getData();
};

/*
<script type="text/javascript">



function changeScale(e)
{
  	id = e.srcElement.id;
  	console.log(id);
	
}

scales = document.querySelectorAll('.scale');
for(i=0;i<scales.length;i++)
	scales[i].addEventListener('click', changeScale);

</script
*/