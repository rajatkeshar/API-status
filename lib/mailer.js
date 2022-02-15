/*
 * @Description : Common library for sending emails
 * @Author : Rajat Kesharwani
 * @Version : 1.0
 */

const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const config = require('../config');

// Create the transporter with the required configuration for Gmail
var transporter = nodemailer.createTransport({
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        secure: false, // use SSL
        auth: {
            user: config.AUTH.USER,
            pass: config.AUTH.PASSWORD
        }
});


module.exports = function() {

    return {
        sendEmail: function(body) {
            
            var promiseA = [];
            var sendMailP = Promise.promisify(transporter.sendMail).bind(transporter);

            var message = {
                from:config.FROM,
                to: body.toEmail,
                subject: body.subject,
                html: `<b>${body.message}</b>`,
                attachments: body.attachments|| [],
                date: new Date()
            };
            
            promiseA.push(sendMailP(message));

            Promise.all(promiseA).then(function(res){
                console.log("res: ", res);
                console.log('Email Sent at', new Date());
            }).catch(function(err){
                console.log(err);
            });
        }
    };
};
