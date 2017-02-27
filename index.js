// Dépendances
var express = require('express');
var pg = require('pg');

// Nécessaire pour laisser Heroku contrôler le port
var port = process.env.PORT || 8080;

var app = express();

// Nécessaire pour parser les requêtes POST
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/login', function (request, response) {
  console.log('debut de la methode login');
  var message = {
        'name': request.body.name_user,
        'password': request.body.password_user
    };

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    console.log('debut de la methode de connection');
    client.query('SELECT * FROM user_table WHERE name ='+message['name'], function(err, result) {
      done();
      if (err) {
        console.error(err); 
        response.send("Error " + err);
        response.status(400);
      } else { 
        if (result.rows.count == 1) {
          if (result.rows[0].password == message['password']) {
          // response.setHeader('Content-Type', 'application/json');
            response.status(200);
          }
        }
        response.status(401);
        response.render('pages/db', {results: result.rows} ); }
      });
  });
  console.log('fin de la methode login');
});

// Route affichant le contenu complet de la base de données
// app.get('/', function(req, res) {
//     var db = new sqlite3.Database('messages.db');

//     var messages = [];

// 	db.serialize(function() {
// 		db.each("SELECT messages.rowid AS id, messages.number, messages.message, messages.lat, messages.lng, messages.date, messages.androidVersion FROM messages ORDER BY id DESC", function(err, row) {
// 			if (err) {
// 				console.error(err);
// 			}
// 			else {
// 				var message = {
// 					'id': row.id,
// 					'number': row.number,
// 					'message': row.message,
// 					'lat': row.lat,
// 					'lng': row.lng,
// 					'date': row.date,
// 					'androidVersion': row.androidVersion
// 				};
// 				messages.push(message);
// 			}
// 		}, function() {
// 			res.render('index', {'messages': messages});
// 		});
// 	});
// 	db.close();
// });

// Route permettant d'enregistrer un nouveau message dans la base
// app.post('/messages', function(req, res) {
//     var db = new sqlite3.Database('messages.db');

//     var message = {
//         'number': req.body.number,
//         'message': req.body.message,
//         'lat': req.body.lat,
//         'lng': req.body.lng,
//         'date': req.body.date,
//         'androidVersion': req.body.androidVersion
//     };

//     db.run("CREATE TABLE if not exists messages (number TEXT, message TEXT, lat REAL, lng REAL, date TEXT, androidVersion TEXT)");

//     db.serialize(function() {
//         var stmt = db.prepare("INSERT INTO messages (number, message, lat, lng, date, androidVersion) VALUES(?, ?, ?, ?, ?, ?)");
//         stmt.run(message['number'], message['message'], message['lat'], message['lng'], message['date'], message['androidVersion']);
//         stmt.finalize();
//     });
//     db.close();

//     console.log(message);

//     res.setHeader('Content-Type', 'application/json');
//     res.status(201).json(message);
// });

// // Lancement de l'app
// app.listen(port, function() {
//     console.log("Running on port " + port);
// });
