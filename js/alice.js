(function(){

	"use strict";

	var globalChart = null;

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
	Alice.prototype.globals = {
		//Scale variable to increase canvas density
		scale : 2,
		plottablePoints: 60,

		pointsPerLabel: 4,
		xLabelSeparation : 40,
		yLabels : 10,
		yAxisPadding : 50,
		xAxisPadding : 25,
		overflow : 5,

		clickRadius: 5,
		startIndex: 0,

		labelsDrawn: true,
		gridsDrawn: true
	};
	
	Alice.prototype.Data = [],
	Alice.prototype.ScreenCoords=[];

	// Alice.prototype.XLabels = [];
	// Alice.prototype.YLabels = [];

	Alice.prototype.drawGrids = function(){

			var ctx = this.context;
			ctx.lineWidth = 1;
			ctx.globalAlpha = 0.1;
			ctx.strokeStyle = '#EEE';

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
			ctx.fillStyle = '#DDD';
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

			ctx.fillStyle = '#000';
			ctx.fillText(latestYLabel, this.canvas.width-yAxisPadding+labelPadding , latestYPosition+fontOffset);
			
			ctx.fillStyle = '#DDD';
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

	Alice.prototype.clearGrids = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,0, this.canvas.width-yAxisPadding, this.canvas.height-xAxisPadding);
		this.globals.gridsDrawn = false;
	};

	Alice.prototype.clearLabels = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,this.canvas.height-xAxisPadding+this.globals.scale, this.canvas.width, this.canvas.height);
		this.context.clearRect(this.canvas.width-yAxisPadding+this.globals.scale,0, this.canvas.width, this.canvas.height);
		this.globals.labelsDrawn = false;
	};

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

		alice.globals.plottablePoints = ((( availableWidth/(alice.globals.xLabelSeparation * alice.globals.scale) +0.5) <<1) >>1);
		alice.draw();
	};


	Alice.prototype.Tooltip = {
		draw: function(){

		},//TODO Draw function for tooltip
	};
     
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

    Alice.prototype.createFreshGraph = function(){
    	this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
		this.ScreenCoords = [];
    	if(this.globals.gridsDrawn)
    		this.drawGrids()
    };

    Alice.prototype.updateDataByKey = function(data){
    	var key = Object.keys(data)[0];
    	this.Data[key] = data[key];
    	this.draw();
    };

    Alice.prototype.getClosestLabel = function(x){
	 	var nearestPoint=-1;
	 	var separation = this.globals.scale * this.globals.xLabelSeparation;

	 	var invertedXCoord= this.canvas.width - x - this.globals.yAxisPadding * this.globals.scale ;
	 	var modX = invertedXCoord % separation;
	 	
	 	if( modX < separation/2)
	 		nearestPoint=invertedXCoord-modX;
	 	else
	 		nearestPoint=invertedXCoord+modX;

	 	var index = (((nearestPoint / separation)<<1)>>1) + this.globals.startIndex;
	 	
	 	return index;
    };

    Alice.prototype.scroll = function(dx){
    	var startIndex = this.globals.startIndex;
    	if (startIndex+dx >=0 && startIndex+dx+this.globals.plottablePoints < Object.keys(this.Data).length)
    	{
	    	this.globals.startIndex = this.globals.startIndex + dx;
	    	this.draw();
	    }
    };
    
    Alice.prototype.draw = function (data) {
    	if(!data)
    		data = this.Data;
    };

    Alice.prototype.checkClick = function(x,y){
    	
    };

    Alice.prototype.Line = function(data){
    	this.chartType = 'Line';
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

			    ctx.lineWidth = this.globals.scale*1;
				ctx.strokeStyle = '#6699FF';
				ctx.fillStyle = '#6699FF';
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

				ctx.strokeStyle = '#999';

				var value = this.Data[keys[0]];
				if(value.constructor == Array)
					value = value[value.length-1];

				var firstY = ((((this.canvas.height-xAxisPadding-(value/virtualPixelConversion)) + 0.5) <<1) >>1);
				ctx.beginPath();
				ctx.moveTo(0, firstY);
				ctx.lineTo(xStart, firstY);
				ctx.stroke();
				ctx.closePath();

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
        	{
        		var retData = {};
        		var key = Object.keys(this.Data)[this.globals.startIndex + closestIndex];
        		retData[key] = this.Data[key];
        		return retData;
        	}
	    	return false;
    	};

    	if(data)
    		this.setData(data);

    	if(this.Data)
    		this.draw();
    };

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
							ctx.strokeStyle = '#6699FF';
							ctx.fillStyle = "#6699FF";	
						}				//Reversed operator since open and close are now coordinates from top 
							
						else{
							ctx.strokeStyle = "#FF3366";
							ctx.fillStyle = '#FF3366';
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

	    	};

			if(data)
    			this.setData(data);

	    	if(this.Data)
	    		this.draw();
    	};     	

Alice.prototype.CandleStick=function(data)
    	{
	    	this.chartType = 'CandleStick';
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
				    ctx.strokeStyle = "#999";
				    
				    var width = separation/3;
					var open, close, high, low, x;

					for (var i= startIndex; i<startIndex+points && i<keys.length-1; i++)
					{
						var xcoord = xStart-(i-startIndex)*separation-width/2;
				
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

			    	if(this.globals.labelsDrawn)
			    		this.drawLabels();
				}
			};

			this.checkClick = function(position){
	    		var xDisplacement = this.canvas.getBoundingClientRect().left;
	    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
	    		var virtualPixelConversion = this.globals.virtualPixelConversion;

	    	};

			if(data)
    			this.setData(data);

	    	if(this.Data)
	    		this.draw();
    	};    

    window.Alice = Alice;
}).call(this);
