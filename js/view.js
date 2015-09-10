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
		document.getElementById('no-data').style.display = 'none';
		document.getElementById('loading').style.opacity = 1;

		var xhr = new XMLHttpRequest()
		xhr.open('POST', '/dataSource');
		xhr.setRequestHeader('content-type','application/x-www-form-urlencoded');
		xhr.onreadystatechange = function (e) {
			if (xhr.readyState==4 )
			{
				if (xhr.status==200)
				{
					try
					{	
						respData = JSON.parse(this.responseText);
					}
					catch (err)
					{
						console.log('Failed parsing JSON. Cause: ', err);
						console.log('Response received: ', this.responseText);
						failedDataLoad();
					}
					console.log('Data received', Object.keys(respData).length);

					a.setData(respData);
					a.draw();

					requestInProgress = false;
					document.getElementById('loading').style.opacity = 0;
				}
				else
					failedDataLoad();
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

function failedDataLoad()
{
	document.getElementById('loading').style.opacity = 0;
	document.getElementById('no-data').style.display = 'table';
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

var firstTouch=[];
var scaling = 0, 
	// pinchTouches =[],
	pivot, prevSeparation, direction, touchTimer;

function mouseDown(event){
	if (event.touches)
	{
		if(event.touches.length === 2) 
		{
    		scaling = 2;
    		// pinchTouches.push(event.touches[0], event.touches[1]);
    		prevSeparation = separation(event.touches[0], event.touches[1]);
    		pivot = {'x': (event.touches[0].pageX+event.touches[1].pageX)/2,
    				 'y': (event.touches[0].pageY+event.touches[1].pageY)/2};
    		touchTimer = new Date();
    		// alert('scaling' + event.touches[0].pageX + ' ' + pinchTouches.pageX);
   			// console.log(event.touches[0].pageX, ':' , event.touches[0].pageY, ' ', event.touches[1].pageX, ':', event.touches[1].pageY);
    	}
		event = event.touches[0];
	}
	firstTouch = [event.pageX, event.pageY];
}

function separation(p,p1)
{
	var separate = {'x': Math.abs(p.pageX-p1.pageX),
					'y': Math.abs(p.pageY-p1.pageY)};

	separate['distance'] = Math.sqrt(separate.x*separate.x + separate.y*separate.y );
	return separate;	
}

function preventScroll(event) {
	event.preventDefault();
	// event = event.touches[0];
	if(scaling && event.touches.length === 2 && new Date()-touchTimer>100)
	{
		touchTimer = new Date();

		newSeparation = separation(event.touches[0],event.touches[1]);
		direction = (newSeparation.distance-prevSeparation.distance>0) ? -1 : 1;
		
		ratio = Math.abs(newSeparation.x - prevSeparation.x)/Math.abs(newSeparation.y - prevSeparation.y);
		//Cotangent values of 72, 54, 36...
		if (ratio>3)
			dx = 4;
		else if (ratio > 1.4)
			dx = 3;
		else if (ratio > 0.7)
			dx = 2;
		else if (ratio > 0.3)
			dx = 1;
		else
			dx = 0;

		dy=direction*(4-dx);
		dx*=direction;

		console.log(dx+':'+dy+':'+direction);
		a.zoom(pivot, dx, dy);

		prevSeparation = newSeparation;
	}
}

function endDrag(event){
	tooltip.style.display = 'none';
	if(scaling)
		scaling--;
	else
	{
		if (event.changedTouches)
			event = event.changedTouches[0];

		if (event.pageX != firstTouch[0] && event.pageY != firstTouch[1])
		{
			dx = 2 * ((((event.pageX - firstTouch[0])/60+0.5)<<1)>>1);
			// console.log('Moving by', dx)
			a.scroll(2*dx);
		}
		else
			clickHandler(event);
	}
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
	canvas.addEventListener('touchmove', preventScroll, false);
	canvas.addEventListener('touchend', endDrag, false);
	// alert('pinch '+ dx + ' ' +dy);
	getData();
};
