/**
 * The board compilator main class
 * Manage the code compilation for Arduino and Aseba (python) based boards
 *  
 * Automatically instanciated and append to global window object
 */

import Observable from '/public/js/utils/Observable.js';
import ArduinoCompilator from "/public/js/scripts/vittaCompilation/assets/js/ArduinoCompilator.js";

class VittaCompilator extends Observable {
    constructor() {
        super();
        if (VittaCompilator._instance) return VittaCompilator._instance;
        VittaCompilator._instance = this;
        this._compilator = null;
        this._compilatorDownloaded = false;
        this.compilatorLoaded = false;
        this._compilatorLoadingResolve = null;
        this._isCompiling = false;
        this._isLoading = false;
        this.downloadProgress = 0;
        if (typeof $_GET !== 'undefined' && $_GET('compiler') === 'local') this._init();
    }
    
    /**
     * Load compilator and listeners depending on the environment
     * @private
     */
    _init() {
        this._isLoading = true;
        this._loadArduinoCompilator();
        this._addListeners();
    }

    /**
     * Compile the provided code using the current compilator
     * @public
     * @param {String} code - The code to be compiled
     * @returns {Promise} The compiled code
     */
    async compileCode(code) {
        if (this._isCompiling) return false;
        this._isCompiling = true;
        if (!this.compilatorLoaded && !this._isLoading) this._init();
        await this._awaitCompilatorLoaded();
        const compiledCode = await this._compilator.compile(code);
        this._isCompiling = false;
        return compiledCode;
    }

    /**
     * Instanciate and initialize the arduino compilator
     * @private
     */
    _loadArduinoCompilator() {
        this._compilator = new ArduinoCompilator();
        this._compilator.init();
    }

    /**
     * Await the compilator to be loaded
     * @private
     * @returns {Promise} true
     */
    async _awaitCompilatorLoaded() {
        if (this.compilatorLoaded) return true;
        await new Promise((resolve) => {
            this._compilatorLoadingResolve = resolve;
        });
        return true;
    }

    /**
     * Add all the listeners
     * @private
     */
    _addListeners() {
        this._compilator.on('downloadProgress', 'passingDownloadProgress', (percentage) => {
            this.downloadProgress = percentage;
            this.trigger('downloadProgress', percentage);
        });
        this._compilator.on('downloadComplete', 'passingdownloadComplete', () => {
            this.trigger('downloadComplete');
            this._compilatorDownloaded = true;
        });
        this._compilator.on('emulatorLoaded', 'passingEmulatorLoaded', () => {
            this.trigger('emulatorLoaded');
            this.compilatorLoaded = true;
            this._isLoading = false;
            if (this._compilatorLoadingResolve) this._compilatorLoadingResolve();
        });
        this._compilator.on('commandError', 'passingEmulatorError', (errorOutput) => {
            this.trigger('commandError', errorOutput);
            console.warn(errorOutput);
        });
        const eventList = ['cppFileCreated', 'objectFileCreated', 'elfFileCreated', 'hexFileCreated'];
		eventList.map((eventName) => {
			this._compilator.on(eventName, `${eventName}VittaCompilator`, () => {
                this.trigger(eventName);
			});
		});
    }
}

window.vittaCompilator = new VittaCompilator();
export default VittaCompilator;