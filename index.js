'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const rp = require("request-promise");
const Scheduler = require("node-schedule");

const mailer = require('./lib/mailer')();
const config = require('./config');
const IP_LIST = config.IP_LIST;
const port = 9305;

async function call(method, url_path, payload){
	let options = { 
		method: method,
		url:url_path,
		headers:{ 'Content-Type':'application/json', 'magic': '594fe0f3', 'version': '' },
		json:true,
		"timeout":120000
	};
	return await rp(options);
}

var start = async function() {
	let lastBlockHeight = 0;
	Scheduler.scheduleJob("*/1 * * * *", async function() {
        try {
			let getCurrentBlock = await call("GET", `http://${IP_LIST[0]}:${port}/api/blocks/getHeight`);
			console.log("Last & Current Block Height is: ", lastBlockHeight, getCurrentBlock);
			if(getCurrentBlock.height > lastBlockHeight) {
				lastBlockHeight = getCurrentBlock.height;
			} else {
				return Promise.map(IP_LIST, async (ip) => {
					try {
						let response = await call("GET", `http://${ip}:${port}/api/loader/status/sync`);
						if(response.success) {
							return Promise.resolve({"ip": ip, success: true});
						} else {
							return Promise.resolve({"ip": ip, success: false});
						}
					} catch (error) {
						return Promise.resolve({"ip": ip, success: false});
					}
				},{concurrency: 1}).then(function(data){
					console.log("res: ", data);
					mailer.sendEmail({toEmail: config.TO, subject: "Alert - Public Blockchain Service is Down", message: formatMessage(data)});
				}).catch(function(err){
					console.log(err);
				});
			}
        } catch (err) {
          console.trace("schedulerTasks,error:500,message:process_failer ", err);
          return;
        }
    });
}

function formatMessage(data) {
	const tableData = data.map(function(value){
		return (`<tr><td style="padding:5px">${value.ip}</td><td style="padding:5px">${(value.success)? "Running": "Down"}</td></tr>`);
	}).join('');

    let tableHeader = `<tr><th style="padding:6px">  IP ADDRESS  </th><th style="padding:6px">  STATUS  </th></tr>`;

	return `<table border=1px solid black border-collapse=collapse> ${tableHeader} ${tableData} </table>`;
}
start();
