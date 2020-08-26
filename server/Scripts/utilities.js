'use strict';
// radar utilities

/* globals _Units, Units */

// ****************************** load images *********************************
// load an image from a blob or url
const loadImg = (imgData) => {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = (e) => {
			resolve(e.target);
		};
		if (imgData instanceof Blob) {
			img.src = window.URL.createObjectURL(imgData);
		} else {
			img.src = imgData;
		}
	});
};

// async version of SuperGif
const SuperGifAsync = (e) => {
	return new Promise(resolve => {
		const gif = new SuperGif(e);
		gif.load(() => resolve(gif));
	});
};

// *********************************** unit conversions ***********************

Math.round2 = (value, decimals) => Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);

const ConvertMphToKph = (Mph) => Math.round(parseFloat(Mph) * 1.60934);
const ConvertKphToMph = (Kph) => Math.round(parseFloat(Kph) / 1.60934);
const ConvertCelsiusToFahrenheit = (Celsius) => Math.round(parseFloat(Celsius) * 9 / 5 + 32);
const ConvertFahrenheitToCelsius = (Fahrenheit) => Math.round2(((parseFloat(Fahrenheit) - 32) * 5) / 9, 1);
const ConvertMilesToKilometers = (Miles) => Math.round(parseFloat(Miles) * 1.60934);
const ConvertKilometersToMiles = (Kilometers) => Math.round(parseFloat(Kilometers) / 1.60934);
const ConvertFeetToMeters = (Feet) => Math.round(parseFloat(Feet) * 0.3048);
const ConvertMetersToFeet = (Meters) => Math.round(parseFloat(Meters) / 0.3048);
const ConvertInchesToCentimeters = (Inches) => Math.round2(parseFloat(Inches) * 2.54, 2);
const ConvertPascalToInHg = (Pascal) => Math.round2(parseFloat(Pascal)*0.0002953,2);

const CalculateRelativeHumidity = (Temperature, DewPoint) => {
	const T = parseFloat(Temperature);
	const TD = parseFloat(DewPoint);
	return Math.round(100 * (Math.exp((17.625 * TD) / (243.04 + TD)) / Math.exp((17.625 * T) / (243.04 + T))));
};

const CalculateHeatIndex = (Temperature, RelativeHumidity) => {
	// See: http://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
	const T = parseFloat(Temperature);
	const RH = parseFloat(RelativeHumidity);
	let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));
	let ADJUSTMENT;

	if (T >= 80) {
		HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;

		if (RH < 13 && (T > 80 && T < 112)) {
			ADJUSTMENT = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
			HI -= ADJUSTMENT;
		} else if (RH > 85 && (T > 80 && T < 87)) {
			ADJUSTMENT = ((RH - 85) / 10) * ((87 - T) / 5);
			HI += ADJUSTMENT;
		}
	}

	if (HI < Temperature) {
		HI = Temperature;
	}

	return Math.round(HI);
};

const CalculateWindChill = (Temperature, WindSpeed) => {
	// See: http://www.calculator.net/wind-chill-calculator.html

	if (WindSpeed === '0' || WindSpeed === 'Calm' || WindSpeed === 'NA') {
		return '';
	}

	const T = parseFloat(Temperature);
	const V = parseFloat(WindSpeed);

	return Math.round(35.74 + (0.6215 * T) - (35.75 * Math.pow(V, 0.16)) + (0.4275 * T * Math.pow(V, 0.16)));
};

// wind direction
const ConvertDirectionToNSEW = (Direction) => {
	const val = Math.floor((Direction / 22.5) + 0.5);
	const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
	return arr[(val % 16)];
};

// ********************************* date functions ***************************
const GetDateFromUTC = (date, utc) => {
	const time = utc.split(':');
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), time[0], time[1], 0));
};

const GetTimeZoneOffsetFromUTC = (timezone) => {
	switch (timezone)
	{
	case 'EST':
		return -5;
	case 'EDT':
		return -4;
	case 'CST':
		return -6;
	case 'CDT':
		return -5;
	case 'MST':
		return -7;
	case 'MDT':
		return -6;
	case 'PST':
		return -8;
	case 'PDT':
		return -7;
	case 'AST':
	case 'AKST':
		return -9;
	case 'ADT':
	case 'AKDT':
		return -8;
	case 'HST':
		return -10;
	case 'HDT':
		return -9;
	default:
		return null;
	}
};

Date.prototype.getTimeZone = function ()
{
	const tz = this.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];

	if (tz === null){
		switch (this.toTimeString().split(' ')[2])
		{
		case '(Eastern':
			return 'EST';
		case '(Central':
			return 'CST';
		case '(Mountain':
			return 'MST';
		case '(Pacific':
			return 'PST';
		case '(Alaskan':
			return 'AST';
		case '(Hawaiian':
			return 'HST';
		default:
		}
	}
	else if (tz.length === 4)
	{
		// Fix weird bug in Edge where it returns the timezone with a null character in the first position.
		return tz.substr(1);
	}

	return tz;
};

const ConvertDateToTimeZone = (date, timezone) => {
	const OldOffset = GetTimeZoneOffsetFromUTC(date.getTimeZone());
	const NewOffset = GetTimeZoneOffsetFromUTC(timezone);

	let dt = new Date(date);
	dt = dt.addHours(OldOffset * -1);
	dt = dt.addHours(NewOffset);
	
	return dt;
};

const GetDateFromTime = (date, time, timezone) => {
	const Time = time.split(':');
	if (timezone) {
		const Offset = GetTimeZoneOffsetFromUTC(timezone) * -1;
		const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), Time[0], Time[1], 0));
		return newDate.addHours(Offset);
	} else {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Time[0], Time[1], 0);
	}
};

Date.prototype.getFormattedTime = function ()
{
	let hours;
	let minutes;
	let ampm;

	switch (_Units) {
	case Units.English:
		hours = this.getHours() === 0 ? '12' : this.getHours() > 12 ? this.getHours() - 12 : this.getHours();
		minutes = (this.getMinutes() < 10 ? '0' : '') + this.getMinutes();
		ampm = this.getHours() < 12 ? 'am' : 'pm';
		return hours + ':' + minutes + ' ' + ampm;

	default:
		hours = (this.getHours() < 10 ? ' ' : '') + this.getHours();
		minutes = (this.getMinutes() < 10 ? '0' : '') + this.getMinutes();
		return hours + ':' + minutes;
	}
};

Date.prototype.toTimeAMPM = function ()
{
	const date = this;
	let hours = date.getHours();
	let minutes = date.getMinutes();
	let ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	return hours + ':' + minutes + ' ' + ampm;
};

const ConvertXmlDateToJsDate = (XmlDate) => {
	let bits = XmlDate.split(/[-T:+]/g);

	if (bits[5] === undefined) {
		console.log('bit[5] is undefined');
	}

	bits[5] = bits[5].replace('Z', '');
	const d = new Date(bits[0], bits[1] - 1, bits[2]);
	d.setHours(bits[3], bits[4], bits[5]);

	// Case for when no time zone offset if specified
	if (bits.length < 8) {
		bits.push('00');
		bits.push('00');
	}

	// Get supplied time zone offset in minutes
	const sign = /\d\d-\d\d:\d\d$/.test(XmlDate) ? '-' : '+';
	const offsetMinutes = (sign==='-'?-1:1)*(bits[6] * 60 + Number(bits[7]));

	// Apply offset and local timezone
	// d is now a local time equivalent to the supplied time
	return d.setMinutes(d.getMinutes() - offsetMinutes - d.getTimezoneOffset());
};