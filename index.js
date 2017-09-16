var express = require('express');
var app = express();
var exec = require('child_process').exec;
var redis = require('redis');

let redis_port = process.env.REDIS_PORT;
let redis_hostname = process.env.REDIS_HOSTNAME;
let redis_password = process.env.REDIS_PASSWORD;

if (process.env.VCAP_SERVICES) {
    let services = JSON.parse(process.env.VCAP_SERVICES);
    redis_port = services["rediscloud"][0].credentials.port;
    redis_hostname = services["rediscloud"][0].credentials.hostname;
    redis_password = services["rediscloud"][0].credentials.password;
}

if (!redis_port || !redis_hostname || !redis_password) {
    console.log("cannot proceed");
    process.exit(1);
}

var client = redis.createClient(
    redis_port,
    redis_hostname,
    { retry_max_delay:10000, auth_pass:redis_password }
);

client.retry_delay = 5000;

app.use('/', express.static(__dirname + '/public'));

app.get('/env', function (req,res) {
    var html = "<ul>";
    for (x in process.env) {
        var elem = `<li>${x} = ${process.env[x]}</li>`;
        html += elem;
    }
    html += "</ul>";
    res.send(html);
});

app.get('/node',function (req,res) {
    exec('/home/vcap/app/vendor/node/bin/node --version', function callback(error, stdout, stderr){
	if (error) { 
	    res.send(error);
            console.log(error);
        } else {
            res.send(stdout);
        }
    });
});

app.get('/get/:key', function (req, res) {
    console.log("GET /get/" + req.params.key);

    client.get(req.params.key,(err,reply) => {
        if (reply != null) {
            console.log(reply);
            res.send(reply);
        } else {
            res.send("key not found");
        }
    });
});

let port = process.env.PORT ? process.env.PORT : 6379;
app.listen(port,function () {
    console.log("listening %s",port);
});
