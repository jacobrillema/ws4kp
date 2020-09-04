// express
const express = require('express');
const app = express();
const port = 8080;
const path = require('path');

// template engine
app.set('view engine', 'ejs');

// cors pass through
const corsPassThru = require('./cors');
const radarPassThru = require('./cors/radar');

// cors pass-thru to api.weather.gov
app.get('/stations/*', corsPassThru);
app.get('/Conus/*', radarPassThru);


const index = (req, res) => {
	res.render(path.join(__dirname, 'views/index'), {
		production: false,
	});
};
const twc3 = (req, res) => {
	res.render(path.join(__dirname, 'views/twc3'), {
		production: false,
	});
};

// two html pages
app.get('/index.html', index);
app.get('/', index);
app.get('/twc3.html', twc3);

// fallback
app.get('*', express.static('./server'));

const server = app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

// graceful shutdown
process.on('SIGINT', () => {
	server.close(()=> {
		console.log('Server closed');
	});
});
