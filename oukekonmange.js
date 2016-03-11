var https = require('https'),
	CronJob = require('cron').CronJob;

function sendRequest(options, dataCallback) {
	var req = https.request(options, function(res) {
		console.log('STATUS:'+res.statusCode);
		console.log('HEADERS: '+ JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: '+ chunk);
			if (dataCallback) {
				dataCallback(chunk);
			}
		});
		res.on('end', function() {
			console.log('No more data in response.');
		})
	});

	req.on('error', function(e) {
		console.log('problem with request: '+ e.message);
	});

	req.end();
}

function getGETFormatRequest(params) {
	var request = "?";
	for (var key in params) {
		request += key + "=" + params[key] + "&";
	}
	request = request.substring(0,request.length-1);
	console.log(request);
	return request;
}

function getRequestOptions(requestType, args) {
	switch(requestType) {
		case 'channelsList':
			//https://slack.com/api/channels.list
			var requestParams = {
				'token': 'xoxp-15302977399-15387541457-25514325488-22699c5eb4'
			};

			return {
				hostname: 'slack.com',
				path: '/api/channels.list' + getGETFormatRequest(requestParams)
			};

			break;
		case 'command':
			var requestParams = {
				'agent' : 'webapp',
				'token': 'xoxp-15302977399-15387541457-25514325488-22699c5eb4',
				'channel': 'C0RESEEU8',
				'command': encodeURIComponent(args.command),
				'text' : encodeURIComponent(args.text)
			};

			return {
				hostname: 'slack.com',
				path: '/api/chat.command' + getGETFormatRequest(requestParams)
			};

			break;
		default:
			console.log('no request type provided');
			return undefined;
			break;
	}
}

function sendChannelsListRequest(callback){
	var requestOptions = getRequestOptions('channelsList');
	if (requestOptions) {
		sendRequest(requestOptions, function(list) {
			callback(list);
		});
	}
}

function sendCommandRequest(command, args){
	var requestOptions = getRequestOptions('command', {command: command, text: args});
	sendRequest(requestOptions);
}

var debug = false;
var choices = "Hanamura, Festins, Casa 57, Enjoy Sushi";

if (!debug) {
	var createPollCronJob = new CronJob('00 15 10 * * 1-5', function() {

			//Create poll
			sendCommandRequest('/poll', 'create oukekonmange');

			//TODO use a control workflow solution
			setTimeout(function() { 
				//add solutions
				sendCommandRequest('/poll', 'add ' + choices);
			}, 3000);

			//TODO use a control workflow solution
			setTimeout(function() { 
				//add solutions
				sendCommandRequest('/poll', 'publish');
			}, 3000);


		}, function () {
			/* This function is executed when the job stops */
			//Do nothing
		},
		true, /* Start the job right now */
		'Europe/Paris' /* Time zone of this job. */
	);

	//Trigger close cron job
	var closePollCronJob = new CronJob('00 30 11 * * 1-5', function() {

			//Close poll
			sendCommandRequest('/poll','close');

			//TODO use a control workflow solution
			setTimeout(function() { 
				//Delete poll
				sendCommandRequest('/poll','delete');
			}, 3000);
			
		}, function () {
			/* This function is executed when the job stops */
			//Do nothing
		},
		true, /* Start the job right now */
		'Europe/Paris' /* Time zone of this job. */
	);

	console.log('Jobs initialized');
}
else {
	//Do nothing
	sendChannelsListRequest(function(list){
		console.log(list);
	});
}
