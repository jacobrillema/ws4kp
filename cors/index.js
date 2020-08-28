// pass through api requests

// http(s) modules
const http = require('http');
const https = require('https');

// url parsing
const URL = require('url');
const queryString = require('querystring');



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
	} else {
		headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36';
	}

	// get query paramaters if the exist
	const queryParams = Object.keys(req.query).reduce((acc, key) => {
		// skip the paramater 'u'
		if (key === 'u') return acc;
		// add the paramter to the resulting object
		acc[key] = req.query[key];
		return acc;
	},{});
	let query = queryString.encode(queryParams);
	if (query.length > 0) query = '?' + query;

	// get the page
	protocol.get(req.query.u + query, {
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