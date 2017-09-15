/**************************************************************************/
/* subscribe for published sessionqueue events and process them accordingly
/**************************************************************************/
var fork = require('child_process').fork;
var redis = require('redis');

let port = process.env.REDIS_PORT;
let hostname = process.env.REDIS_HOSTNAME;
let password = process.env.REDIS_PASSWORD;

if (process.env.VCAP_SERVICES) {
    let services = JSON.parse(process.env.VCAP_SERVICES);
    port = services["rediscloud"][0].credentials.port;
    hostname = services["rediscloud"][0].credentials.hostname;
    password = services["rediscloud"][0].credentials.password;
} 

if (!port || !hostname || !password) {
    console.log("cannot proceed");
    process.exit(1);
}

var client = redis.createClient(
    port,
    hostname,
    { retry_max_delay:10000, auth_pass:password }
);

client.retry_delay = 5000;

client.on('error',function (error) {
    console.log("ERROR -> " + error);
    
});

client.on('reconnecting',function () {
    console.log("reconnection ...");
});

client.on('end',function () {
    console.log("BYE");
});

client.on('connect',function () {
    console.log("** connected **");

    client.on('message',function (channel,message) {
        if (channel == 'sessionqueue') {
            console.log(channel + ' --> ' + message);
            var params = message.split(' ');
            var inputf = params[0];
            var outputf = params[1];
            var dim = inputf.split('_').slice(-1)[0];
            
            var child = fork('/home/smartshell/bin/tty2js.js',[inputf,outputf,'-s',dim]);
            /*
            client.rpush('sessions',message,function (e,reply) {

            });
            */
        }
    });

    client.subscribe('sessionqueue');
});

client.get('game',(err,reply) => {
    console.log(reply);
});

process.on("SIGINT",() => {
    console.log("**goodbye**");
    client.quit();
});

process.on("SIGTERM",() => {
    console.log("**good-bye**");
    client.quit();
});
