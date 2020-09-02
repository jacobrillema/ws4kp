// provide shared data for the textual local forecasts

/* globals utils, navigation, UNITS */

// a shared global object is used to handle the data for all instances of local forecasts
// eslint-disable-next-line no-unused-vars
const LocalForecastData = (() => {
	let dataPromise;
	let lastWeatherParameters;

	// update the data by providing weatherParamaters
	const updateData = (weatherParameters) => {
		// test for new data comparing weather paramaters
		if (utils.object.shallowEqual(lastWeatherParameters, weatherParameters)) return dataPromise;
		// update the promise by calling get data
		lastWeatherParameters = weatherParameters;
		dataPromise = getData(weatherParameters);
		return dataPromise;
	};

	const getData = async (weatherParameters) => {

	};





	// return the data promise so everyone gets the same thing at the same time
	const getDataPromise = () => dataPromise;

	return {
		updateData,
		getDataPromise,
	};
})();