// display text based local forecast
// period 0 = first available forecast period
// makes use of global data retrevial through LocalForecastData

/* globals WeatherDisplay, utils, STATUS, UNITS, draw, navigation, LocalForecastData */

// eslint-disable-next-line no-unused-vars
class LocalForecast extends WeatherDisplay {
	constructor(navId,elemId,weatherParameters,period) {
		super(navId,elemId);
		// store the period, see above
		this.period = period;
		this.currentScreen = 0;
		this.lastScreen = 0;

		// pre-load background image (returns promise)
		this.backgroundImage = utils.image.load('images/BackGround1_1.png');

		// get the data and update the promise
		this.getData(weatherParameters);
	}

	// get the data form the globally shared object
	async getData(weatherParameters) {
		super.getData();
		this.data = await LocalForecastData.updateData(weatherParameters);

		// split this forecast into the correct number of screens
		const condition = this.data[this.period];
		const MaxRows = 7;
		const MaxCols = 32;

		// process the text
		let text = condition.DayName.toUpperCase() + '...';
		let conditionText = condition.Text;
		if (navigation.units() === UNITS.metric) {
			conditionText = condition.TextC;
		}
		text += conditionText.toUpperCase().replace('...', ' ');

		text = text.wordWrap(MaxCols, '\n');
		const Lines = text.split('\n');
		const LineCount = Lines.length;
		let ScreenText = '';
		const MaxRowCount = MaxRows;
		let RowCount = 0;
		this.screenTexts = [];

		// if (PrependAlert) {
		// 	ScreenText = LocalForecastScreenTexts[LocalForecastScreenTexts.length - 1];
		// 	RowCount = ScreenText.split('\n').length - 1;
		// }

		for (let i = 0; i <= LineCount - 1; i++) {
			if (Lines[i] === '') continue;

			if (RowCount > MaxRowCount - 1) {
				// if (PrependAlert) {
				// 	LocalForecastScreenTexts[LocalForecastScreenTexts.length - 1] = ScreenText;
				// 	PrependAlert = false;
				// } else {
				this.screenTexts.push(ScreenText);
				// }
				ScreenText = '';
				RowCount = 0;
			}

			ScreenText += Lines[i] + '\n';
			RowCount++;
		}
		// if (PrependAlert) {
		// 	this.screenTexts[this.screenTexts.length - 1] = ScreenText;
		// 	PrependAlert = false;
		// } else {
		this.screenTexts.push(ScreenText);
		// }

		this.currentScreen = 0;
		this.lastScreen = this.screenTexts.length - 1;
		this.drawCanvas();
	}

	// TODO: alerts needs a cleanup
	// TODO: second page of screenTexts when needed
	async drawCanvas() {
		super.drawCanvas();

		this.context.drawImage(await this.backgroundImage, 0, 0);
		draw.horizontalGradientSingle(this.context, 0, 30, 500, 90, draw.topColor1, draw.topColor2);
		draw.triangle(this.context, 'rgb(28, 10, 87)', 500, 30, 450, 90, 500, 90);
		draw.horizontalGradientSingle(this.context, 0, 90, 52, 399, draw.sideColor1, draw.sideColor2);
		draw.horizontalGradientSingle(this.context, 584, 90, 640, 399, draw.sideColor1, draw.sideColor2);

		draw.titleText(this.context, 'Local ', 'Forecast');

		// clear existing text
		draw.box(this.context, 'rgb(33, 40, 90)', 65, 105, 505, 280);
		// Draw the text.
		this.screenTexts[this.currentScreen].split('\n').forEach((text, index) => {
			draw.text(this.context, 'Star4000', '24pt', '#FFFFFF', 75, 140+40*index, text, 2);
		});


		this.finishDraw();
		this.setStatus(STATUS.loaded);

	}
}