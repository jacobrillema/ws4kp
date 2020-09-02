'use strict';
// navigation handles progress, next/previous and initial load messages from the parent frame
/* globals utils, _StationInfo, STATUS */
/* globals CurrentWeather, LatestObservations, TravelForecast, RegionalForecast, LocalForecast */

// jquery for initial load
$(() => {
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

	const init = () => {
		// set up message receive and dispatch accordingly
		window.addEventListener('message', (event) => {
		// test for trust
			if (!event.isTrusted) return;
			// get the data
			const data = JSON.parse(event.data);

			// dispatch event
			if (!data.eventType) return;
			switch (data.eventType) {
			case 'latLon':
				GetWeather(data.latLon);
				break;
			default:
				console.error(`Unknown event '${data.eventType}`);
			}
		}, false);
	};

	const GetWeather = async (latLon) => {
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

		// start loading canvases if necessary
		if (displays.length === 0) {
			displays = [
				new CurrentWeather(0,'currentWeather', weatherParameters),
				new LatestObservations(1, 'latestObservations', weatherParameters),
				new TravelForecast(2, 'travelForecast', weatherParameters),
				// Regional Forecast: 0 = regional conditions, 1 = today, 2 = tomorrow
				new RegionalForecast(3, 'regionalForecast1', weatherParameters, 1),
				new RegionalForecast(4, 'regionalForecast2', weatherParameters, 2),
				new RegionalForecast(5, 'regionalForecast0', weatherParameters, 0),
				// all local (text) forecast periods
				new LocalForecast(6, 'localForecast0', weatherParameters),
			];
		} else {
			// or just call for new data if the canvases already exist
			displays.forEach(display => display.getData(weatherParameters));
		}

		// GetMonthPrecipitation(this.weatherParameters);
		// GetAirQuality3(this.weatherParameters);
		// ShowDopplerMap(this.weatherParameters);
		// GetWeatherHazards3(this.weatherParameters);
		// getExtendedForecast(this.weatherParameters);
		// getAlminacInfo(this.weatherParameters);
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
	};

	const hideAllCanvases = () => {
		displays.forEach(display => display.hideCanvas());
	};

	// TODO: track units
	const units = () => UNITS.english;

	return {
		init,
		updateStatus,
		units,
	};
})();