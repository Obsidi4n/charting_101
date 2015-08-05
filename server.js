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
})

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

	startStamp = clipTimeToScale(date, unit+measure);
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
		if(i==0)
			data["T"] = values;
		else
			data[i] = values;

		open = close;
	}
	return res.json(data);;
});

function clipTimeToScale(date,selectedScale)
{
	date.setTime( date.getTime() + date.getTimezoneOffset()*60*1000 );
	console.log(date);
	date.setMilliseconds(0);
	date.setSeconds(0);

	min = date.getMinutes();
	hour = date.getHours();

	//If before or after market hours
	if(hour < 9 || hour >= 17)
	{
		if(hour < 9)
			date.setDate(date.getDate() - 1);
		date.setHours(17);
		date.setMinutes(0);
	}

	//For weekends
	if(date.getDay() === 0 || date.getDay() === 6)
	{
		while( date.getDay() != 5)
			date.setDate(date.getDate() - 1);	
		date.setHours(17);
		date.setMinutes(0);
	}
	
	//Round to closest scale multiple
	if (selectedScale === '15mins')
	{
		min = min - (min%15);
		date.setMinutes(min);
	}
	else if (selectedScale === '30mins')
	{
		min = min - (min%30);
		date.setMinutes(min);
	}
	else 
	{
		date.setMinutes(0);
		if (selectedScale === '1hour' || selectedScale === '4hour')
		{
			date.setHours(hour);	//Just to make sure that case does not goto else block below
		}
		else 
		{

			date.setHours(17);
			if (selectedScale === '1days')
			{
				if(hour >= 9)					//Date has already been set back by a day
					date.setDate(date.getDate() - 1);
				while(date.getDay() === 0 || date.getDay() === 6)
					date.setDate(date.getDate() - 1);
			}
			else if (selectedScale === '1week')
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