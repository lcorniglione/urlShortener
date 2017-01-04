var express = require("express");
var app = express();
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var url = "mongodb://localhost:27017/links";

app.get("/new/*", function(request, response) {
    var longURL = request.params[0];
    if (isValid(longURL)) {
        MongoClient.connect(url, function(err, db) {
            if (err) {
                response.send({
                    "Unable to connect to server": err
                });
            }
            else {
                console.log("Connected to server");
                var collection = db.collection('links');
                collection.find({
                    original_url: {
                        $eq: longURL
                    }
                }, {
                    original_url: 1,
                    short_url: 1,
                    _id: 0,
                }).toArray(function(err, document) {
                    if (err) throw err;
                    if (document.length === 0) {
                        collection.insert({
                            original_url: longURL,
                            short_url: request.protocol + '://' + request.get('host') + '/' + Math.floor(1000 + Math.random() * 9000),
                        });
                        response.send(document);
                    }
                    else {
                        response.send(document);
                    }
                })
            };
            db.close;
        });
    }
    else {
        response.send({
            "error": "Wrong url format, make sure you have a valid protocol and real site."
        });
    }

});

app.get("/*", function(request, response) {
    var numberUrl = request.params[0];
    MongoClient.connect(url, function(err, db) {
        if (err) {
            response.send({
                "Unable to connect to server": err
            });
        }
        else {
            var collection = db.collection('links');
            var short_url = request.protocol + '://' + request.get('host') + '/' + numberUrl;
            collection.find({
                short_url: {
                    $eq: short_url,
                }
            }, {
                original_url: 1,
                short_url: 1,
                _id: 0

            }).toArray(function(err, document) {
                if (err) throw err;
                if (document.length > 0) {
                    response.redirect(document[0].original_url);
                }
                else {
                    response.send({
                        "error": "This url is not on the database."
                    });
                }

            })
        }
        db.close;
    })
});

function isValid(url) {
    var reg = /^((https?):\/\/)([w|W]{3}\.)+[a-zA-Z0-9\-\.]{3,}\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
    if (reg.test(url)) {
        return true;
    }
    else {
        return false;
    }
}

app.listen(process.env.PORT || 5000);
