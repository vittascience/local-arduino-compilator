class Observable{
	constructor() {
		this._observers = {};
	}

	on(event, name, callback) {
		if (!this._observers[event]) {
			this._observers[event] = {};
		}
		this._observers[event][name] = callback;
	}

	off(event, name) {
		if (!this._observers[event] || !this._observers[event][name]) {
			return null;
		}
		const currentObserver = this._observers[event][name];
		delete this._observers[event][name];
		return currentObserver;
	}

	trigger(event, ...args) {
		if(!this._observers[event]) {
			return false;
		}
		for (let observer in this._observers[event]) {
			try {
				this._observers[event][observer](...args);
			} catch(error) {
				console.error(error);
			}
		}
	}
}

export default Observable;