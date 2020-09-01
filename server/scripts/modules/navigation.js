'use strict';
// navigation handles progress, next/previous and initial load messages from the parent frame
/* globals utils, _StationInfo, CurrentWeather, STATUS */

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

		// start loading canvases
		displays = [
			new CurrentWeather(0,'currentWeather', weatherParameters),
		];

		// GetMonthPrecipitation(this.weatherParameters);
		// GetTravelWeather(this.weatherParameters);
		// GetAirQuality3(this.weatherParameters);
		// GetRegionalStations(this.weatherParameters);
		// ShowRegionalMap(this.weatherParameters);
		// ShowRegionalMap(this.weatherParameters, true);
		// ShowRegionalMap(this.weatherParameters, false, true);
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
			displays[value.id].drawCanvas;
		}, 1);
	};

	// track units
	const units = UNITS.english;

	return {
		init,
		updateStatus,
		units,
	};
})();