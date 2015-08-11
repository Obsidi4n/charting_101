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
			this.globals.plottablePoints = 25;
		else
			this.globals.plottablePoints = 50;

		this.globals.xLabelSeparation = availableWidth/(this.globals.plottablePoints * this.globals.scale) ;
		// var separation = this.globals.scale * this.globals.xLabelSeparation;
		// this.globals.plottablePoints = ((((availableWidth/separation)+ 0.5) << 1) >> 1);
	 	
		return this;
	};

	Alice.prototype.globals = {
		//Scale variable to increase canvas density
		scale : 2,
		plottablePoints: 60,

		globalHigh: -1,
		globalLow: 0,

		xPointsPerLabel: 4,
		xLabelSeparation : 60,
		yAxisPadding : 50,
		xAxisPadding : 25,
		overflow : 5,
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

			ctx.beginPath();

			var skipPoints = this.globals.xPointsPerLabel;
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
	};

	Alice.prototype.drawLabels = function(){
		var skipPoints = this.globals.xPointsPerLabel;
		var fontSize = (((this.canvas.width/120) << 1 ) >> 1);
		var ctx = this.context;

		var xStart = this.canvas.width - this.globals.scale * this.globals.yAxisPadding;
		var xLabelHeight = this.canvas.height-this.globals.xAxisPadding/2;
		var separation = this.globals.scale * this.globals.xLabelSeparation;
			
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
		console.log(i,' labels drawn');
	};

	Alice.prototype.Tooltip = {
		draw: function(){

		},//Draw function for tooltip
	};
     
    Alice.prototype.setData = function(data){
    		this.Data = data;
    		var keys = Object.keys(data);
    		
    		var globalHigh = -1;
    		var globalLow = null;
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
			this.globals.globalHigh = globalHigh+100;
			this.globals.globalLow = globalLow-100;// > 0 ? globalLow-100 : 0;
    	};
    
    Alice.prototype.draw = function (data) {
    	if(!data)
    		data = this.Data;


    };

    Alice.prototype.checkDataRange = function(x,y){

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

			    var dataLimits= this.globals.globalHigh - this.globals.globalLow;
			    var displayLimits = this.canvas.height - xAxisPadding;
			    var yfactor=dataLimits/displayLimits;

			    ctx.lineWidth = this.globals.scale*1;
				ctx.strokeStyle = '#6699FF';
				ctx.fillStyle = '#6699FF';
				
				for (var i=0; i<points && i<keys.length-1; i++)
				{
					var xcoord = xStart-i*separation;
					
					var p = {};
					p["x"] = xcoord;
					p["y"] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i]]/yfactor)) + 0.5) <<1) >>1);
					this.ScreenCoords.push(p);
					
					var p1 = {};
					p1["x"] = xcoord-separation;
					p1["y"] = ((((this.canvas.height-xAxisPadding-(this.Data[keys[i+1]]/yfactor)) + 0.5) <<1) >>1);

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
    	this.checkDataRange = function(){

    	};
    	this.draw();
    };       

    window.Alice = Alice;
}).call(this);