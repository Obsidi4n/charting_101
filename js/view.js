var selectedScale='15min';
var socket = io();

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var tooltip = document.getElementById('tooltip'); 

var respData;
var requestInProgress = false;

function getData()
{
	if(!requestInProgress)
	{
		requestInProgress = true;
		tooltip.style.display = 'none';
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

				requestInProgress = false;
				document.getElementById('loading').style.opacity = 0;
			}
		};
		var date = new Date();
		// console.log(date.toISOString());
		if(a.globals.plottablePoints<20)
			a.globals.plottablePoints = 20;

		urlParams = 'date='+ date.toString() +'&scale='+selectedScale+'&count='+5*a.globals.plottablePoints ;
		console.log(urlParams);
		xhr.send( urlParams );
	}
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

function showToolTip(selected, mousePos)
{   
    document.getElementById('label').innerHTML = selected.x;
    document.getElementById('open').innerHTML  = selected.y[0];
    document.getElementById('high').innerHTML  = selected.y[1];
    document.getElementById('low').innerHTML   = selected.y[2];
    document.getElementById('close').innerHTML = selected.y[3];
    
    var limits = canvas.getBoundingClientRect();
	tooltip.style.display = 'block';
    if (limits.bottom-mousePos.y<tooltip.clientHeight)
    	tooltip.style.top = mousePos.y - tooltip.clientHeight + 'px';
    else
    	tooltip.style.top = mousePos.y + 2 + 'px';
    if ( limits.right - mousePos.x < tooltip.clientWidth )
    	tooltip.style.left = mousePos.x - tooltip.clientWidth - 2 + 'px';
	else
		tooltip.style.left = mousePos.x + 2 + 'px';
}

function clickHandler(evt) 
{
	mousePos = {
      x: evt.clientX,
      y: evt.clientY
    };
    var index = a.checkClick(mousePos);
    if (index.constructor != Boolean)
    {	
    	var selected = {};
    	selected.x = Object.keys(respData)[index];
        selected.y = respData[Object.keys(respData)[index]];
        for(var i =0; i<4; i++)
        	selected.y[i] = Math.round(selected.y[i]);
    	showToolTip(selected, mousePos);
    	console.log('Clicked point', index);
    }
    else
    {
    	console.log('nothing clicked');
    }
 	// showTooltip(mousePos, 5);
}

socket.on('realtime', function(data){
	console.log(data);
	var key = Object.keys(data)[0];
	respData[key] = data[key];
	// if (a.chartType == 'Line')
	// {
	// 	data[key] = data[key][3];
	// }
	a.updateDataByKey(data);
});

function switchLights()
{
	toggle = document.querySelector('#switch .desaturate');
	toggleClass = 'imgColor';
	if (a.theme === 'dark')
	{
		document.body.style.background = '#eef';
		toggle.className=toggle.className.replace(toggleClass,'');
	}
	else
	{
		document.body.style.background = '#222';
		toggle.className+=' ' + toggleClass;
	}
	a.flipColors();
}

function drop() 
{
  if (document.getElementById('scaleItems').style.display === 'block') 
    document.getElementById('scaleItems').style.display = 'none';
  else
    document.getElementById('scaleItems').style.display = 'block';
}

function changeScale(event)
{
	originClass = event.currentTarget.className;
	if (!requestInProgress && originClass.indexOf('active')===-1)
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

var mousePoint=[];

function mouseDown(event){
	if (event.touches)
		event = event.touches[0];
	mousePoint = [event.pageX, event.pageY];
}

function endDrag(event){
	tooltip.style.display = 'none';
	if (event.changedTouches)
		event = event.changedTouches[0];

	if (event.pageX != mousePoint[0] && event.pageY != mousePoint[1])
	{
		dx = 2 * ((((event.pageX - mousePoint[0])/60+0.5)<<1)>>1);
		console.log('Moving by', dx)
		a.scroll(2*dx);
	}
	else
		clickHandler(event);
}

window.onload = function setup(){
	a = new Alice(ctx);

	buttons = document.getElementsByClassName('button');
	for (var i=0;i<buttons.length;i++)
		buttons[i].addEventListener('click', drawChart, false);

	buttons[0].click();

	tabs = document.getElementsByClassName('tab');
	for (var i=0;i<tabs.length;i++)
		tabs[i].addEventListener('click', changeScale, false);

	scales = document.getElementsByClassName('scale');
	for (var i=0;i<scales.length;i++)
		scales[i].addEventListener('click', changeScale, false);

	canvas.addEventListener('mousedown', mouseDown, false);
	canvas.addEventListener('mouseup', endDrag, false);

	canvas.addEventListener('touchstart', mouseDown, false);
	canvas.addEventListener('touchend', endDrag, false);

	getData();
};
