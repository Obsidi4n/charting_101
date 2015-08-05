var express = require('express');
var bodyparser = require('body-parser');
var router = express.Router();

app = express();
app.use(express.static(__dirname));

router.use(bodyparser.urlencoded({ extended: true }));

app.use('/', router); 

router.get('/',function(req,res){
	console.log('Sending response');
    res.sendFile('index.html', { root: __dirname});
});

months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

Date.prototype.limitToMarketOpen = function(){
	//For outside working hours
	hour = this.getHours();
	if(hour < 9 || hour >= 17)
	{
		if(hour < 9)
			this.setDate(this.getDate() - 1);
		this.setHours(17);
		this.setMinutes(0);
	}

	//For weekends
	if(this.getDay() === 0 || this.getDay() === 6)
	{
		while( this.getDay() != 5)
			this.setDate(this.getDate() - 1);	
		this.setHours(17);
		this.setMinutes(0);
	}
};

Date.prototype.deductTime = function (unit, measure) {
	if (measure.indexOf('min')===0)
	{
		this.setMinutes(this.getMinutes()-1*unit);
		if(this.getHours() < 9)
		{
			this.limitToMarketOpen();
			this.setMinutes(this.getMinutes()-1*unit);
		}
	}
	else if (measure.indexOf('day')===0)
		this.setDate(this.getDate()-1*unit);
	else if (measure.indexOf('week')===0)
		this.setDate(this.getDate()-7*unit);
};

Date.prototype.formatDate = function (measure) {
	return this.getDate() + ' ' + months[this.getMonth()] + ' ' + ("0"+this.getHours()).slice(-2) + ':' + ("0"+this.getMinutes()).slice(-2);
};

router.post('/dataSource',function(req,res){
	console.log('Generating data');
	console.log(req.body['date']);

	var date = new Date(req.body['date']);
	var unit = req.body['scale'].slice(0,-4);
	var measure = req.body['scale'].slice(-4);
	var count = req.body['count'];

	console.log('Units '+ unit);
	console.log('Measure '+ measure);
	console.log('Points to generate: '+count);

	labelStamp = clipTimeToScale(date, unit, measure);
	var data = {};
	var open = Math.random() * 1000;
	// globalHighest = 0;
	// globalLow = null;
	for(var i=0;i<count;i++)
	{
		high = open + Math.random() * (1000-open);  //Random number greater than open
		low = open - Math.random() * open;   		//Random number lesser than open
		close = low + Math.random() * (high-low) ;	//Random number between high and low

		var values = [open, high, low, close];
		// setGlobals(values);
		
		if(i===0)
			label = 'T';
		else if (i===1)
			label = labelStamp.formatDate(measure);
		else
		{
			labelStamp.deductTime(unit, measure);
			label = labelStamp.formatDate(measure);
		}
		// console.log(label);
		data[label] = values;
		open = close;
	}
	console.log(labelStamp);
	console.log('Data length', Object.keys(data).length)
	return res.json(data);;
});

function clipTimeToScale(date, unit, measure)
{
	date.setTime( date.getTime() + date.getTimezoneOffset()*60*1000 );
	console.log(date);
	date.setMilliseconds(0);
	date.setSeconds(0);

	//If before or after market hours
	date.limitToMarketOpen();
	
	min = date.getMinutes();
	hour = date.getHours();

	//Round to closest scale multiple
	if (measure.indexOf('min')===0)
	{
		min = min - (min%unit);
		date.setMinutes(min);
	}
	else 
	{
		date.setMinutes(0);
		if (measure.indexOf('hour')===0)
		{
			date.setHours(hour);	//Just to make sure that case does not goto else block below
		}
		else 
		{

			date.setHours(17);
			if (measure.indexOf('day')===0)
			{
				if(hour >= 9)					//Date has already been set back by a day if less then 9
					date.setDate(date.getDate() - 1);
				while(date.getDay() === 0 || date.getDay() === 6)
					date.setDate(date.getDate() - 1);
			}
			else if (measure.indexOf('week')===0)
			{
				if(date.getDay()===5)
					date.setDate(date.getDate() - 7);
				
				while(date.getDay()!=5)
					date.setDate(date.getDate() - 1);
			}
		}
	}
	console.log(date);
	return date;
}

app.listen(7896);
console.log("I'm ready, listening on 7896");