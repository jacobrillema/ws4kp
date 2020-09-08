// display sun and moon data

/* globals WeatherDisplay, utils, STATUS, UNITS, draw, navigation, SunCalc, luxon */

// eslint-disable-next-line no-unused-vars
class Almanac extends WeatherDisplay {
	constructor(navId,elemId) {
		super(navId,elemId,'Almanac');

		// pre-load background image (returns promise)
		this.backgroundImage = utils.image.load('images/BackGround1_1.png');

		// load all images in parallel (returns promises)
		this.moonImages = [
			utils.image.load('images/2/Full-Moon.gif'),
			utils.image.load('images/2/Last-Quarter.gif'),
			utils.image.load('images/2/New-Moon.gif'),
			utils.image.load('images/2/First-Quarter.gif'),
		];

		this.backgroundImage = utils.image.load('images/BackGround3_1.png');
	}

	getData(weatherParameters) {
		super.getData();

		const {DateTime} = luxon;

		const sun = [
			SunCalc.getTimes(new Date(), weatherParameters.latitude, weatherParameters.longitude),
			SunCalc.getTimes(DateTime.local().plus({days:1}).toJSDate(), weatherParameters.latitude, weatherParameters.longitude),
		];

		// brute force the moon phases by scanning the next 30 days
		const moon = [];
		// start with yesterday
		let moonDate = DateTime.local().minus({days:1});
		let phase = SunCalc.getMoonIllumination(moonDate.toJSDate()).phase;
		let iterations = 0;
		do {
			// get yesterday's moon info
			const lastPhase = phase;
			// calculate new values
			moonDate = moonDate.plus({days:1});
			phase = SunCalc.getMoonIllumination(moonDate.toJSDate()).phase;
			// check for 4 cases
			if (lastPhase < 0.25 && phase >= 0.25) moon.push(this.getMoonTransition(0.25, 'First', moonDate));
			if (lastPhase < 0.50 && phase >= 0.50) moon.push(this.getMoonTransition(0.50, 'Full', moonDate));
			if (lastPhase < 0.75 && phase >= 0.75) moon.push(this.getMoonTransition(0.75, 'Last', moonDate));
			if (lastPhase > phase) moon.push(this.getMoonTransition(0.00, 'New', moonDate));

			// stop after 30 days or 4 moon phases
			iterations++;
		} while (iterations <= 30 && moon.length < 4);

		// store the data
		this.data =  {
			sun,
			moon,
		};
		// draw the canvas
		this.drawCanvas();

	}

	// get moon transition from one phase to the next by drilling down by hours, minutes and seconds
	getMoonTransition(threshold, phaseName, start, iteration = 0) {
		let moonDate = start;
		let phase = SunCalc.getMoonIllumination(moonDate.toJSDate()).phase;
		let iterations = 0;
		const step = {
			hours: iteration === 0 ? -1:0,
			minutes: iteration === 1 ? 1:0,
			seconds: iteration === 2 ? -1:0,
			milliseconds: iteration === 3 ? 1:0,
		};

		// increasing test
		let test = (lastPhase,phase,threshold) => lastPhase < threshold && phase >= threshold;
		// decreasing test
		if (iteration%2===0) test = (lastPhase,phase,threshold) => lastPhase > threshold && phase <= threshold;

		do {
		// store last phase
			const lastPhase = phase;
			// calculate new phase after step
			moonDate = moonDate.plus(step);
			phase = SunCalc.getMoonIllumination(moonDate.toJSDate()).phase;
			// wrap phases > 0.9 to -0.1 for ease of detection
			if (phase > 0.9) phase -= 1.0;
			// compare
			if (test(lastPhase, phase, threshold)) {
			// last iteration is three, return value
				if (iteration >= 3) break;
				// iterate recursively
				return this.getMoonTransition(threshold, phaseName, moonDate, iteration+1);
			}
			iterations++;
		} while (iterations < 1000);

		return {phase: phaseName, date: moonDate};
	}

	async drawCanvas() {
		super.drawCanvas();
		const info = this.data;
		const {DateTime} = luxon;

		// extract moon images
		const [FullMoonImage, LastMoonImage, NewMoonImage, FirstMoonImage] = await Promise.all(this.moonImages);

		this.context.drawImage(await this.backgroundImage, 0, 0);
		draw.horizontalGradientSingle(this.context, 0, 30, 500, 90, draw.topColor1, draw.topColor2);
		draw.triangle(this.context, 'rgb(28, 10, 87)', 500, 30, 450, 90, 500, 90);
		draw.horizontalGradientSingle(this.context, 0, 90, 640, 190, draw.sideColor1, draw.sideColor2);

		draw.titleText(this.context, 'Almanac', 'Astronomical');

		const Today = DateTime.local();
		const Tomorrow = Today.plus({days: 1});
		draw.text(this.context, 'Star4000', '24pt', '#FFFF00', 320, 120, Today.toLocaleString({weekday: 'long'}), 2, 'center');
		draw.text(this.context, 'Star4000', '24pt', '#FFFF00', 500, 120, Tomorrow.toLocaleString({weekday: 'long'}), 2, 'center');

		draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 70, 150, 'Sunrise:', 2);
		draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 270, 150, DateTime.fromJSDate(info.sun[0].sunrise).toLocaleString(DateTime.TIME_SIMPLE).toLowerCase(), 2);
		draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 450, 150, DateTime.fromJSDate(info.sun[1].sunrise).toLocaleString(DateTime.TIME_SIMPLE).toLowerCase(), 2);

		draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 70, 180, ' Sunset:', 2);
		draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 270, 180, DateTime.fromJSDate(info.sun[0].sunset).toLocaleString(DateTime.TIME_SIMPLE).toLowerCase(), 2);
		draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 450, 180, DateTime.fromJSDate(info.sun[1].sunset).toLocaleString(DateTime.TIME_SIMPLE).toLowerCase(), 2);

		draw.text(this.context, 'Star4000', '24pt', '#FFFF00', 70, 220, 'Moon Data:', 2);


		info.moon.forEach((MoonPhase, Index) => {
			const date = MoonPhase.date.toLocaleString({month: 'short', day: 'numeric'});

			draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 120+Index*130, 260, MoonPhase.phase, 2, 'center');
			draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 120+Index*130, 390, date, 2, 'center');

			const image = (() => {
				switch (MoonPhase.phase) {
				case 'Full':
					return FullMoonImage;
				case 'Last':
					return LastMoonImage;
				case 'New':
					return NewMoonImage;
				case 'First':
				default:
					return FirstMoonImage;
				}
			})();
			this.context.drawImage(image, 75+Index*130, 270);
		});

		this.finishDraw();
		this.setStatus(STATUS.loaded);
	}
}