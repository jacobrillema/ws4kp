// pass through api requests

// http(s) modules
const http = require('http');
const https = require('https');

// url parsing
const URL = require('url');



// return an express router
module.exports = (req, res) => {
	if (!req.query.u) res.status(404);

	// parse the url
	const url = URL.parse(req.query.u);
	
	// get the protocol
	let protocol;
	if (url.protocol === 'https:') {
		protocol = https;
	} else {
		protocol = http;
	}

	// determine outgoing headers
	const headers = {};
	if (url.hostname === 'api.weather.gov') {
		headers['user-agent'] = '(WeatherStar 4000+, ws4000@netbymatt.com)';
		headers['Accept'] = 'application/vnd.noaa.dwml+xml';
	} else {
		headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36';
	}

	// get the page
	protocol.get(req.query.u, {
		headers,
	}, getRes => {
		// pull some info
		const {statusCode} = getRes;
		// test for errors
		if (statusCode !== 200) res.status(statusCode);

		// set headers
		res.header('content-type', getRes.headers['content-type']);
		// pipe to response
		getRes.pipe(res);

	}).on('error', e=>{
		console.error(e);
	});
};