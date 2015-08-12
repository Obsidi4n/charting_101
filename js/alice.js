(function(){

	"use strict";

	var Alice = function(context){
		this.canvas = context.canvas;
		this.context = context;

		var width = this.canvas.width = this.globals.scale*this.canvas.clientWidth;
		this.canvas.height = this.globals.scale*this.canvas.clientHeight;
		
		var yStart = this.globals.scale * this.globals.yAxisPadding;
		var availableWidth = this.canvas.width - yStart;
		if(availableWidth < 1000)
		{
			this.globals.clickRadius = 10;
			this.globals.plottablePoints = 25;
		}
		else
		{
			this.globals.clickRadius = 5;
			this.globals.plottablePoints = 50;
		}

		this.globals.xLabelSeparation = ((( availableWidth/(this.globals.plottablePoints * this.globals.scale) +0.5) <<1) >>1) ;
		// var separation = this.globals.scale * this.globals.xLabelSeparation;
		// this.globals.plottablePoints = ((((availableWidth/separation)+ 0.5) << 1) >> 1);
	 	this.globals.gridDrawn = false;
	 	this.globals.labelsDrawn = false;
		return this;
	};

	Alice.prototype.globals = {
		//Scale variable to increase canvas density
		scale : 2,
		plottablePoints: 60,

		pointsPerLabel: 4,
		xLabelSeparation : 60,
		yAxisPadding : 50,
		xAxisPadding : 25,
		overflow : 5,

		clickRadius: 5,
	};
	
	Alice.prototype.Data = [],
	Alice.prototype.ScreenCoords=[];

	Alice.prototype.XLabels = [];
	Alice.prototype.YLabels = [];

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

			var horizontalLines = availableHeight/xLabelSeparation;
			for(var i=0;i<horizontalLines;i+=skipPoints)
			{
				ctx.beginPath();
				ctx.moveTo(0, availableHeight-(i*xLabelSeparation));
				ctx.lineTo(availableWidth, availableHeight-(i*xLabelSeparation));
				ctx.stroke();
				ctx.closePath();
			}
			ctx.closePath();
			ctx.globalAlpha = 1;

			this.globals.gridDrawn = true;
	};

	Alice.prototype.drawLabels = function(){
		if(this.Data && Object.keys(this.Data).length > 1)
		{
			var skipPoints = this.globals.pointsPerLabel;
			var fontSize = (((this.canvas.width/120) << 1 ) >> 1);

			var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
			var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

			var xStart = this.canvas.width - yAxisPadding;
			var xLabelHeight = this.canvas.height-xAxisPadding/2;
			var separation = this.globals.scale * this.globals.xLabelSeparation;

			var ctx = this.context;	
			ctx.font= fontSize +'px sans-serif';
			while(ctx.measureText(this.XLabels[1]).width > skipPoints * separation)
			{
				fontSize-=0.1;
				ctx.font= fontSize +'px sans-serif';
			}
			ctx.font= ((fontSize<<1)>>1) +'px sans-serif';
			ctx.fillStyle = '#DDD';
			ctx.textAlign = 'center';

			for (var i = 0; i < this.globals.plottablePoints/skipPoints; i++) 
			{
				var label = this.XLabels[skipPoints*i];
				ctx.fillText(label, xStart-(i*skipPoints*separation), xLabelHeight);
			}
			console.log(i,' labels drawn on X-axis');

			ctx.textAlign = 'left';
			var currentYLabel = Math.round(this.Data[Object.keys(this.Data)[0]]*100)/100;
			var currentYPosition = this.ScreenCoords[0].y;

			var labelPadding = this.globals.scale * 5;
			var padding = 5;
			var rect = ctx.measureText(currentYLabel);
			ctx.fillRect(this.canvas.width-yAxisPadding+labelPadding-padding , currentYPosition-padding-20, rect.width+2*padding, 40);

			ctx.fillStyle = '#000';
			ctx.fillText(currentYLabel, this.canvas.width-yAxisPadding+labelPadding , currentYPosition);
			
			ctx.fillStyle = '#DDD';
			var yRange = this.globals.globalHigh - this.globals.globalLow;
			var increment = yRange / 10;
			var conversion = this.globals.virtualPixelConversion;
			var height = this.canvas.height;
			for(var i=0;i<11;i++)
			{
				var label = Math.round(this.globals.globalHigh-i*increment);
				if ( Math.abs(label-currentYLabel) > 45)
					ctx.fillText(label, this.canvas.width-yAxisPadding+labelPadding , height- xAxisPadding - label/conversion);
			}
			this.globals.labelsDrawn = true;
		}
	};

	Alice.prototype.clearGrids = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,0, this.canvas.width-yAxisPadding, this.canvas.height-xAxisPadding);
		this.globals.gridDrawn = false;
	};

	Alice.prototype.clearLabels = function(){
		var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;
		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;

		this.context.clearRect(0,this.canvas.height+this.globals.scale, this.canvas.width, this.canvas.height);
		this.context.clearRect(this.canvas.width-yAxisPadding+this.globals.scale,0, this.canvas.width, this.canvas.height);
		this.globals.labelsDrawn = false;
	}

	Alice.prototype.Tooltip = {
		draw: function(){

		},//Draw function for tooltip
	};
     
    Alice.prototype.setData = function(data){
    		this.Data = data;
    		var keys = Object.keys(data);
    		
    		var globalHigh = 0;
    		var globalLow = 0;
    		for (var i = 0; i < keys.length; i++)
    		{
    			var value = data[keys[i]];

    			this.XLabels.push(keys[i]);

    			if(value.constructor === Array)
    			{	
    				if(i===0)
    					this.YLabels.push(value[-1]);
    				if(globalHigh<value[1])
						globalHigh=value[1];
					if(!globalLow)
						globalLow=value[2];
					else if(globalLow>value[2])
						globalLow=value[2];
    			}
    			else
    			{
    				if(i===0)
    					this.YLabels.push(value);
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
		    var displayLimits = this.canvas.height - this.globals.xAxisPadding;
			this.globals.virtualPixelConversion = dataLimits/displayLimits;
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

	 	var index = (((nearestPoint / separation)<<1)>>1);
	 	
	 	return index;
    };
    
    Alice.prototype.draw = function (data) {
    	if(!data)
    		data = this.Data;
    };

    Alice.prototype.checkClick = function(x,y){
    	
    };

    Alice.prototype.Line = function(data){
    	console.log('Line');
    	this.draw = function(){
    		if(this.Data && Object.keys(this.Data).length>1)
    		{
	    		var keys = Object.keys(this.Data);
	    		var points = this.globals.plottablePoints;

	    		var yAxisPadding = this.globals.scale * this.globals.yAxisPadding;
				var xAxisPadding = this.globals.scale * this.globals.xAxisPadding;

	    		var xStart = this.canvas.width - yAxisPadding;
	    		var separation = this.globals.scale * this.globals.xLabelSeparation;

			    var virtualPixelConversion=this.globals.virtualPixelConversion;

			    ctx.lineWidth = this.globals.scale*1;
				ctx.strokeStyle = '#6699FF';
				ctx.fillStyle = '#6699FF';
				
				for (var i=0; i<points && i<keys.length-1; i++)
				{
					var xcoord = xStart-i*separation;
					
					var p = {};
					p["x"] = xcoord;
					p["y"] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i]]/virtualPixelConversion)) + 0.5) <<1) >>1);
					this.ScreenCoords.push(p);
					
					var p1 = {};
					p1["x"] = xcoord-separation;
					p1["y"] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i+1]]/virtualPixelConversion)) + 0.5) <<1) >>1);

					ctx.beginPath();

					ctx.moveTo(p.x,p.y);
					ctx.lineTo(p1.x,p1.y);
					ctx.stroke();
					
					ctx.closePath();
					ctx.beginPath();

					var radius=6;
					ctx.arc(p.x,p.y, radius, 0, 2 * Math.PI);
					ctx.fill();

					ctx.closePath();
				}

				ctx.strokeStyle = '#999';
				var firstY = this.ScreenCoords[0].y;
				ctx.beginPath();
				ctx.moveTo(0, firstY);
				ctx.lineTo(xStart, firstY);
				ctx.stroke();
				ctx.closePath();
			}

    	};
    	this.checkClick = function(position){
    		var xDisplacement = this.canvas.getBoundingClientRect().left;
    		var yDisplacement = this.canvas.getBoundingClientRect().top	;
    		var virtualPixelConversion = this.globals.virtualPixelConversion;

    		var x = (position.x-xDisplacement) * this.globals.scale;
    		var y = (position.y-yDisplacement) * this.globals.scale;
    		
    		var clickRadius = this.globals.scale * this.globals.clickRadius;
	    	// for (var i = 0; i < this.ScreenCoords.length; i++) 
	     //    {
	        	// var point = this.ScreenCoords[i];
	        	var closestIndex = this.getClosestLabel(x);
	        	var closestPoint = this.ScreenCoords[closestIndex];

	        	var dx = x - closestPoint.x ;
	        	var dy = y - closestPoint.y ;
	        	if (dx * dx + dy * dy < clickRadius*clickRadius)
	        	{
	        		var retData = {};
	        		var key = Object.keys(this.Data)[closestIndex];
	        		retData[key] = this.Data[key];
	        		return retData;
	        	}
	    	// }
	    	return false;

    	};

    	if(data)
    		this.setData(data);

    	if (this.Data)
    		this.draw();
    };       

    window.Alice = Alice;
}).call(this);