// base weather display class

/* globals navigation, utils, draw, UNITS */

const STATUS = {
	loading: 0,
	loaded: 1,
	failed: 2,
	noData: 3,
};

// eslint-disable-next-line no-unused-vars
class WeatherDisplay {
	constructor(navId, elemId) {
		// navId is used in messaging
		this.navId = navId;
		this.elemId = undefined;
		this.gifs = [];
		this.data = undefined;
		this.loadingStatus = STATUS.loading;

		this.setStatus(STATUS.loading);
		this.createCanvas(elemId);
	}

	// set data status and send update to navigation module
	setStatus(value) {
		this.status = value;
		navigation.updateStatus({
			id: this.navId,
			status: this.status,
		});
	}

	get status() {
		return this.loadingStatus;
	}

	set status(state) {
		this.loadingStatus = state;
	}

	createCanvas(elemId) {
		// only create it once
		if (this.elemId) return;
		this.elemId = elemId;
		const container = document.getElementById('container');
		container.innerHTML += `<canvas id='${elemId+'Canvas'}' width='640' height='480'/ style='display: none;'>`;
	}

	// get necessary data for this display
	getData() {
		// clear current data
		this.data = undefined;
		// set status
		this.setStatus(STATUS.loading);
	}

	drawCanvas() {
		// stop all gifs
		this.gifs.forEach(gif => gif.pause());
		// delete the gifs
		this.gifs.length = 0;
		// refresh the canvas
		this.canvas = document.getElementById(this.elemId+'Canvas');
		this.context = this.canvas.getContext('2d');
		// clear the canvas
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	finishDraw() {
		let OkToDrawCurrentConditions = true;
		let OkToDrawNoaaImage = true;
		let OkToDrawCurrentDateTime = true;
		let OkToDrawLogoImage = true;
		// let OkToDrawCustomScrollText = false;
		let bottom = undefined;

		// visibility tests
		// if (_ScrollText !== '') OkToDrawCustomScrollText = true;
		if (this.elemId === 'almanac') OkToDrawNoaaImage = false;
		if (this.elemId === 'almanacTides') OkToDrawNoaaImage = false;
		if (this.elemId === 'outlook') OkToDrawNoaaImage = false;
		if (this.elemId === 'marineForecast')OkToDrawNoaaImage = false;
		if (this.elemId === 'airQuailty') OkToDrawNoaaImage = false;
		if (this.elemId === 'travelForecast') OkToDrawNoaaImage = false;
		if (this.elemId === 'regionalForecast1')OkToDrawNoaaImage = false;
		if (this.elemId === 'regionalForecast2') OkToDrawNoaaImage = false;
		if (this.elemId === 'regionalObservations') OkToDrawNoaaImage = false;
		if (this.elemId === 'localRadar') {
			OkToDrawCurrentConditions = false;
			OkToDrawCurrentDateTime = false;
			OkToDrawNoaaImage = false;
			// OkToDrawCustomScrollText = false;
		}
		if (this.elemId === 'hazards') {
			OkToDrawNoaaImage = false;
			bottom = true;
			OkToDrawLogoImage = false;
		}
		// draw functions
		if (OkToDrawCurrentDateTime) this.DrawCurrentDateTime(bottom);
		if (OkToDrawLogoImage) this.DrawLogoImage();
		if (OkToDrawNoaaImage) this.DrawNoaaImage();
		// TODO: fix current conditions scroll
		// if (OkToDrawCurrentConditions) DrawCurrentConditions(WeatherParameters, this.context);
		// TODO: add custom scroll text
		// if (OkToDrawCustomScrollText) DrawCustomScrollText(WeatherParameters, context);
	}

	// TODO: cleanup
	// TODO: update clock automatically
	DrawCurrentDateTime(bottom) {
		const font = 'Star4000 Small';
		const size = '24pt';
		const color = '#ffffff';
		const shadow = 2;

		// // Clear the date and time area.
		// if (bottom) {
		// 	draw.box(this.context, 'rgb(25, 50, 112)', 0, 389, 640, 16);
		// } else {
		// 	this.drawImage(canvasBackGroundDateTime[0], 0, 0, 175, 60, 410, 30, 175, 60);
		// }

		// Get the current date and time.
		let now = new Date();
		now = utils.dateTime.dateToTimeZone(now, 'CDT');

		//time = "11:35:08 PM";
		let h = now.getHours();
		let m = now.getMinutes();
		let s = now.getSeconds();
		let time = '';
		let x;
		let y;
		let date;

		if (navigation.units() === UNITS.english) {
			if (h < 10) {
				if (h === 0) {
					time = '12';
				} else {
					time += ' ' + h.toString();
				}
			} else if (h > 12) {
				if (h - 12 < 10) {
					time += ' ' + (h - 12).toString();
				} else {
					time += (h - 12).toString();
				}
			} else {
				time += h.toString();
			}
		} else {
			if (h < 10) {
				time += ' ' + h.toString();
			} else {
				time += h.toString();
			}
		}

		time += ':';
		if (m < 10) time += '0';
		time += m.toString() + ':';
		if (s < 10) time += '0';
		time += s.toString() + ' ';

		if (navigation.units() === UNITS.english) {
			if (h >= 12) {
				time += 'PM';
			} else {
				time += 'AM';
			}
		}

		if (bottom) {
			x = 400;
			y = 402;
		} else {
			x = 410;
			y = 65;
		}
		if (navigation.units() === UNITS.metric) {
			x += 45;
		}

		draw.text(this.context, font, size, color, x, y, time, shadow); //y += 20;

		if (navigation.units() === UNITS.english) {
			date = ' ';
			const W = now.getDayShortName().toUpperCase();
			date += W + ' ';
			const M = now.getMonthShortName().toUpperCase();
			date += M + ' ';
			const D = now.getDate();
			if (D < 10) date += ' ';
			//date += " " + D.toString();
			date += D.toString();
		} else {
			date = ' ';
			const W = now.getDayShortName().toUpperCase();
			date += W + ' ';
			const D = now.getDate();
			if (D < 10) date += ' ';
			date += D.toString();
			const M = now.getMonthShortName().toUpperCase();
			date += ' ' + M;
		}

		if (bottom) {
			x = 55;
			y = 402;
		} else {
			x = 410;
			y = 85;
		}
		draw.text(this.context, font, size, color, x, y, date, shadow);
	}

	async DrawNoaaImage () {
		// load the image and store locally
		if (!this.DrawNoaaImage.image) {
			this.DrawNoaaImage.image = utils.image.load('images/noaa5.gif');
		}
		// wait for the image to load completely
		const img = await this.DrawNoaaImage.image;
		this.context.drawImage(img, 356, 39);
	}

	async DrawLogoImage () {
		// load the image and store locally
		if (!this.DrawLogoImage.image) {
			this.DrawLogoImage.image = utils.image.load('images/Logo3.png');
		}
		// wait for the image load completely
		const img = await this.DrawLogoImage.image;
		this.context.drawImage(img, 50, 30, 85, 67);
	}
}