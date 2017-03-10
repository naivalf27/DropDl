// Open Heroku postgres : 
// heroku pg:psql --app dropdl

// Création des tables 
// CREATE TABLE users ( ID SERIAL PRIMARY KEY, NAME TEXT NOT NULL, PASSWORD TEXT NOT NULL, EMAIL TEXT NOT NULL);
// CREATE TABLE requests ( ID SERIAL PRIMARY KEY, TYPE_ID INTEGER NOT NULL, NAME TEXT NOT NULL, COMMENT TEXT NOT NULL, DOWNLOADED_AT INTEGER);
// CREATE TABLE request_to_users ( ID SERIAL PRIMARY KEY, USER_ID INTEGER NOT NULL, REQUEST_ID INTEGER NOT NULL, ASKED_AT INTEGER NOT NULL);
// CREATE TABLE types ( ID SERIAL PRIMARY KEY, NAME TEXT NOT NULL);

// Init types :
// INSERT INTO types (NAME) VALUES ('Film');
// INSERT INTO types (NAME) VALUES ('Série');
// INSERT INTO types (NAME) VALUES ('Musique');
// INSERT INTO types (NAME) VALUES ('Logiciel');
// INSERT INTO types (NAME) VALUES ('fla');

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
      return response.status(500).json({success: false, data: err});
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

app.post('/add/user', function (request, response) {
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
      return response.status(500).json({success: false, data: err});
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
      return response.status(500).json({success: false, data: err});
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

app.post('/up/request', function (request, response) {
  const results = [];
  var requestId = 0;
  var message = {
        'user_id': request.body._user_id,
        'request_id': request.body._request_id,
        'date':request.body._date
    };
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return response.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Request
    // const query = client.query('INSERT INTO request_to_users (USER_ID, REQUEST_ID, ASKED_AT) VALUES ($1,$2,$3);',[message['user_id'],message['request_id'],message['date']], function(err,result) {
    //   if(err) {
    //     done();
    //     console.log('Error insert request : '+err);
    //     return response.status(440).send("Error insert Request");
    //   } else {
    //     done();
    //     return response.status(200).send("Insert OK");
    //   }
    // });

    const query1 = client.query('INSERT INTO request_to_users (USER_ID, REQUEST_ID, ASKED_AT) VALUES ($1,$2,$3);',[message['user_id'],message['request_id'],message['date']], function(err,result) {
      if(err) {
        console.log('Error insert request : '+err);
        return response.status(440).send("Error insert Request");
      } else {
        requestId = result.rows[0].id;
        const query = client.query('SELECT requests.*, (SELECT TRUE) AS MY, (SELECT COUNT(*) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS NUMBER, (SELECT MIN(request_to_users.ASKED_AT) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS ASKED_AT, types.NAME as TYPE_NAME FROM requests, types WHERE requests.TYPE_ID=types.ID AND requests.ID=$1;',[requestId]);
        // Stream results back one row at a time
        query.on('row', (row) => {
          results.push(row);
        });
        // After all data is returned, close connection and return results
        query.on('end', () => {
          done();
          return response.json(results[0]);
        });
      }
    });


  });
});

app.post('/down/request', function (request, response) {
  const results = [];
  var requestId = 0;
  var message = {
        'request_user_id': request.body._request_user_id
    };
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return response.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Request
    const query = client.query('DELETE FROM request_to_users WHERE request_to_users.ID = $1;',[message['request_user_id']], function(err,result) {
      if(err) {
        done();
        console.log('Error insert request : '+err);
        return response.status(440).send("Error DELETE Request");
      } else {
        done();
        return response.status(200).send("DELETE OK");
      }
    });
  });
});

app.post('/add/request', function (request, response) {
  const results = [];
  var requestId = 0;
  var message = {
        'user_id': request.body._user_id,
        'type_id': request.body._type_id,
        'name': request.body._name,
        'comment': request.body._comment,
        'date':request.body._date
    };
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return response.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Request
    const query1 = client.query('INSERT INTO requests (TYPE_ID,NAME,COMMENT) VALUES ($1,$2,$3) RETURNING ID;', [message['type_id'],message['name'],message['comment']], function(err,result) {
      if(err) {
        console.log('Error insert request : '+err);
        return response.status(440).send("Error insert Request");
      } else {
        requestId = result.rows[0].id;
        client.query('INSERT INTO request_to_users (USER_ID, REQUEST_ID, ASKED_AT) VALUES ($1,$2,$3);',[message['user_id'],requestId,message['date']]);

        const query = client.query('SELECT requests.*, (SELECT TRUE) AS MY, (SELECT COUNT(*) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS NUMBER, (SELECT MIN(request_to_users.ASKED_AT) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS ASKED_AT, types.NAME as TYPE_NAME FROM requests, types WHERE requests.TYPE_ID=types.ID AND requests.ID=$1;',[requestId]);
        // Stream results back one row at a time
        query.on('row', (row) => {
          results.push(row);
        });
        // After all data is returned, close connection and return results
        query.on('end', () => {
          done();
          return response.json(results[0]);
        });
      }
    });
  });
});

app.get('/requests', function(request, response) {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return response.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT requests.*, (SELECT COUNT(*)=1 FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID AND request_to_users.USER_ID = $1) AS MY, (SELECT COUNT(*) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS NUMBER, (SELECT MIN(request_to_users.ASKED_AT) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS ASKED_AT, types.NAME as TYPE_NAME FROM requests, types WHERE requests.TYPE_ID=types.ID;',[request.query.user]);
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

app.get('/requests/user', function(request, response) {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return response.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT requests.*, (SELECT TRUE) AS MY, (SELECT COUNT(*) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS NUMBER, (SELECT MIN(request_to_users.ASKED_AT) FROM request_to_users WHERE request_to_users.REQUEST_ID = requests.ID) AS ASKED_AT, types.NAME as TYPE_NAME FROM request_to_users, requests, types WHERE request_to_users.USER_ID = $1 AND request_to_users.REQUEST_ID = requests.ID AND requests.TYPE_ID=types.ID;',[request.query.user]);
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

// Lancement de l'app
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

function toHex(str) {
  var hex = '';
  for(var i=0;i<str.length;i++) {
    hex += ''+str.charCodeAt(i).toString(16);
  }
  return hex;
};
function toString(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
};
