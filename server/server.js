const express = require('express');
const app = express();
const session = require('express-session');
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
const cookieParser = require("cookie-parser");
const crypto = require('crypto');
const portHTTP = process.env.PORT || "80";
const portHTTPS = process.env.PORT || "443";
const options = { key: fs.readFileSync("/etc/letsencrypt/live/italiadelfuturo.it/privkey.pem"), cert: fs.readFileSync("/etc/letsencrypt/live/italiadelfuturo.it/fullchain.pem")};
const dbconn = mysql.createConnection({ host: 'localhost', user: 'root', password: 'Idfdn2023', database: 'idf' });
//const storage = multer.diskStorage({destination: (req, file, cb) => {const percorso = "./articoli/" + parseInt(Date.now()).toString() + "/"; fs.mkdirSync(percorso,{recursive:true}); cb(null, percorso);},filename: (req, file, cb) => {cb(null, file.originalname);}});
const storage = multer.diskStorage({ destination: (req, file, cb) => { const percorso = "./articoli/"; cb(null, percorso); }, filename: (req, file, cb) => { cb(null, file.originalname); } });
const mailconn = nodemailer.createTransport({ host: "smtps.aruba.it", auth: { user: 'noreply@italiadelfuturo.it', pass: 'Idfdn2023' }, port: 465 });
const domains = ["italiadelfuturo.it", "davidenostrini.italiadelfuturo.it"];
//const redisclient = redis.createClient();
const defaultLang = "it-it"

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: "idfKey", saveUninitialized: true, resave: true }));
//app.use(session({secret: 'BerTiv2022', store: new redisStore({ host: 'localhost', port: 6379, client: redisclient, ttl: 260}), saveUninitialized: true, resave: false}));
app.use("/video", express.static(path.join(__dirname, 'video')));
app.use("/js", express.static(path.join(__dirname, 'js')));
app.use("/img", express.static(path.join(__dirname, 'immagini')));
app.use("/css", express.static(path.join(__dirname, 'css')));
app.use("/utility", express.static(path.join(__dirname, 'utility')));
app.use("/flags", express.static(path.join(__dirname, 'flags')));
app.use("/articoli", express.static(path.join(__dirname, 'articoli')));

const server = https.createServer(options, app);
dbconn.connect();
const upload = multer({ storage: storage });
module.exports = upload;
const transporter = nodemailer.createTransport(
	{
		host: "smtps.aruba.it",
		auth:
		{
			user: 'noreply@italiadelfuturo.it',
			pass: 'Idfdn2024!'
		},
		port: 465
	});

//---------------------------------------------------------------------------------------------------------------

//res.sendFile(indexFile, { root: __dirname + '/public' });

app.use('/', function (req, res, next) {
	if (req.url == "/") res.redirect('https://' + req.headers.host + "/home");
	next();
});

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/:det', function (req, res) {
	var det = req.params.det;
	var host = req.headers.host;
	if (host == domains[0]) {
		if (det == "home") res.sendFile(__dirname + "/public/index.html");
		else if (det == "homeprova") res.sendFile(__dirname + "/public/index2.html");
		else if (det == "news") res.sendFile(__dirname + "/public/news.html");
		else if (det == "subscribe") res.sendFile(__dirname + "/public/subscribe.html");
		else if (det == "trasparency") res.sendFile(__dirname + "/public/trasparency.html");
		else if (det == "segretariat") res.sendFile(__dirname + "/public/segretariat.html");
		else if (det == "contacts") res.sendFile(__dirname + "/public/contact.html");
		else if (det == "sitemap") res.sendFile(__dirname + "/sitemap.html");
		else if (det == "myarea") res.sendFile(__dirname + "/public/myarea.html");
		else if (det == "utility") res.sendFile(__dirname + "/public/index.html");
		else if (det == "login") res.sendFile(__dirname + "/public/login.html");
		else res.status(404).send("Opss! Pagina errata o accesso non consentito.");
	}
	else
	{
		res.status(404).send("Opss! Pagina errata o accesso non consentito.");
	}
});

app.get('/news/:det', function(req,res)
{
    var det = req.params.det;
	var host = req.headers.host;
	if (host == domains[0])
    {
		res.sendFile(__dirname + "/public/detailsNews.html"); //si può modificare deirettamente da qui senza nuova richiesta dal client
	}
	else
	{
		res.status(404).send("Opss! Pagina errata o accesso non consentito.");
	}	
});


app.post('/form_articolo', upload.array('allegati'), function (req, res) {
	var titolo = req.body.titolo;
	var orig = './articoli/';
	var nameFold = parseInt(Date.now()).toString();
	var dest = './articoli/' + nameFold + '/';
	fs.mkdirSync(dest);
	var rudeList = fs.readdirSync(orig);
	var files = rudeList.filter(file => fs.statSync(path.join(orig, file)).isFile());
	files.forEach(file => {
		origPath = path.join(orig, file);
		destPath = path.join(dest, file);
		fs.renameSync(origPath, destPath);
	});


	rudeList = fs.readdirSync(dest);
	const fileDoc = rudeList.filter(file => {
		var ext = path.extname(file).toLowerCase();
		return ext === '.doc' || ext === '.docx';
	});


	var command = 'python3 ./utility/wordTohtml.py ' + dest + fileDoc[0] + ' ' + dest + 'page.txt'
	exec(command);
	var query = "INSERT INTO articoli(titolo, cartella) VALUES(?, ?)";
	dbconn.query(query, [titolo, nameFold]); //posso inserire anche l'html dell'articolo nel db


	dbconn.query('SELECT nome, email FROM newsletter', function (err, rows, fields) {
		var bccList = '';
		for (var i = 0; i < rows.length; i++) {
			if (i == 0) bccList = rows[i].email;
			else bccList += ', ' + rows[i].email;
		}

		console.log(bccList);
		var mailOptions =
		{
			from: '"Italia del Futuro" <noreply@italiadelfuturo.it>',
			bcc: bccList,
			subject: 'IDF informa',
			html: '<p>Ti informiamo del nuovo articolo!</p><br><p>Puoi vederlo cliccando <a href="https://italiadelfuturo.it/news/'+ nameFold +'/">qui</a>!</p>',
		};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				return console.log('Messaggio NON inviato: ' + error);
			}
			console.log('Messaggio inviato: ' + info.response);
			res.status(200).end("Articolo salvato correttamente!");
		});
	});
});

app.post('/form_mailing', function (req, res) {
	var nome = req.body.nome.toUpperCase();
	var cognome = req.body.surname.toUpperCase();
	var email = req.body.email.toLowerCase().trim();
	var query = "INSERT INTO newsletter(nome,cognome,email) VALUES(?,?,?)";
	dbconn.query(query, [nome, cognome, email], function (err) {
		if (err) { res.status(200).end("Email già presente!"); }
		else { res.status(200).end("Email aggiunta correttamente!"); }
	});
});

app.post('/requests', function (req, res) {

	if (req.body.value == "login") {
		var e = req.body.email;
		var p = req.body.password;
		var hash = crypto.createHash('md5').update(p).digest("hex");

		dbconn.query('SELECT * FROM utenti WHERE username=? AND password=?', [e, hash], function (err, rows, fields) {
			if (rows.length > 0) {
				req.session.mail = e;
				req.session.save();
				res.send(e);
			}
			else {
				res.send('');
			}
		});
	}
	else if (req.body.value == "check") {
		if (req.session.mail) { res.send(req.session.mail); } else { res.send(''); }
	}
	else if (req.body.value == "logout") {
		req.session.destroy();
		res.send('https://italiadelfuturo.it/login/');
	}
	else if (req.body.value == "setLang") {
		if (req.body.lang == "") {
			req.session.lang = defaultLang;
		}
		else {
			req.session.lang = req.body.lang;
		}
		req.session.save();
		res.send(req.session.lang);
	}
	else if (req.body.value == "getLang") {
		if (req.session.lang) {
			res.send(req.session.lang);
		}
		else {
			res.send('');
		}
	}
	else if (req.body.val == "candidati") {
		var query = "SELECT c.id , c.nome as nome, c.cognome as cognome  , c.curriculumpdf as curriculumpdf , c.cas_giudizpdf  as cas_giudizpdf  from candidati c ";

		dbconn.query(query, function (err, rows, fields) {
			if (rows.length > 0) {

				var html = "";

				for (var i = 0; i < rows.length; i++) {
					var htmlRow = "<td>" + rows[i].nome + "</td><td>" + rows[i].cognome + "</td>" + "<td style='text-align: center;'><a href='" + rows[i].curriculumpdf + "' download><i class='fas fa-download'></i></a></td>" + "<td style='text-align: center;'><a href='" + rows[i].cas_giudizpdf + "'download><i class='fas fa-download'></i></a></td>";
					html += htmlRow;
				}
				res.send(html);
			}else{
				res.send("<b>Non sono presenti Candidati</b>");
			}
			
		});
	}
	else if (req.body.val == "bilanci") {
		var query = "SELECT b.id , b.anno as anno  , b.docpdf as docpdf  from bilanci b ";

		dbconn.query(query, function (err, rows, fields) {
			if (rows.length > 0) {

				var html = "";

				for (var i = 0; i < rows.length; i++) {
					var htmlRow = "<td>" + rows[i].anno + "</td>" + "<td style='text-align: center;'><a href='" + rows[i].docpdf + "' download><i class='fas fa-download'></i></a></td>";
					html += htmlRow;
				}
				res.send(html);
			}
			else{
				res.send("<b>Non sono presenti Bilanci</b>");
			}
			
		});
	}
	else if (req.body.val == "raccolte") {
		var query = "SELECT r.id , r.nome as nome , r.docpdf as docpdf  FROM raccolte r ";

		dbconn.query(query, function (err, rows, fields) {
			if (rows.length > 0) {

				var html = "";

				for (var i = 0; i < rows.length; i++) {
					var htmlRow = "<td>" + rows[i].nome + "</td>" + "<td style='text-align: center;'><a href='" + rows[i].docpdf + "' download><i class='fas fa-download'></i></a></td>";
					html += htmlRow;
				}
				res.send(html);
			}
			else{
				res.send("<b>Non sono presenti Raccolte Fondi</b>");
			}
			
		});
	}
	else if (req.body.val == "previewArticles")
	{
		var num = req.body.num;
		
		if (num && num == 1)
		{
			var query = "SELECT titolo,cartella FROM articoli ORDER BY dataora DESC LIMIT 1";
			dbconn.query(query, function (err, rows, fields)
			{
				const directoryPath = './articoli/' + rows[0].cartella + '/';
				const images = fs.readdirSync(directoryPath).filter(file => {return /\.(png|jpg|jpeg)$/.test(file);});
				
				var html = "<h1 class='display-4 text-color-black'>" + rows[0].titolo + "</h1><p class='lead text-color-black'>!!</p>";
				html += "<img src='" + directoryPath + images[0] + "' class='img-fluid max-height-img' alt='Immagine " + rows[0].titolo + "'><a href='/news/"+rows[0].cartella+"' class='btn btn-primary' style='margin: 1%'>Leggi di più</a><hr style='color: black;' width='100%'>";
				var pathfile = directoryPath + "page.txt";
				var page = fs.readFileSync(pathfile);
				page = page.toString().substring(0, 2000);
				html = html.replace("!!", page);
				res.send(html);
			});
		}
		else
		{
			var query = "";
			var invars = null;
			if (!num) {query = "SELECT titolo,cartella FROM articoli ORDER BY dataora DESC"; invars = [];}
			else {query = "SELECT titolo,cartella FROM articoli ORDER BY dataora DESC LIMIT " + num; invars = [num];}
			
			dbconn.query(query, invars, function (err, rows, fields)
			{
				if (rows.length > 0)
				{
					var html = "";
					for (var i = 0; i < rows.length; i++)
					{
						const directoryPath = './articoli/' + rows[i].cartella + '/';
						const images = fs.readdirSync(directoryPath).filter(file => {return /\.(png|jpg|jpeg)$/.test(file);});
						
						html += "<div class='col-md-4 mt-2'><div class='card'>";
						var pathfile = directoryPath + "page.txt";
						html += "<img src='" + directoryPath + images[0] + "' class='card-img-top max-height-img' alt='Immagine " + rows[i].titolo + " '><div class='card-body'>";
						html += "<h5 class='card-title'>" + rows[i].titolo + "</h5>";
						html += "<p class='card-text text-color-black'>!!</p> <a href='/news/"+rows[i].cartella+"' class='btn btn-primary'>Leggi di più</a></div></div></div>";
						var page = fs.readFileSync(pathfile);
						page = page.toString().substring(0, 2000);
						html = html.replace("!!", page);
					}
					res.send(html);
				}
				else
				{
					res.send("<b>ERRORE! NESSUN ARTICOLO CARICATO!</b>");
				}
			});
		}
	}
	else if (req.body.val == "liste"){

		var query = "SELECT l.id , l.comune as comune , l.descr as descr, l.img as img  from lciviche l";

		dbconn.query(query, function (err, rows, fields) {
			if (rows.length > 0) {

				var html = "";

				for (var i = 0; i < rows.length; i++) {
					if(i > 0){
						html += " <div class='row mt-4'>";
					}else{
						html += " <div class='row'>";
					}
					html+= "<div class='col'><div class='card card-segretariat shadow'><div class='card-body'><div class='row'><div class='col-8'> <h1 class='" + rows[i].comune + "'></h1>"
					html+= "<p class='card-text'>" + rows[i].descr +"</p></div>";
					html+= "<div class='col-2'><img src='"+ rows[i].img +"' alt='Placeholder' class='rounded-img float-right'></div></div></div></div></div>"
				}
				res.send(html);
			}else{
				res.send("<b>Non sono presenti Liste Civiche</b>");
			}
			
		});	
	}
	else if (req.body.val == "detNews")
	{
		var idNews = req.body.idNews;
		var query = "SELECT * FROM articoli WHERE cartella LIKE "+ idNews;
		dbconn.query(query, [idNews], function (err, rows, fields)
		{
			if (rows.length == 1)
			{
				var directoryPath = './articoli/' + rows[0].cartella + '/';
				var directoryPathImg = './../articoli/' + rows[0].cartella + '/';
				var images = fs.readdirSync(directoryPath).filter(file => {return /\.(png|jpg|jpeg)$/.test(file);});
				var html = "<img src='" + directoryPathImg + images[0] + "' class='card-img-top img-fluid' alt='Immagine di sfondo'><div class='card-body'><h5 class='card-title'>" + rows[0].titolo + "</h5><p class='card-text'>" + rows[0].titolo + "</p><hr><p>!!</p></div>";
				var articolo = fs.readFileSync(directoryPath + "page.txt", 'utf8');
				html = html.replace("!!",articolo);
				res.send(html);
			}
			else
			{
				res.send("");
			}
		});
	}
});

//---------------------------------------------------------------------------------------------------------------

http.get('*', function (req, res) {
	res.redirect('https://' + req.headers.host + req.url);
});
http.listen(portHTTP);
server.listen(portHTTPS);