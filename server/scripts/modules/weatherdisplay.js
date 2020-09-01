// base weather display class

/* globals navigation */

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
		this.canvas = undefined;
		this.context = undefined;
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
		if (this.canvas) return;
		const container = document.getElementById('container');
		container.innerHTML += `<canvas id='${elemId+'Canvas'}' width='640' height='480'/ style='display: none;'>`;
		this.canvas = document.getElementById(elemId+'Canvas');
		this.context = this.canvas.getContext('2d');
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
		this.gifs.forEach(gif => gif.stop());
		// delete the gifs
		this.gifs = [];
		// clear the canvas
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}


}