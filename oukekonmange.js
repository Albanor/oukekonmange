var https = require('https'),
	CronJob = require('cron').CronJob,
	Q = require('q');

var cnst = {
	debug: false,
	choices: "Hanamura, Festins, Casa 57, Enjoy Sushi",
	token: 'xoxp-15302977399-15387541457-25514325488-22699c5eb4'
}

function sendRequest(options, dataCallback) {
	return function() {
		var deferred = Q.defer();
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
			deferred.resolve(res);
		});

		req.on('error', function(e) {
			console.log('problem with request: '+ e.message);
			deferred.reject(e);
		});

		req.end();
		return deferred.promise;
	}
}

function getGETFormatRequest(args) {
	var request = "?";
	for (var key in args) {
		request += key + "=" + args[key] + "&";
	}
	request = request.substring(0,request.length-1);
	return request;
}

function slack(slackAPIMethodName, args, dataCallback) {
	switch(slackAPIMethodName) {
		case 'channels.list':
			args.token = cnst.token;
			break;
		case 'chat.command':
			args.agent = 'webapp';
			args.token = cnst.token;
			args.channel = 'C0RESEEU8';
			args.command = encodeURIComponent(args.command);
			args.text = encodeURIComponent(args.text);
			break;
		default:
			console.log('no slack API method name provided');
			break;
	}
	var requestOptions = {
		hostname: 'slack.com',
		path: '/api/' + slackAPIMethodName + getGETFormatRequest(args)
	};

	return sendRequest(requestOptions, dataCallback);
}

if (!cnst.debug) {
	var createPollCronJob = new CronJob('00 15 10 * * 1-5', function() {

			//Defining functions to queue
			var createPoll = slack('chat.command', {command: '/poll', text: 'create oukekonmange'});
			var addChoices = slack('chat.command', {command: '/poll', text: 'add ' + cnst.choices});
			var publishPoll = slack('chat.command', {command: '/poll', text: 'publish'});

			//Chaining calls
			Q().then(createPoll).then(addChoices).then(publishPoll);

		}, function () {
			/* This function is executed when the job stops */
			//Do nothing
		},
		true, /* Start the job right now */
		'Europe/Paris' /* Time zone of this job. */
	);

	//Trigger close cron job
	var closePollCronJob = new CronJob('00 30 11 * * 1-5', function() {

			//Defining functions to queue
			var closePoll = slack('chat.command', {command: '/poll', text: 'close'});
			var deletePoll = slack('chat.command', {command: '/poll', text: 'delete'});

			//Chaining calls
			Q().then(closePoll).then(deletePoll);

			
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

	//Defining functions to queue
	var createPoll = slack('chat.command', {command: '/poll', text: 'create oukekonmange'});
	var addChoices = slack('chat.command', {command: '/poll', text: 'add ' + cnst.choices});
	var publishPoll = slack('chat.command', {command: '/poll', text: 'publish'});
	var closePoll = slack('chat.command', {command: '/poll', text: 'close'});
	var deletePoll = slack('chat.command', {command: '/poll', text: 'delete'});
	Q().then(createPoll).then(addChoices).then(publishPoll).then(closePoll).then(deletePoll);
}
