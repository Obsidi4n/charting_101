var express = require('express');
var bodyparser = require('body-parser');
var router = express.Router();

app = express();
app.use(express.static(__dirname));


var server = app.listen(7896);
var io = require('socket.io').listen(server);

var realtime, latestSentData;
var globalLimit = 1000;

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
	else if (measure.indexOf('hour')===0)
	{
		this.setHours(this.getHours()-1*unit);
		if (unit==4 && this.getHours()==8)
			this.setHours(9)
		else if (this.getHours()<9)
			this.limitToMarketOpen()
	}
	else if (measure.indexOf('day')===0)
	{
		this.setDate(this.getDate()-1*unit);
		this.limitToMarketOpen();
	}
	else if (measure.indexOf('week')===0)
		this.setDate(this.getDate()-7*unit);
};


Date.prototype.formatDate = function (measure) {
	time = ("0"+this.getHours()).slice(-2) + ':' + ("0"+this.getMinutes()).slice(-2);
	return time + ' ' + this.getDate() + ' ' + months[this.getMonth()] + ' ' + this.getFullYear();
};

function clipTimeToScale(date, unit, measure)
{
	date.setTime( date.getTime() + date.getTimezoneOffset()*60*1000 );
	console.log("Before clipping",date);
	date.setMilliseconds(0);
	date.setSeconds(0);

	//If before or after market hours
	date.limitToMarketOpen();
	console.log("After limiting",date);
	min = date.getMinutes();

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
			hour = date.getHours();
			hour = hour - (hour%unit);
			date.setHours(hour);	//Just to make sure that case does not goto else block below
		}
		else 
		{
			hour = date.getHours();
			date.setHours(17);
			if (measure.indexOf('day')===0)
			{
				if(hour >= 9 && hour < 17 )					//Date has already been set back by a day if less then 9
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
	console.log("After clipping", date);
	return date;
}

router.post('/dataSource',function(req,res){
	console.log('Generating data');
	// console.log(req.body['date']);

	var date = new Date(req.body['date']);
	var unit = req.body['scale'].replace(/\D/g, '');			//Replace all non-numerals with ''
	var measure = req.body['scale'].replace(/[^a-z]/gi, '');	//Replace all non-alphabets with ''
	var count = req.body['count'];

	console.log('Units '+ unit + '. Measure '+ measure);
	// console.log('Points to generate: '+count);

	labelStamp = clipTimeToScale(date, unit, measure);
	var data = {};
	var close = Math.random() * 1000;
	// globalHighest = 0;
	// globalLow = null;
	for(var i=0;i<count;i++)
	{
		high = close + Math.random() * (1000-close);  //Random number greater than close
		low = close - Math.random() * close;   		//Random number lesser than open
		open = low + Math.random() * (high-low) ;	//Random number between high and low

		var values = [open, high, low, close];
		// setGlobals(values);
		
		if(i===0)
		{
			latestSentData = values;
			label = 'T';
		}
		else if (i===1)
			label = labelStamp.formatDate(measure);
		else
		{
			labelStamp.deductTime(unit, measure);
			label = labelStamp.formatDate(measure);
		}
		// console.log(label);
		data[label] = values;
		close = open;
	}
	console.log(labelStamp);
	console.log('Data length', Object.keys(data).length);

	return res.json(data);;
});

function streamer(){ 
	var newRate = Math.random() * 1000;
	if(newRate > latestSentData[1])
		latestSentData[1] = newRate;
	else if (newRate < latestSentData[2])
		latestSentData[2] = newRate;
	latestSentData[3] = newRate;

	console.log(latestSentData);
	io.emit('realtime', {'T': latestSentData} );
}

router.get('/turnOnStream', function(req,res){
	if (realtime && realtime._repeat)
		clearInterval(realtime);
	else
		realtime = setInterval(streamer, 3000);
	var response = 'Stream on: ' + realtime._repeat;
	return res.send(response);
});

var users = 0;

io.on('connection', function(socket){
	users++;
  	console.log('Mazel tov! Someone connected. Users left: ', users);
  socket.on('disconnect', function(){
  	users--;
    console.log('Someone doesnt like their coffee black. Users left: ', users);
  });
});

console.log("All cool! I'm ready and listening on 7896");
