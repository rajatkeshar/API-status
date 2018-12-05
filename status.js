'use strict';

var request = require('request');
var mailer = require('./lib/mailer')();
var config = require('./config');

const URL = config.URL;
const INTERVAL = parseInt(config.INTERVAL); // 5 minuts interval
const EMAIL = config.TO;
const SUBJECT = config.SUBJECT;

async function call(method, url_path, payload, cb){
	return new Promise((resolve, reject) => {
		var options = {
			method: method,
			url: URL + '' + url_path,
			headers:{
				'Content-Type':'application/json',
				'magic': '594fe0f3',
  				'version': ''
			},
			body: JSON.stringify(payload)
		};
		function callback(error, response, body) {
			if(error) return reject(error);
			try {
				// JSON.parse() can throw an exception if not valid JSON
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		}
		request(options, callback);
	});
}

var start = async function() {
	var current = await call('get', '/api/blocks/getHeight');

	console.log("Current Block Height is: ", current.height);

	setInterval(async function(){
		var next = await call('get', '/api/blocks/getHeight');
		if(next.height > current.height) {
			console.log("Current Block Height is: ", next.height);
			current = next;
		} else {
			var MSGBODY = "Something went wrong on IP: "+ config.IP +" !! Block is not syncing yet!";;
			console.log(MSGBODY);
			mailer.sendEmail(EMAIL, SUBJECT, MSGBODY, function(info) {
				console.log(info);
			});
		}
	}, INTERVAL);
}

start();
