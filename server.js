var express = require('express');
app = express();

app.get('/',function(req,res){
	console.log('Sending response');
    res.sendFile('index.html', { root: __dirname});
})
app.use(express.static(__dirname));

app.listen(7896);
console.log("I'm ready, listening on 7896");