// express
const express = require('express');
const app = express();
const port = 8080;

// cors pass through
const corsPassThru = require('./cors');

app.get('/cors', corsPassThru);

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
