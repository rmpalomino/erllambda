/*jslint es6, node, white */
"use strict";
var AWS = require('aws-sdk');
var config = new AWS.Config();
var erlang = require('./erlang.js');
var handler = require('etc/handler.json');

exports.handler = function(event, context) {
    /* validation of minimal handler fields */
    if( !handler ) {
        context.fail( 'handler definition invalid' ); return;
    }
    if( !handler.module ) {
        context.fail( 'handler definition missing "module"' ); return;
    }

    /* connect and/or start the erlang vm asap, since it takes a bit. */
    const creds = config.credentials;
    context.AWS_ACCESS_KEY_ID = creds.accessKeyId;
    context.AWS_SECRET_ACCESS_KEY = creds.secretAccessKey;
    context.AWS_SECURITY_TOKEN = creds.sessionToken;
    context.AWS_CREDENTIAL_EXPIRE_TIME =
        creds.expireTime
        ? Math.floor(creds.expireTime.getTime()/1000)
        : creds.expireTime;
    var env = {
        AWS_REGION: process.env.AWS_DEFAULT_REGION,
        AWS_LAMBDA_LOG_GROUP_NAME: process.env.AWS_LAMBDA_LOG_GROUP_NAME,
        AWS_LAMBDA_LOG_STREAM_NAME: process.env.AWS_LAMBDA_LOG_STREAM_NAME
    };
    erlang.connect( handler.module, handler.command, env, function(error) {
        if( error ) {
            context.fail( error ); return;
        }
        erlang.invoke( handler.module, event, context, function(error,success) {
            context.done( error, success );
        });
    });
};
