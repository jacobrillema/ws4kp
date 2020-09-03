'use strict';
// navigation handles progress, next/previous and initial load messages from the parent frame
/* globals utils, _StationInfo, STATUS */
/* globals CurrentWeather, LatestObservations, TravelForecast, RegionalForecast, LocalForecast, ExtendedForecast, Almanac */

document.addEventListener('DOMContentLoaded', () => {
	navigation.init();
});

const UNITS = {
	english: 0,
	metric: 1,
};

const navigation = (() => {
	let weatherParameters = {};
	let displays = [];
	let initialLoadDone = false;
	let currentUnits = UNITS.english;
	let playing = false;

	const init = () => {
		// set up message receive and dispatch accordingly
		window.addEventListener('message', (event) => {
		// test for trust
			if (!event.isTrusted) return;
			// get the data
			const data = JSON.parse(event.data);

			// dispatch event
			if (!data.type) return;
			switch (data.type) {
			case 'latLon':
				getWeather(data.message);
				break;

			case 'units':
				setUnits(data.message);
				break;

			case 'navButton':
				handleNavButton(data.message);
				break;

			default:
				console.error(`Unknown event ${data.type}`);
			}
		}, false);
	};

	const postMessage = (type, message = {}) => {
		const parent = window.parent;
		parent.postMessage(JSON.stringify({type, message}, window.location.origin));
	};

	const getWeather = async (latLon) => {
		// reset statuses
		initialLoadDone = false;

		// get initial weather data
		const point = await utils.weather.getPoint(latLon.lat, latLon.lon);

		// get stations
		const stations = await $.ajax({
			type: 'GET',
			url: point.properties.observationStations,
			dataType: 'json',
			crossDomain: true,
		});

		const StationId = stations.features[0].properties.stationIdentifier;

		let city = point.properties.relativeLocation.properties.city;

		if (StationId in _StationInfo) {
			city = _StationInfo[StationId].City;
			city = city.split('/')[0];
		}


		// populate the weather parameters
		weatherParameters.latitude = latLon.lat;
		weatherParameters.longitude = latLon.lon;
		weatherParameters.zoneId = point.properties.forecastZone.substr(-6);
		weatherParameters.radarId = point.properties.radarStation.substr(-3);
		weatherParameters.stationId = StationId;
		weatherParameters.weatherOffice = point.properties.cwa;
		weatherParameters.city = city;
		weatherParameters.state = point.properties.relativeLocation.properties.state;
		weatherParameters.timeZone = point.properties.relativeLocation.properties.timeZone;
		weatherParameters.forecast = point.properties.forecast;
		weatherParameters.stations = stations.features;

		// update the main process for display purposes
		postMessage('weatherParameters', weatherParameters);

		// start loading canvases if necessary
		if (displays.length === 0) {
			displays = [
				new CurrentWeather(0,'currentWeather', weatherParameters),
				new LatestObservations(1, 'latestObservations', weatherParameters),
				new TravelForecast(2, 'travelForecast', weatherParameters),
				// Regional Forecast: 0 = regional conditions, 1 = today, 2 = tomorrow
				new RegionalForecast(3, 'regionalForecast0', weatherParameters, 0),
				new RegionalForecast(4, 'regionalForecast1', weatherParameters, 1),
				new RegionalForecast(5, 'regionalForecast2', weatherParameters, 2),
				new LocalForecast(6, 'localForecast', weatherParameters),
				new ExtendedForecast(7, 'extendedForecast', weatherParameters),
				new Almanac(8, 'alamanac', weatherParameters),
			];
		} else {
			// or just call for new data if the canvases already exist
			displays.forEach(display => display.getData(weatherParameters));
		}

		// GetMonthPrecipitation(this.weatherParameters);
		// GetAirQuality3(this.weatherParameters);
		// ShowDopplerMap(this.weatherParameters);
		// GetWeatherHazards3(this.weatherParameters);
	};

	// receive a status update from a module {id, value}
	const updateStatus = (value) => {
		// skip if initial load
		if (initialLoadDone) return;
		// test for loaded status
		if (value.status !== STATUS.loaded) return;

		// display the first canvas loaded on the next scan (allows display constructors to finish loading)
		initialLoadDone = true;
		setTimeout(() => {
			hideAllCanvases();
			displays[value.id].showCanvas();
		}, 1);
		// send loaded messaged to parent
		postMessage('loaded');
	};

	const hideAllCanvases = () => {
		displays.forEach(display => display.hideCanvas());
	};

	const units = () => currentUnits;
	const setUnits = (_unit) => {
		const unit = _unit.toLowerCase();
		if (unit === 'english') {
			currentUnits = UNITS.english;
		} else {
			currentUnits = UNITS.metric;
		}
		// TODO: refresh current screen
	};

	// is playing interface
	const isPlaying = () => playing;

	// navigation message constants
	const msg = {
		response: {	// display to navigation
			previous: -1,		// already at first frame, calling function should switch to previous canvas
			inProgress: 0,		// have data to display, calling function should do nothing
			next: 1,			// end of frames reached, calling function should switch to next canvas
		},
		command: {	// navigation to display
			firstFrame: -2,
			previousFrame: -1,
			nextFrame: 1,
			lastFrame: 2,	// used when navigating backwards from the begining of the next canvas
		},
	};

	// receive naivgation messages from displays
	const displayNavMessage = (message) => {
		console.log(message);
	};

	// handle all navigation buttons
	const handleNavButton = (button) => {
		switch (button) {
		case 'playToggle':
			playing = !playing;
			postMessage('isPlaying', playing);
			break;
		default:
			console.error(`Unknown navButton ${button}`);
		}
	};

	return {
		init,
		updateStatus,
		units,
		isPlaying,
		displayNavMessage,
		msg,
	};
})();