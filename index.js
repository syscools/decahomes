var express = require('express');
var app = express();

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

app.listen(process.env.PORT,function () {
    console.log("listening %s",process.env.PORT);
});
