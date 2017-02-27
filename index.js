// Open Heroku postgres : 
// heroku pg:psql --app dropdl

// Création des tables 
// CREATE TABLE users ( ID SERIAL PRIMARY KEY, NAME TEXT NOT NULL, PASSWORD TEXT NOT NULL, EMAIL TEXT NOT NULL);

// Dépendances
var express = require('express');
var pg = require('pg');

var app = express();

// Nécessaire pour laisser Heroku contrôler le port
//var port = process.env.PORT || 8080;
app.set('port', (process.env.PORT || 8080))

// Nécessaire pour parser les requêtes POST
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(request, response) {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM users ORDER BY id ASC;');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return response.json(results);
    });
  });
});

app.post('/add', function (request, response) {
  const results = [];
  var message = {
        'name': request.body._name,
        'password': request.body._password,
        'email':request.body._email
    };
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO users (NAME,PASSWORD,EMAIL) VALUES (\''+message['name']+'\',\''+message['password']+'\',\''+message['email']+'\');');

    const query = client.query('SELECT * FROM users ORDER BY id ASC;');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return response.json(results);
    });
  });
});

app.post('/login', function (request, response) {
  const results = [];
  var message = {
        'name': request.body._name,
        'password': request.body._password
    };
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    // SQL Query > Select Data
    const query = client.query('SELECT * FROM users WHERE users.NAME=\''+message['name']+'\';');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      if (results.length == 0) {
        return response.status(400).send("Error this name doesn't exist");
      } else if (results.length == 1) {
        if (results[0].password == message['password']) {
          return response.json(results[0]);
        } else {
          return response.status(401).send("Error password");
        }
      }
    });
  });
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
// Lancement de l'app
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
