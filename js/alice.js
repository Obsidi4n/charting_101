(function(){

	"use strict";

	//This keeps then chart object in scope, just in case needed
	var globalChart = null;


	//The initiailization of alice, this where 
	//The canvas and context gets picked up
	//Resize functions is appended
	var Alice = function(context){
		this.canvas = context.canvas;
		this.context = context;

		window.addEventListener("resize", this.recalibrate);
		this.recalibrate();
		// var separation = this.globals.scale * this.globals.xLabelSeparation;
		// this.globals.plottablePoints = ((((availableWidth/separation)+ 0.5) << 1) >> 1);
	 	this.globals.gridsDrawn = true;
	 	this.globals.labelsDrawn = true;

	 	Alice.globalChart = this;

		return this;
	};

	Alice.prototype.chartType = null;

	//Fields that are used as configuration variables for the general graph properties
	Alice.prototype.globals = {
		//Scale variable to increase canvas density
		scale : 2,

		//Points to be drawn and density
		plottablePoints: 60,
		pointsPerLabel: 4,

		//Axes properties
		xLabelSeparation : 40,
		yLabels : 10,
		yAxisPadding : 50,
		xAxisPadding : 25,
		overflow : 5,
		labelsDrawn: true,
		gridsDrawn: true,

		//Click radius
		clickRadius: 5,

		//Scroll is done through the following value change
		startIndex: 0,
		scrollOffset: 0,
		steps:0,

		//Each graphs configuration property. 
		//Values to be defined in the corresponding draw function
		barWidth: 0,
		lineWidth: 0,
		candleWidth: 0,
	};

	//Color configurations
	//Name the theme like this
	Alice.prototype.theme = 'dark';

	//Define the four colors used
	Alice.prototype.colors = {
		positiveFontColor: '#333',
		negativeFontColor: '#EEE',
		positiveFillColor: '#6699FF',
		negativeFillColor: '#FF3366',
	};

	//Sample flip color function
	Alice.prototype.flipColors = function(){
		if (this.theme === 'dark')
		{
			this.theme = 'light';
			this.colors = {
				positiveFontColor: '#EEE',
				negativeFontColor: '#333',
				positiveFillColor: '#009900',
				negativeFillColor: '#F80000',
			}
		}
		else
		{
			this.theme = 'dark';
			this.colors = {
				positiveFontColor: '#333',
				negativeFontColor: '#EEE',
				positiveFillColor: '#6699FF',
				negativeFillColor: '#FF3366',
			}
		}
		this.draw();
	};
	
	//Data copy set by the setData call
	Alice.prototype.Data = [],

	//Data coordinates as plotted. This SHOULD be emptied and populated in each draw function
	Alice.prototype.ScreenCoords=[];

	// Alice.prototype.XLabels = [];
	// Alice.prototype.YLabels = [];

	//Draw grid function. NOTE: This is only the skeleton lines
	Alice.prototype.drawGrids = function(){

			var ctx = this.context;
			ctx.lineWidth = 1;
			ctx.globalAlpha = 0.1;
			ctx.strokeStyle = this.colors.negativeFontColor;

			var skipPoints = this.globals.pointsPerLabel;
			var xLabelSeparation = this.globals.scale * this.globals.xLabelSeparation;
			var yStart = this.globals.scale * this.globals.yAxisPadding;
			var xStart = this.globals.scale * this.globals.xAxisPadding;

			var availableWidth = this.canvas.width - yStart;
			var availableHeight = this.canvas.height - xStart;

			var verticalLines = availableWidth/xLabelSeparation;
			for(var i=0;i<verticalLines;i+=skipPoints)
			{
				ctx.beginPath();
				ctx.moveTo(availableWidth-(i*xLabelSeparation), 0);
				ctx.lineTo(availableWidth-(i*xLabelSeparation), availableHeight);
				ctx.stroke();
				ctx.closePath();
			}

			var horizontalLines = this.globals.yLabels;
			var increment = availableHeight/horizontalLines;
			for(var i=0;i<horizontalLines;i++)
			{
				ctx.beginPath();
				ctx.moveTo(0, availableHeight-(i*increment));
				ctx.lineTo(availableWidth, availableHeight-(i*increment));
				ctx.stroke();
				ctx.closePath();
			}
			ctx.closePath();
			ctx.globalAlpha = 1;
	};

	//Adding labels to drawn grid. 
	//NOTE Calling drawGrid before calling drawLabels makes logical sense, but is not a requirement
	Alice.prototype.drawLabels = function(){
		if(this.Data && Object.keys(this.Data).length > 1)
		{
			var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
			var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

			var xStart = this.canvas.width - yAxisPadding;
			var skipPoints = this.globals.pointsPerLabel;
			
			var separation = this.globals.scale * this.globals.xLabelSeparation;
			var fontSize = (((this.canvas.width/separation) << 1 ) >> 1);
			var fontOffset = 20;

			var ctx = this.context;	
			ctx.font= fontSize +'px sans-serif';
			var xLabels = Object.keys(this.Data);
			while(ctx.measureText(xLabels[1]).width > skipPoints * separation)
			{
				fontSize-=1;
				ctx.font= fontSize +'px sans-serif';
			}
			ctx.font= ((fontSize-2<<1)>>1) +'px sans-serif';
			ctx.fillStyle = this.colors.negativeFontColor;
			ctx.textAlign = 'center';

			for (var i = 0; i < this.globals.plottablePoints/skipPoints; i++) 
			{
				var label = xLabels[this.globals.startIndex+skipPoints*i];
				ctx.fillText(label, xStart-(i*skipPoints*separation), this.canvas.height-fontOffset);
			}
			console.log(i,' labels drawn on X-axis');

			ctx.font= ((fontSize+2<<1)>>1) +'px sans-serif';
			ctx.textAlign = 'left';
			
			var conversion = this.globals.virtualPixelConversion;
			var value = this.Data[Object.keys(this.Data)[0]];
			if(value.constructor === Array)
				value = value[value.length-1];
			var yCoord = ((((this.canvas.height-xAxisPadding-(value/conversion)) + 0.5) <<1) >>1);
			
			var latestYLabel = Math.round(value*100)/100;
			var latestYPosition = yCoord;

			var labelPadding = this.globals.scale * 5;
			var padding = 5;
			var rect = ctx.measureText(latestYLabel);
			ctx.fillRect(this.canvas.width-yAxisPadding+labelPadding-padding , latestYPosition-fontOffset/2, rect.width+2*padding, 40);

			ctx.fillStyle = this.colors.positiveFontColor;
			ctx.fillText(latestYLabel, this.canvas.width-yAxisPadding+labelPadding , latestYPosition+fontOffset);
			
			ctx.fillStyle = this.colors.negativeFontColor;
			var yRange = this.globals.globalHigh - this.globals.globalLow;
			var increment = yRange / 10;
			
			var height = this.canvas.height;
			for(var i=0;i<10;i++)
			{
				var label = Math.round(this.globals.globalHigh-i*increment);
				var yPosition = height- xAxisPadding - label/conversion;
				if ( Math.abs(yPosition - (latestYPosition+fontOffset) ) > 50)
					ctx.fillText(label, this.canvas.width-yAxisPadding+labelPadding , yPosition+fontOffset);
			}
		}
	};

	//Clear only the graph plot area
	//Call createFreshGraph if you want to clear the entire graph
	Alice.prototype.clearGrids = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,0, this.canvas.width-yAxisPadding, this.canvas.height-xAxisPadding);
		this.globals.gridsDrawn = false;
	};

	//Clear only labels
	//Call createFreshGraph if you want to clear the entire graph
	Alice.prototype.clearLabels = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,this.canvas.height-xAxisPadding+this.globals.scale, this.canvas.width, this.canvas.height);
		this.context.clearRect(this.canvas.width-yAxisPadding+this.globals.scale,0, this.canvas.width, this.canvas.height);
		this.globals.labelsDrawn = false;
	};

	//Add this as an eventListener to the resize function of the chart element/body/window
	//This is already done in the initializing function
	Alice.prototype.recalibrate = function(source){
		if (!source)
			var alice = this;
		else
			var alice = window.Alice.globalChart;

		var width = alice.canvas.width = alice.globals.scale*alice.canvas.clientWidth;
		alice.canvas.height = alice.globals.scale*alice.canvas.clientHeight;
		
		var yStart = alice.globals.scale * alice.globals.yAxisPadding;
		var availableWidth = alice.canvas.width - yStart;
		if(availableWidth < 1000)
		{
			alice.globals.clickRadius = 10;
			alice.globals.xAxisPadding = 15;
			alice.globals.yAxisPadding = 30;
			alice.globals.xLabelSeparation = 20;
			// alice.globals.plottablePoints = 25;
		}
		else
		{
			alice.globals.clickRadius = 5;
			alice.globals.xAxisPadding = 25;
			alice.globals.yAxisPadding = 50;
			alice.globals.xLabelSeparation = 25;
			// alice.globals.plottablePoints = 50;
		}

		alice.globals.plottablePoints = ((( availableWidth/(alice.globals.xLabelSeparation * alice.globals.scale)+1) <<1) >>1);
		alice.draw();
	};

	//Move to view logic since user may wish to manipulate clicked element differently
	Alice.prototype.Tooltip = {
		draw: function(){

		},//TODO Draw function for tooltip
	};
     
    //Function that sets data to be plotted
    //Also calculates the high and low  and the ratio for value limits to display limits
    //The valueLimits:display limits is called virtualPixelConversion and is used to dynamically set limits oh graph

    //Calling this will not plot the graph. Please use the draw function after setting data to plot.
    //NOTE: Draw function will be initialized only after graphType has been initialized
    Alice.prototype.setData = function(data){
    		this.Data = data;
    		var keys = Object.keys(data);
    		
    		var globalHigh = 0;
    		var globalLow = 0;
    		for (var i = 0; i < keys.length; i++)
    		{
    			var value = data[keys[i]];

    			// this.XLabels.push(keys[i]);

    			if(value.constructor === Array)
    			{	
    				if(globalHigh<value[1])
						globalHigh=value[1];
					if(!globalLow)
						globalLow=value[2];
					else if(globalLow>value[2])
						globalLow=value[2];
    			}
    			else
    			{
    				if(globalHigh<value)
						globalHigh=value;
					if(!globalLow)
						globalLow=value;
					else if(globalLow>value)
						globalLow=value;
    				
				}
			}
			this.globals.globalHigh = Math.ceil(globalHigh/100)*100;
			this.globals.globalLow = Math.floor(globalLow/100)*100;

		    var dataLimits= this.globals.globalHigh - this.globals.globalLow;
		    var displayLimits = this.canvas.height - this.globals.scale * this.globals.xAxisPadding;
			this.globals.virtualPixelConversion = dataLimits/displayLimits;

			this.globals.startIndex = 0;
    	};

    //Combined function that clears entire grid.
    //RECOMMENDED to be called at the start of draw function
    Alice.prototype.createFreshGraph = function(){
    	this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
		this.ScreenCoords = [];
    	if(this.globals.gridsDrawn)
    		this.drawGrids()
    };

    //Used to push realtime updates or corrections.
    //This will force a redraw
    Alice.prototype.updateDataByKey = function(data){
    	var key = Object.keys(data)[0];
    	this.Data[key] = data[key];
    	this.draw();
    };

    Alice.prototype.prependData = function(data){
    	// TODO to add data points to the start of the graph
    };

    //Common function across all graphs that calculates closest clicked point
    //Returns the x-index
    Alice.prototype.getClosestLabel = function(x){
	 	var nearestPoint=-1;
	 	var separation = this.globals.scale * this.globals.xLabelSeparation;

	 	var invertedXCoord= this.canvas.width - x - this.globals.yAxisPadding * this.globals.scale ;
	 	var modX = invertedXCoord % separation;
	 	
	 	if( modX < separation/2)
	 		nearestPoint=invertedXCoord-modX;
	 	else
	 		nearestPoint=invertedXCoord+modX;

	 	var index = (((nearestPoint / separation)<<1)>>1);
	 	
	 	return index;
    };

    //Scroll function used to change starting index
    //In general, scroll can be done by changing start index and redrawing
    //Keep start index within bounds
    Alice.prototype.scroll = function(dx){
    	var startIndex = this.globals.startIndex;
    	if (startIndex+dx < 0)
    	{
    		dx = -1*startIndex;
    	} 
    	else if(startIndex+dx+this.globals.plottablePoints > Object.keys(this.Data).length)
    	{
    		dx = Object.keys(this.Data).length-startIndex-this.globals.plottablePoints-1;
    	}
    	if (dx!=0 && !this.globals.steps)
    	{
    		this.globals.steps = dx * 2;						//dx*xLabelSeparation*scale/(xLabelSeparation*scale/2)
    		this.globals.sign = dx/Math.abs(dx);
    		// this.globals.scrolling = setInterval(this.scrollAnimate, Math.round(1000/this.globals.steps));
    		requestAnimationFrame( this.scrollAnimate );
	    }
    };

    Alice.prototype.scrollAnimate = function(){
    	var alice = window.Alice.globalChart;
    	if(alice.globals.steps%2===0)
			alice.globals.scrollOffset = alice.globals.sign * alice.globals.xLabelSeparation* alice.globals.scale/2;
		else
		{
			alice.globals.scrollOffset = 0;
			alice.globals.startIndex += alice.globals.sign;
		}
    	alice.draw();
    	alice.globals.steps-=alice.globals.sign;
    	if(alice.globals.steps)
    		requestAnimationFrame( alice.scrollAnimate );
    		// clearInterval(alice.globals.scrolling);
    };
    
    Alice.prototype.draw = function (data) {
    	// Please initialize a graph type first
    };

    Alice.prototype.checkClick = function(x,y){
    	// Please initialize a graph type first
    };


    //Main logic of all plots below

    //In a nutshell, each graph type needs the following
    
    //chartType 	- String title for graph
    
    //draw    		- Function that holds the drawing logic.
    //A sample draw function should 
    //		1) Clear the graph
	//		2) Pick up all the globals axes configuration
	//		3) Iterate through this.Data and convert all the values to their corresponding display coordinates
	// 		4) Push plotted coordinates to this.ScreenCoords to be used in checkClick

    //checkClick	- Function that holds the custom drawn plot and returns the data
    //This function is meant to be used to query if given coordinates (like that of a click/touch) are within the plotted elements
    //You can used this.getClosestLabel on the x-coordinates to hunt down your required point and then used the corresponsing 
    //y-coords from this.ScreenCoords to decide if you want to accept this as a click or not.
    //If positive, then return INDEX of the clicked element.
    //this.Data[index] will give you values, if needed
    
    //Additionally, add check for data being passed and draw, if data is set

    //Line graph
    Alice.prototype.Line = function(data){
    	this.chartType = 'Line';
    	this.lineWidth = this.globals.scale*1;
    	this.draw = function(){
    		if(this.Data && Object.keys(this.Data).length>1)
    		{
    			this.createFreshGraph();
    			this.ScreenCoords = [];
	    		var keys = Object.keys(this.Data);
	    		var points = this.globals.plottablePoints;
	    		var startIndex = this.globals.startIndex;

	    		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;
				var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;

	    		var xStart = this.canvas.width - yAxisPadding + this.globals.scrollOffset;
	    		var separation = this.globals.scale * this.globals.xLabelSeparation;

			    var virtualPixelConversion=this.globals.virtualPixelConversion;

			    ctx.lineWidth = this.lineWidth;
				ctx.strokeStyle = this.colors.positiveFillColor;
				ctx.fillStyle = this.colors.positiveFillColor;
				var radius=6;

				for (var i= startIndex; i<startIndex+points && i<keys.length-1; i++)
				{
					var xcoord = xStart-(i-startIndex)*separation;
					var value = this.Data[keys[i]];
					if(value.constructor == Array)
						value = value[value.length-1];

					var value1 = this.Data[keys[i+1]];	
					if(value1.constructor == Array)
						value1 = value1[value1.length-1];	

					var p = {};
					p["x"] = xcoord;
					p["y"] = ((((this.canvas.height-xAxisPadding-(value/virtualPixelConversion)) + 0.5) <<1) >>1);
					this.ScreenCoords.push(p);
					
					var p1 = {};
					p1["x"] = xcoord-separation;
					p1["y"] = ((((this.canvas.height-xAxisPadding-(value1/virtualPixelConversion)) + 0.5) <<1) >>1);

					ctx.beginPath();

					ctx.moveTo(p.x,p.y);
					ctx.lineTo(p1.x,p1.y);
					ctx.stroke();
					
					ctx.closePath();
					ctx.beginPath();

					ctx.arc(p.x,p.y, radius, 0, 2 * Math.PI);
					ctx.fill();

					ctx.closePath();
				}

				ctx.strokeStyle = this.colors.negativeFontColor;
				ctx.globalAlpha = 0.8;

				var value = this.Data[keys[0]];
				if(value.constructor == Array)
					value = value[value.length-1];

				var firstY = ((((this.canvas.height-xAxisPadding-(value/virtualPixelConversion)) + 0.5) <<1) >>1);
				ctx.beginPath();
				ctx.moveTo(0, firstY);
				ctx.lineTo(xStart, firstY);
				ctx.stroke();
				ctx.closePath();

				ctx.globalAlpha = 1;

				if(this.globals.scrollOffset)
				{
					var saveLabelState = this.globals.labelsDrawn;
					this.clearLabels();
					this.globals.labelsDrawn = saveLabelState;
				}
		    	if(this.globals.labelsDrawn)
		    		this.drawLabels();
			}

    	};

    	this.checkClick = function(position){
    		var xDisplacement = this.canvas.getBoundingClientRect().left;
    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
    		var virtualPixelConversion = this.globals.virtualPixelConversion;

    		var x = (position.x-xDisplacement) * this.globals.scale;
    		var y = (position.y-yDisplacement) * this.globals.scale;
    		
    		var clickRadius = this.globals.scale * this.globals.clickRadius;
        	var closestIndex = this.getClosestLabel(x);
        	var closestPoint = this.ScreenCoords[closestIndex];

        	var dx = x - closestPoint.x ;
        	var dy = y - closestPoint.y ;
        	if (dx * dx + dy * dy < clickRadius*clickRadius)
        		return this.globals.startIndex + closestIndex;
	    	return false;
    	};

    	if(data)
    		this.setData(data);

    	if(this.Data)
    		this.draw();
    };

    //Bar graph
	Alice.prototype.Bar=function(data)
    	{
	    	this.chartType = 'Bar';

	    	this.draw = function(){
	    		if(this.Data && Object.keys(this.Data).length>1)
	    		{
	    			this.createFreshGraph();
		    		var keys = Object.keys(this.Data);
		    		var points = this.globals.plottablePoints;
		    		var startIndex = this.globals.startIndex;

		    		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;
					var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;

		    		var xStart = this.canvas.width - yAxisPadding + this.globals.scrollOffset;
		    		var separation = this.globals.scale * this.globals.xLabelSeparation;

				    var dataLimits= this.globals.globalHigh - this.globals.globalLow;
				    var displayLimits = this.canvas.height - xAxisPadding;
				    var yfactor=dataLimits/displayLimits;
				    
				    ctx.lineWidth = this.globals.scale*1;

				    //local variables 
				    var overflow=10;
				    var open, close, high, low, x;

					for (var i= startIndex; i<startIndex+points && i<keys.length-1; i++)
					{
						var xcoord = xStart-(i-startIndex)*separation - overflow;
				
						var p = {};
						p["x"] = xcoord;
						p["y"] = [];
						for(var j=0; j<4; j++)
						{
							p["y"][j] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i]][j]/yfactor)) + 0.5) <<1) >>1);
						}
						this.ScreenCoords.push(p);
						x = p["x"];
						open  = p["y"][0];
						high  = p["y"][1];
						low   = p["y"][2];
						close = p["y"][3];
						if(close<=open)  
						{
							ctx.strokeStyle = this.colors.positiveFillColor;
							ctx.fillStyle = this.colors.positiveFillColor;	
						}				//Reversed operator since open and close are now coordinates from top 
							
						else{
							ctx.strokeStyle = this.colors.negativeFillColor;
							ctx.fillStyle = this.colors.negativeFillColor;
						}

						//Draw line at current position
						ctx.beginPath();
						ctx.moveTo(x-overflow,open);
						ctx.lineTo(x,open);
						ctx.stroke();
						ctx.moveTo(x,high);
						ctx.lineTo(x,low);
						ctx.stroke();
						ctx.moveTo(x,close);
						ctx.lineTo(x+overflow,close);
						ctx.stroke();
						ctx.closePath();
					}

					if(this.globals.scrollOffset)
					{
						var saveLabelState = this.globals.labelsDrawn;
						this.clearLabels();
						this.globals.labelsDrawn = saveLabelState;
					}
			    	if(this.globals.labelsDrawn)
			    		this.drawLabels();
				}
			};

			this.checkClick = function(position){
	    		var xDisplacement = this.canvas.getBoundingClientRect().left;
	    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
	    		var virtualPixelConversion = this.globals.virtualPixelConversion;

	    		var x = (position.x-xDisplacement) * this.globals.scale;
	    		var y = (position.y-yDisplacement) * this.globals.scale;
	    		
	    		var clickRadius = this.globals.scale * this.globals.clickRadius;
	        	var closestIndex = this.getClosestLabel(x);
	        	var closestPoint = this.ScreenCoords[closestIndex];

	        	var dx = x - closestPoint.x ;
	        	
	        	if (dx >= -10 && dx <= 10 && y >= closestPoint.y[1] && y <= closestPoint.y[2])
	        		return this.globals.startIndex + closestIndex;
	        	return false;
	        };

			if(data)
    			this.setData(data);

	    	if(this.Data)
	    		this.draw();
    	};     	

    //Candlestick graph
	Alice.prototype.CandleStick=function(data)
    	{
	    	this.chartType = 'CandleStick';
	    	this.barWidth = 0;
	    	this.draw = function(){
	    		if(this.Data && Object.keys(this.Data).length>1)
	    		{
	    			this.createFreshGraph();
		    		var keys = Object.keys(this.Data);
		    		var points = this.globals.plottablePoints;
		    		var startIndex = this.globals.startIndex;

		    		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;
					var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;

		    		var xStart = this.canvas.width - yAxisPadding + this.globals.scrollOffset;
		    		var separation = this.globals.scale * this.globals.xLabelSeparation;

				    var dataLimits= this.globals.globalHigh - this.globals.globalLow;
				    var displayLimits = this.canvas.height - xAxisPadding;
				    var yfactor=dataLimits/displayLimits;
				   
				    ctx.lineWidth = this.globals.scale*1;
				    ctx.strokeStyle = this.colors.negativeFontColor;
				    
				    this.barWidth = separation/3;
					var open, close, high, low, x;

					for (var i= startIndex; i<startIndex+points && i<keys.length-1; i++)
					{
						var xcoord = xStart-(i-startIndex)*separation-this.barWidth/2;
				
						var p = {};
						p["x"] = xcoord;
						p["y"] = [];
						for(var j=0; j<4; j++)
							p["y"][j] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i]][j]/yfactor)) + 0.5) <<1) >>1);
						this.ScreenCoords.push(p);
						
						x = p["x"];
						open  = p["y"][0];
						high  = p["y"][1];
						low   = p["y"][2];
						close = p["y"][3];
						if(close<=open)  				//Reversed operator since open and close are now coordinates from top 
							ctx.fillStyle = this.colors.positiveFillColor;
						else
							ctx.fillStyle = this.colors.negativeFillColor;
						
						ctx.globalAlpha = 0.5;

						ctx.beginPath();
						ctx.moveTo(x,high);
						ctx.lineTo(x,low);
						ctx.stroke();
						ctx.closePath();

						ctx.globalAlpha = 1;

						ctx.fillRect(x-this.barWidth/2, open, this.barWidth, close-open);
					}

					if(this.globals.scrollOffset)
					{
						var saveLabelState = this.globals.labelsDrawn;
						this.clearLabels();
						this.globals.labelsDrawn = saveLabelState;
					}
			    	if(this.globals.labelsDrawn)
			    		this.drawLabels();
				}
			};

			this.checkClick = function(position){
	    		var xDisplacement = this.canvas.getBoundingClientRect().left;
	    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
	    		var virtualPixelConversion = this.globals.virtualPixelConversion;

	    		var x = (position.x-xDisplacement) * this.globals.scale;
	    		var y = (position.y-yDisplacement) * this.globals.scale;
	    		
	    		var clickRadius = this.globals.scale * this.globals.clickRadius;
	        	var closestIndex = this.getClosestLabel(x);
	        	var closestPoint = this.ScreenCoords[closestIndex];

	        	var dx = x - closestPoint.x ;
	        	
	        	if (dx >= -this.barWidth && dx <= this.barWidth && y >= closestPoint.y[1] && y <= closestPoint.y[2])
	        		return this.globals.startIndex + closestIndex;
		    	return false;

	    	};

			if(data)
    			this.setData(data);

	    	if(this.Data)
	    		this.draw();
    	};    

    //Finally, add alice to the calling window to make it visible
    window.Alice = Alice;
}).call(this);
=======
(function(){

	"use strict";

	//This keeps then chart object in scope, just in case needed
	var globalChart = null;


	//The initiailization of alice, this where 
	//The canvas and context gets picked up
	//Resize functions is appended
	var Alice = function(context){
		this.canvas = context.canvas;
		this.context = context;

		window.addEventListener("resize", this.recalibrate);
		this.recalibrate();
		// var separation = this.globals.scale * this.globals.xLabelSeparation;
		// this.globals.plottablePoints = ((((availableWidth/separation)+ 0.5) << 1) >> 1);
	 	this.globals.gridsDrawn = true;
	 	this.globals.labelsDrawn = true;

	 	Alice.globalChart = this;

		return this;
	};

	Alice.prototype.chartType = null;

	//Fields that are used as configuration variables for the general graph properties
	Alice.prototype.globals = {
		//Scale variable to increase canvas density
		scale : 2,

		//Points to be drawn and density
		plottablePoints: 60,
		pointsPerLabel: 4,

		//Axes properties
		xLabelSeparation : 40,
		yLabels : 10,
		yAxisPadding : 50,
		xAxisPadding : 25,
		overflow : 5,
		labelsDrawn: true,
		gridsDrawn: true,

		//Click radius
		clickRadius: 5,

		//Scroll is done through the following value change
		startIndex: 0,

		//Each graphs configuration property. 
		//Values to be defined in the corresponsing draw function
		barWidth: 0,
		lineWidth: 0,
		candleWidth: 0,
	};

	//Color configurations
	//Name the theme like this
	Alice.prototype.theme = 'dark';

	//Define the four colors used
	Alice.prototype.colors = {
		positiveFontColor: '#333',
		negativeFontColor: '#EEE',
		positiveFillColor: '#6699FF',
		negativeFillColor: '#FF3366',
	};

	//Sample flip color function
	Alice.prototype.flipColors = function(){
		if (this.theme === 'dark')
		{
			this.theme = 'light';
			this.colors = {
				positiveFontColor: '#EEE',
				negativeFontColor: '#333',
				positiveFillColor: '#009900',
				negativeFillColor: '#F80000',
			}
		}
		else
		{
			this.theme = 'dark';
			this.colors = {
				positiveFontColor: '#333',
				negativeFontColor: '#EEE',
				positiveFillColor: '#6699FF',
				negativeFillColor: '#FF3366',
			}
		}
		this.draw();
	};
	
	//Data copy set by the setData call
	Alice.prototype.Data = [],

	//Data coordinates as plotted. This SHOULD be emptied and populated in each draw function
	Alice.prototype.ScreenCoords=[];

	// Alice.prototype.XLabels = [];
	// Alice.prototype.YLabels = [];

	//Draw grid function. NOTE: This is only the skeleton lines
	Alice.prototype.drawGrids = function(){

			var ctx = this.context;
			ctx.lineWidth = 1;
			ctx.globalAlpha = 0.1;
			ctx.strokeStyle = this.colors.negativeFontColor;

			var skipPoints = this.globals.pointsPerLabel;
			var xLabelSeparation = this.globals.scale * this.globals.xLabelSeparation;
			var yStart = this.globals.scale * this.globals.yAxisPadding;
			var xStart = this.globals.scale * this.globals.xAxisPadding;

			var availableWidth = this.canvas.width - yStart;
			var availableHeight = this.canvas.height - xStart;

			var verticalLines = availableWidth/xLabelSeparation;
			for(var i=0;i<verticalLines;i+=skipPoints)
			{
				ctx.beginPath();
				ctx.moveTo(availableWidth-(i*xLabelSeparation), 0);
				ctx.lineTo(availableWidth-(i*xLabelSeparation), availableHeight);
				ctx.stroke();
				ctx.closePath();
			}

			var horizontalLines = this.globals.yLabels;
			var increment = availableHeight/horizontalLines;
			for(var i=0;i<horizontalLines;i++)
			{
				ctx.beginPath();
				ctx.moveTo(0, availableHeight-(i*increment));
				ctx.lineTo(availableWidth, availableHeight-(i*increment));
				ctx.stroke();
				ctx.closePath();
			}
			ctx.closePath();
			ctx.globalAlpha = 1;
	};

	//Adding labels to drawn grid. 
	//NOTE Calling drawGrid before calling drawLabels makes logical sense, but is not a requirement
	Alice.prototype.drawLabels = function(){
		if(this.Data && Object.keys(this.Data).length > 1)
		{
			var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
			var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

			var xStart = this.canvas.width - yAxisPadding;
			var skipPoints = this.globals.pointsPerLabel;
			
			var separation = this.globals.scale * this.globals.xLabelSeparation;
			var fontSize = (((this.canvas.width/separation) << 1 ) >> 1);
			var fontOffset = 20;

			var ctx = this.context;	
			ctx.font= fontSize +'px sans-serif';
			var xLabels = Object.keys(this.Data);
			while(ctx.measureText(xLabels[1]).width > skipPoints * separation)
			{
				fontSize-=1;
				ctx.font= fontSize +'px sans-serif';
			}
			ctx.font= ((fontSize-2<<1)>>1) +'px sans-serif';
			ctx.fillStyle = this.colors.negativeFontColor;
			ctx.textAlign = 'center';

			for (var i = 0; i < this.globals.plottablePoints/skipPoints; i++) 
			{
				var label = xLabels[this.globals.startIndex+skipPoints*i];
				ctx.fillText(label, xStart-(i*skipPoints*separation), this.canvas.height-fontOffset);
			}
			console.log(i,' labels drawn on X-axis');

			ctx.font= ((fontSize+2<<1)>>1) +'px sans-serif';
			ctx.textAlign = 'left';
			
			var conversion = this.globals.virtualPixelConversion;
			var value = this.Data[Object.keys(this.Data)[0]];
			if(value.constructor === Array)
				value = value[value.length-1];
			var yCoord = ((((this.canvas.height-xAxisPadding-(value/conversion)) + 0.5) <<1) >>1);
			
			var latestYLabel = Math.round(value*100)/100;
			var latestYPosition = yCoord;

			var labelPadding = this.globals.scale * 5;
			var padding = 5;
			var rect = ctx.measureText(latestYLabel);
			ctx.fillRect(this.canvas.width-yAxisPadding+labelPadding-padding , latestYPosition-fontOffset/2, rect.width+2*padding, 40);

			ctx.fillStyle = this.colors.positiveFontColor;
			ctx.fillText(latestYLabel, this.canvas.width-yAxisPadding+labelPadding , latestYPosition+fontOffset);
			
			ctx.fillStyle = this.colors.negativeFontColor;
			var yRange = this.globals.globalHigh - this.globals.globalLow;
			var increment = yRange / 10;
			
			var height = this.canvas.height;
			for(var i=0;i<10;i++)
			{
				var label = Math.round(this.globals.globalHigh-i*increment);
				var yPosition = height- xAxisPadding - label/conversion;
				if ( Math.abs(yPosition - (latestYPosition+fontOffset) ) > 50)
					ctx.fillText(label, this.canvas.width-yAxisPadding+labelPadding , yPosition+fontOffset);
			}
		}
	};

	//Clear only the graph plot area
	//Call createFreshGraph if you want to clear the entire graph
	Alice.prototype.clearGrids = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,0, this.canvas.width-yAxisPadding, this.canvas.height-xAxisPadding);
		this.globals.gridsDrawn = false;
	};

	//Clear only labels
	//Call createFreshGraph if you want to clear the entire graph
	Alice.prototype.clearLabels = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,this.canvas.height-xAxisPadding+this.globals.scale, this.canvas.width, this.canvas.height);
		this.context.clearRect(this.canvas.width-yAxisPadding+this.globals.scale,0, this.canvas.width, this.canvas.height);
		this.globals.labelsDrawn = false;
	};

	//Add this as an eventListener to the resize function of the chart element/body/window
	//This is already done in the initializing function
	Alice.prototype.recalibrate = function(source){
		if (!source)
			var alice = this;
		else
			var alice = window.Alice.globalChart;

		var width = alice.canvas.width = alice.globals.scale*alice.canvas.clientWidth;
		alice.canvas.height = alice.globals.scale*alice.canvas.clientHeight;
		
		var yStart = alice.globals.scale * alice.globals.yAxisPadding;
		var availableWidth = alice.canvas.width - yStart;
		if(availableWidth < 1000)
		{
			alice.globals.clickRadius = 10;
			alice.globals.xAxisPadding = 15;
			alice.globals.yAxisPadding = 30;
			alice.globals.xLabelSeparation = 20;
			// alice.globals.plottablePoints = 25;
		}
		else
		{
			alice.globals.clickRadius = 5;
			alice.globals.xAxisPadding = 25;
			alice.globals.yAxisPadding = 50;
			alice.globals.xLabelSeparation = 25;
			// alice.globals.plottablePoints = 50;
		}

		alice.globals.plottablePoints = ((( availableWidth/(alice.globals.xLabelSeparation * alice.globals.scale)+1) <<1) >>1);
		alice.draw();
	};

	//Move to view logic since user may wish to manipulate clicked element differently
	Alice.prototype.Tooltip = {
		draw: function(){

		},//TODO Draw function for tooltip
	};
     
    //Function that sets data to be plotted
    //Also calculates the high and low  and the ratio for value limits to display limits
    //The valueLimits:display limits is called virtualPixelConversion and is used to dynamically set limits oh graph

    //Calling this will not plot the graph. Please use the draw function after setting data to plot.
    //NOTE: Draw function will be initialized only after graphType has been initialized
    Alice.prototype.setData = function(data){
    		this.Data = data;
    		var keys = Object.keys(data);
    		
    		var globalHigh = 0;
    		var globalLow = 0;
    		for (var i = 0; i < keys.length; i++)
    		{
    			var value = data[keys[i]];

    			// this.XLabels.push(keys[i]);

    			if(value.constructor === Array)
    			{	
    				if(globalHigh<value[1])
						globalHigh=value[1];
					if(!globalLow)
						globalLow=value[2];
					else if(globalLow>value[2])
						globalLow=value[2];
    			}
    			else
    			{
    				if(globalHigh<value)
						globalHigh=value;
					if(!globalLow)
						globalLow=value;
					else if(globalLow>value)
						globalLow=value;
    				
				}
			}
			this.globals.globalHigh = Math.ceil(globalHigh/100)*100;
			this.globals.globalLow = Math.floor(globalLow/100)*100;

		    var dataLimits= this.globals.globalHigh - this.globals.globalLow;
		    var displayLimits = this.canvas.height - this.globals.scale * this.globals.xAxisPadding;
			this.globals.virtualPixelConversion = dataLimits/displayLimits;

			this.globals.startIndex = 0;
    	};

    //Combined function that clears entire grid.
    //RECOMMENDED to be called at the start of draw function
    Alice.prototype.createFreshGraph = function(){
    	this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
		this.ScreenCoords = [];
    	if(this.globals.gridsDrawn)
    		this.drawGrids()
    };

    //Used to push realtime updates or corrections.
    //This will force a redraw
    Alice.prototype.updateDataByKey = function(data){
    	var key = Object.keys(data)[0];
    	this.Data[key] = data[key];
    	this.draw();
    };

    Alice.prototype.prependData = function(data){
    	// TODO to add data points to the start of the graph
    };

    //Common function across all graphs that calculates closest clicked point
    //Returns the x-index
    Alice.prototype.getClosestLabel = function(x){
	 	var nearestPoint=-1;
	 	var separation = this.globals.scale * this.globals.xLabelSeparation;

	 	var invertedXCoord= this.canvas.width - x - this.globals.yAxisPadding * this.globals.scale ;
	 	var modX = invertedXCoord % separation;
	 	
	 	if( modX < separation/2)
	 		nearestPoint=invertedXCoord-modX;
	 	else
	 		nearestPoint=invertedXCoord+modX;

	 	var index = (((nearestPoint / separation)<<1)>>1);
	 	
	 	return index;
    };

    //Scroll function used to change starting index
    //In general, scroll can be done by changing start index and redrawing
    //Keep start index within bounds
    Alice.prototype.scroll = function(dx){
    	var startIndex = this.globals.startIndex;
    	if (startIndex+dx < 0)
    	{
    		dx = -1*startIndex;
    	} 
    	else if(startIndex+dx+this.globals.plottablePoints > Object.keys(this.Data).length)
    	{
    		dx = Object.keys(this.Data).length-startIndex-this.globals.plottablePoints-1;
    	}
    	if (dx!=0)
    	{
	    	this.globals.startIndex = this.globals.startIndex + dx;
	    	this.draw();
	    }
    };
    
    Alice.prototype.draw = function (data) {
    	// Please initialize a graph type first
    };

    Alice.prototype.checkClick = function(x,y){
    	// Please initialize a graph type first
    };


    //Main logic of all plots below

    //In a nutshell, each graph type needs the following
    
    //chartType 	- String title for graph
    
    //draw    		- Function that holds the drawing logic.
    //A sample draw function should 
    //		1) Clear the graph
	//		2) Pick up all the globals axes configuration
	//		3) Iterate through this.Data and convert all the values to their corresponding display coordinates
	// 		4) Push plotted coordinates to this.ScreenCoords to be used in checkClick

    //checkClick	- Function that holds the custom drawn plot and returns the data
    //This function is meant to be used to query if given coordinates (like that of a click/touch) are within the plotted elements
    //You can used this.getClosestLabel on the x-coordinates to hunt down your required point and then used the corresponsing 
    //y-coords from this.ScreenCoords to decide if you want to accept this as a click or not.
    //If positive, then return INDEX of the clicked element.
    //this.Data[index] will give you values, if needed
    
    //Additionally, add check for data being passed and draw, if data is set

    //Line graph
    Alice.prototype.Line = function(data){
    	this.chartType = 'Line';
    	this.lineWidth = this.globals.scale*1;
    	this.draw = function(){
    		if(this.Data && Object.keys(this.Data).length>1)
    		{
    			this.createFreshGraph();
    			this.ScreenCoords = [];
	    		var keys = Object.keys(this.Data);
	    		var points = this.globals.plottablePoints;
	    		var startIndex = this.globals.startIndex;

	    		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;
				var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;

	    		var xStart = this.canvas.width - yAxisPadding;
	    		var separation = this.globals.scale * this.globals.xLabelSeparation;

			    var virtualPixelConversion=this.globals.virtualPixelConversion;

			    ctx.lineWidth = this.lineWidth;
				ctx.strokeStyle = this.colors.positiveFillColor;
				ctx.fillStyle = this.colors.positiveFillColor;
				var radius=6;

				for (var i= startIndex; i<startIndex+points && i<keys.length-1; i++)
				{
					var xcoord = xStart-(i-startIndex)*separation;
					var value = this.Data[keys[i]];
					if(value.constructor == Array)
						value = value[value.length-1];

					var value1 = this.Data[keys[i+1]];	
					if(value1.constructor == Array)
						value1 = value1[value1.length-1];	

					var p = {};
					p["x"] = xcoord;
					p["y"] = ((((this.canvas.height-xAxisPadding-(value/virtualPixelConversion)) + 0.5) <<1) >>1);
					this.ScreenCoords.push(p);
					
					var p1 = {};
					p1["x"] = xcoord-separation;
					p1["y"] = ((((this.canvas.height-xAxisPadding-(value1/virtualPixelConversion)) + 0.5) <<1) >>1);

					ctx.beginPath();

					ctx.moveTo(p.x,p.y);
					ctx.lineTo(p1.x,p1.y);
					ctx.stroke();
					
					ctx.closePath();
					ctx.beginPath();

					ctx.arc(p.x,p.y, radius, 0, 2 * Math.PI);
					ctx.fill();

					ctx.closePath();
				}

				ctx.strokeStyle = this.colors.negativeFontColor;
				ctx.globalAlpha = 0.8;

				var value = this.Data[keys[0]];
				if(value.constructor == Array)
					value = value[value.length-1];

				var firstY = ((((this.canvas.height-xAxisPadding-(value/virtualPixelConversion)) + 0.5) <<1) >>1);
				ctx.beginPath();
				ctx.moveTo(0, firstY);
				ctx.lineTo(xStart, firstY);
				ctx.stroke();
				ctx.closePath();

				ctx.globalAlpha = 1;
		    	if(this.globals.labelsDrawn)
		    		this.drawLabels();
			}

    	};

    	this.checkClick = function(position){
    		var xDisplacement = this.canvas.getBoundingClientRect().left;
    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
    		var virtualPixelConversion = this.globals.virtualPixelConversion;

    		var x = (position.x-xDisplacement) * this.globals.scale;
    		var y = (position.y-yDisplacement) * this.globals.scale;
    		
    		var clickRadius = this.globals.scale * this.globals.clickRadius;
        	var closestIndex = this.getClosestLabel(x);
        	var closestPoint = this.ScreenCoords[closestIndex];

        	var dx = x - closestPoint.x ;
        	var dy = y - closestPoint.y ;
        	if (dx * dx + dy * dy < clickRadius*clickRadius)
        		return this.globals.startIndex + closestIndex;
	    	return false;
    	};

    	if(data)
    		this.setData(data);

    	if(this.Data)
    		this.draw();
    };

    //Bar graph
	Alice.prototype.Bar=function(data)
    	{
	    	this.chartType = 'Bar';

	    	this.draw = function(){
	    		if(this.Data && Object.keys(this.Data).length>1)
	    		{
	    			this.createFreshGraph();
		    		var keys = Object.keys(this.Data);
		    		var points = this.globals.plottablePoints;
		    		var startIndex = this.globals.startIndex;

		    		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;
					var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;

		    		var xStart = this.canvas.width - yAxisPadding;
		    		var separation = this.globals.scale * this.globals.xLabelSeparation;

				    var dataLimits= this.globals.globalHigh - this.globals.globalLow;
				    var displayLimits = this.canvas.height - xAxisPadding;
				    var yfactor=dataLimits/displayLimits;
				    
				    ctx.lineWidth = this.globals.scale*1;

				    //local variables 
				    var overflow=10;
				    var open, close, high, low, x;

					for (var i= startIndex; i<startIndex+points && i<keys.length-1; i++)
					{
						var xcoord = xStart-(i-startIndex)*separation - overflow;
				
						var p = {};
						p["x"] = xcoord;
						p["y"] = [];
						for(var j=0; j<4; j++)
						{
							p["y"][j] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i]][j]/yfactor)) + 0.5) <<1) >>1);
						}
						this.ScreenCoords.push(p);
						x = p["x"];
						open  = p["y"][0];
						high  = p["y"][1];
						low   = p["y"][2];
						close = p["y"][3];
						if(close<=open)  
						{
							ctx.strokeStyle = this.colors.positiveFillColor;
							ctx.fillStyle = this.colors.positiveFillColor;	
						}				//Reversed operator since open and close are now coordinates from top 
							
						else{
							ctx.strokeStyle = this.colors.negativeFillColor;
							ctx.fillStyle = this.colors.negativeFillColor;
						}

						//Draw line at current position
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
					}

			    	if(this.globals.labelsDrawn)
			    		this.drawLabels();
				}
			};

			this.checkClick = function(position){
	    		var xDisplacement = this.canvas.getBoundingClientRect().left;
	    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
	    		var virtualPixelConversion = this.globals.virtualPixelConversion;

	    		var x = (position.x-xDisplacement) * this.globals.scale;
	    		var y = (position.y-yDisplacement) * this.globals.scale;
	    		
	    		var clickRadius = this.globals.scale * this.globals.clickRadius;
	        	var closestIndex = this.getClosestLabel(x);
	        	var closestPoint = this.ScreenCoords[closestIndex];

	        	var dx = x - closestPoint.x ;
	        	
	        	if (dx >= -10 && dx <= 10 && y >= closestPoint.y[1] && y <= closestPoint.y[2])
	        		return this.globals.startIndex + closestIndex;
	        	return false;
	        };

			if(data)
    			this.setData(data);

	    	if(this.Data)
	    		this.draw();
    	};     	

    //Candlestick graph
	Alice.prototype.CandleStick=function(data)
    	{
	    	this.chartType = 'CandleStick';
	    	this.barWidth = 0;
	    	this.draw = function(){
	    		if(this.Data && Object.keys(this.Data).length>1)
	    		{
	    			this.createFreshGraph();
		    		var keys = Object.keys(this.Data);
		    		var points = this.globals.plottablePoints;
		    		var startIndex = this.globals.startIndex;

		    		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;
					var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;

		    		var xStart = this.canvas.width - yAxisPadding;
		    		var separation = this.globals.scale * this.globals.xLabelSeparation;

				    var dataLimits= this.globals.globalHigh - this.globals.globalLow;
				    var displayLimits = this.canvas.height - xAxisPadding;
				    var yfactor=dataLimits/displayLimits;
				   
				    ctx.lineWidth = this.globals.scale*1;
				    ctx.strokeStyle = this.colors.negativeFontColor;
				    
				    this.barWidth = separation/3;
					var open, close, high, low, x;

					for (var i= startIndex; i<startIndex+points && i<keys.length-1; i++)
					{
						var xcoord = xStart-(i-startIndex)*separation-this.barWidth/2;
				
						var p = {};
						p["x"] = xcoord;
						p["y"] = [];
						for(var j=0; j<4; j++)
							p["y"][j] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i]][j]/yfactor)) + 0.5) <<1) >>1);
						this.ScreenCoords.push(p);
						
						x = p["x"];
						open  = p["y"][0];
						high  = p["y"][1];
						low   = p["y"][2];
						close = p["y"][3];
						if(close<=open)  				//Reversed operator since open and close are now coordinates from top 
							ctx.fillStyle = this.colors.positiveFillColor;
						else
							ctx.fillStyle = this.colors.negativeFillColor;
						
						ctx.globalAlpha = 0.5;

						ctx.beginPath();
						ctx.moveTo(x,high);
						ctx.lineTo(x,low);
						ctx.stroke();
						ctx.closePath();

						ctx.globalAlpha = 1;

						ctx.fillRect(x-this.barWidth/2, open, this.barWidth, close-open);
					}

			    	if(this.globals.labelsDrawn)
			    		this.drawLabels();
				}
			};

			this.checkClick = function(position){
	    		var xDisplacement = this.canvas.getBoundingClientRect().left;
	    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
	    		var virtualPixelConversion = this.globals.virtualPixelConversion;

	    		var x = (position.x-xDisplacement) * this.globals.scale;
	    		var y = (position.y-yDisplacement) * this.globals.scale;
	    		
	    		var clickRadius = this.globals.scale * this.globals.clickRadius;
	        	var closestIndex = this.getClosestLabel(x);
	        	var closestPoint = this.ScreenCoords[closestIndex];

	        	var dx = x - closestPoint.x ;
	        	
	        	if (dx >= -this.barWidth && dx <= this.barWidth && y >= closestPoint.y[1] && y <= closestPoint.y[2])
	        		return this.globals.startIndex + closestIndex;
		    	return false;

	    	};

			if(data)
    			this.setData(data);

	    	if(this.Data)
	    		this.draw();
    	};    

    //Finally, add alice to the calling window to make it visible
    window.Alice = Alice;
}).call(this);
>>>>>>> 705db426af93582b8a62c385d7447c2e28a21f37
