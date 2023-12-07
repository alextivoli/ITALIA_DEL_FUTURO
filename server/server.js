const express = require('express');
const app = express();
//const session = require('express-session');
//const redis = require('redis');
//const redisStore = require('connect-redis')(session);
const multer = require('multer');
const https = require('https');
const nodemailer = require('nodemailer');
const path = require('path');
const mysql = require('mysql');
const fs = require("fs");
const http = express();
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const portHTTP = process.env.PORT || "80";
const portHTTPS = process.env.PORT || "443";
const options = {key: fs.readFileSync("/etc/letsencrypt/live/italiadelfuturo.it/privkey.pem"), cert:fs.readFileSync("/etc/letsencrypt/live/italiadelfuturo.it/fullchain.pem")};
const dbconn = mysql.createConnection({host : 'localhost', user : 'root', password : 'Idfdn2023', database : 'idf'});
//const storage = multer.diskStorage({destination: (req, file, cb) => {const percorso = "./articoli/" + parseInt(Date.now()).toString() + "/"; fs.mkdirSync(percorso,{recursive:true}); cb(null, percorso);},filename: (req, file, cb) => {cb(null, file.originalname);}});
const storage = multer.diskStorage({destination: (req, file, cb) => {const percorso = "./articoli/"; cb(null, percorso);},filename: (req, file, cb) => {cb(null, file.originalname);}});
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
app.use("/utility", express.static(path.join(__dirname, 'utility')));

const server = https.createServer(options, app);
dbconn.connect();
const upload = multer({ storage: storage });
module.exports = upload;

//---------------------------------------------------------------------------------------------------------------

//res.sendFile(indexFile, { root: __dirname + '/public' });

app.use('/', function(req, res, next)
{
	if (req.url == "/") res.redirect('https://' + req.headers.host + "/home");
	next();
});

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/:det', function(req,res)
{
	var det = req.params.det;
	var host = req.headers.host;
	if (host == domains[0])
    	{
		if (det == "manageServer") res.sendFile(__dirname + "/public/manageServer.html");
		else if (det == "home") res.sendFile(__dirname + "/public/index.html");
		else if (det == "sitemap") res.sendFile(__dirname + "/sitemap.html");
		else if (det == "myarea") res.sendFile(__dirname + "/public/myarea.html");
		else if (det == "utility") res.sendFile(__dirname + "/public/index.html");
		else res.status(404).send("Opss! Pagina errata o accesso non consentito.");
	}
	else
	{
		res.status(404).send("Opss! Pagina errata o accesso non consentito.");
	}
});

app.post('/form_articolo', upload.array('allegati'), function(req, res)
{
	var titolo = req.body.titolo;
	var orig = './articoli/';
	var nameFold = parseInt(Date.now()).toString();
	var dest = './articoli/' + nameFold + '/';
	fs.mkdirSync(dest);
	var rudeList = fs.readdirSync(orig);
	var files = rudeList.filter(file => fs.statSync(path.join(orig, file)).isFile());
	files.forEach(file => 
	{
		origPath = path.join(orig, file);
		destPath = path.join(dest, file);
		fs.renameSync(origPath, destPath);
	});
	
	
	rudeList = fs.readdirSync(dest);
	const fileDoc = rudeList.filter(file =>
	{
		var ext = path.extname(file).toLowerCase();
		return ext === '.doc' || ext === '.docx';
	});
	
	
	var command = 'python3 ./utility/wordTohtml.py ' + dest + fileDoc[0] + ' ' + dest + 'page.txt'
	exec(command);
	var query = "INSERT INTO articoli(titolo, cartella) VALUES(?, ?)";
	dbconn.query(query, [titolo, nameFold]); //posso inserire anche l'html dell'articolo nel db
	res.send("Articolo salvato correttamente!");
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