const express = require('express');
const app = express();
//const session = require('express-session');
//const redis = require('redis');
//const redisStore = require('connect-redis')(session);
const https = require('https');
const nodemailer = require('nodemailer');
const path = require('path');
const mysql = require('mysql');
const fs = require("fs");
const http = express();
const bodyParser = require('body-parser');
const portHTTP = process.env.PORT || "80";
const portHTTPS = process.env.PORT || "443";
const options = {key: fs.readFileSync("/etc/letsencrypt/live/italiadelfuturo.it/privkey.pem"), cert:fs.readFileSync("/etc/letsencrypt/live/italiadelfuturo.it/fullchain.pem")};
//const dbconn = mysql.createConnection({host : 'localhost', user : 'root', password : 'Matisse2022', database : 'farnesecaffe'});
const mailconn = nodemailer.createTransport({host: "smtps.aruba.it", auth: {user: 'noreply@italiadelfuturo.it', pass: 'Idfdn2023'}, port: 465});
const domains = ["italiadelfuturo.it"];
//const redisclient = redis.createClient();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(session({secret: 'BerTiv2022', store: new redisStore({ host: 'localhost', port: 6379, client: redisclient, ttl: 260}), saveUninitialized: true, resave: false}));
app.use("/video", express.static(path.join(__dirname, 'video')));
app.use("/js", express.static(path.join(__dirname, 'js')));
app.use("/img", express.static(path.join(__dirname, 'immagini')));
app.use("/css", express.static(path.join(__dirname, 'css')));

const server = https.createServer(options, app);
//dbconn.connect();

//---------------------------------------------------------------------------------------------------------------

//res.sendFile(indexFile, { root: __dirname + '/public' });

app.use('/', function(req, res, next)
{
	if (req.url == "/") res.redirect('https://' + req.headers.host + "/home");
	next();
});

app.use("/", express.static(path.join(__dirname, 'public')));

//app.get('/', function(req,res)
//{
	//res.sendFile(__dirname + "/public/index.html");
	//res.redirect('https://' + req.headers.host + "/home");
//});

app.get('/:det', function(req,res)
{
	var det = req.params.det;
	var host = req.headers.host;
	if (host == domains[0])
    	{
		if (det == "manageServer") res.sendFile(__dirname + "/public/manageServer.html");
		else if (det == "home") res.sendFile(__dirname + "/public/index.html");
		else if (det == "sitemap") res.sendFile(__dirname + "/sitemap.html");
		else res.status(404).send("Opss! Pagina errata o accesso non consentito.");
	}
	else
	{
		res.status(404).send("Opss! Pagina errata o accesso non consentito.");
	}
});

app.post('/cookieRequest', function(req,res)
{
	var data = req.body;
	var sql = "insert into preferencesCookie(publicIP, detail) values(?,?)";
	dbconn.query(sql,[data.ipaddr,data.pref]);
	res.send("ok");
});

app.post('/session', function(req,res)
{
	if(req.session.lang == undefined)
	{ 
		req.session.lang = "it-it";
	}
	
	// req=checkLangSession(req);
	var cod = req.body.code;
	if (cod == 1)
	{
		res.send(req.session.lang);
	}
	if (cod == 2)
	{
		req.session.lang = req.body.lang;
		res.send("ok");
	}
});

app.post('/requests', function(req,res)
{
});

//---------------------------------------------------------------------------------------------------------------

http.get('*',function(req, res)
{ 
	res.redirect('https://' + req.headers.host + req.url);
});
http.listen(portHTTP);
server.listen(portHTTPS);