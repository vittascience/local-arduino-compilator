/**
 * The Arduino board compilator class
 * Manage the code compilation for Arduino based boards
 */

import Observable from '/public/js/utils/Observable.js';

class ArduinoCompilator extends Observable {
    constructor() {
        super();
        if (ArduinoCompilator._instance) return ArduinoCompilator
        ArduinoCompilator._instance = this;
        this._debugSerial = false; // Turn this on true to display V86 serial output
        this._debugEmulatorScreen = false; // Turn this on true to display the V86 emulator screen
        this._commandTimeout = 30000; // Set the timeout for commands
        this._arduinoLibs = {
            debug: false, // Turn this on true to display V86 debug logs
            libv86: {
                path: `/public/js/scripts/vittaCompilation/build/libv86`,
                extension: `js`
            },
            wasm: {
                path: `/public/js/scripts/vittaCompilation/build/v86`,
                extension: `wasm`
            },
            seaBios: {
                path: `/public/js/scripts/vittaCompilation/bios/seabios`,
                extension: `bin`
            },
            vgaBios: {
                path: `/public/js/scripts/vittaCompilation/bios/vgabios`,
                extension: `bin`
            },
            iso: {
                path: `/public/js/scripts/vittaCompilation/iso/alpine-virt-arduino-edge-x86`,
                extension: `iso`
            }
        }
        this._debugString = this._arduinoLibs.debug ? '-debug' : '';
        this._emulator = null;
        this._vittaCompilator = null;
        this._serialHistory = [''];
        this._serialDebug = [];
        this._loaded = false;
        this._currentCommand = null;
        this._commands = {
            compileObjectFile: {
                command: () => {
                    return [
                        `sed -n 's/^#include <\\([^>]*\\)>/\\1/p' /root/main.cpp | sort -u > /tmp/included_headers.txt`,
                        `sed -i 's/\r$//' /tmp/included_headers.txt`,
                        `touch /tmp/used_libraries.txt`,
                        `while read header; do`,
                        `    lib_path=$(find /usr/share/arduino/src/${this._compilationParameters.mcu}/externals -type f -name "$header" | head -n 1)`,
                        `    if [[ -n "$lib_path" ]]; then`,
                        `        dirname "$lib_path" >> /tmp/used_libraries.txt`,
                        `    fi`,
                        `done < /tmp/included_headers.txt`,
                        `sort -u /tmp/used_libraries.txt -o /tmp/used_libraries.txt`,
                        
                        `INCLUDE_PATHS=$(awk '{print "-I" $0}' /tmp/used_libraries.txt | tr '\\n' ' ')`,

                        `avr-g++ -w -DARDUINO_ARCH_AVR -Os -ffunction-sections -fdata-sections -fno-exceptions \\`,
                        `    -I/usr/lib/avr/include \\`,
                        `    -I/usr/share/arduino/src/${this._compilationParameters.mcu}/cores/arduino \\`,
                        `    -I/usr/share/arduino/src/${this._compilationParameters.mcu}/variants/standard \\`,
                        `    $INCLUDE_PATHS \\`,
                        `    -mmcu=${this._compilationParameters.mcu} -DARDUINO=184 -DF_CPU=${this._compilationParameters.fcpu} -DUSB_VID=null -DUSB_PID=null -MMD \\`,
                        `    -c -o /root/main.o /root/main.cpp\n`
                    ].join("\n");
                },
                expectedOutput: [
                    '>     -c -o /root/main.o /root/main.cpp',
                    '/root # '
                ]
            },
            compileElfFile: {
                command: () => {
                    return [
                        `avr-gcc -w -Os -Wl,--gc-sections -mmcu=${this._compilationParameters.mcu} -DARDUINO=184 -DF_CPU=${this._compilationParameters.fcpu} -DUSB_VID=null -DUSB_PID=null \\`,
                        `    /root/main.o \\`,
                        `    -L/usr/share/arduino/src/${this._compilationParameters.mcu}/lib -l:core.a \\`,
                        `    -o /root/main.elf \\`,
                        `    -lm -lc\n`
                    ].join("\n");
                },
                expectedOutput: [
                    '>     -lm -lc',
                    '/root # '
                ]
            },
            compileHexFile: {
                command: () => {
                    return 'avr-objcopy -O ihex -R .eeprom /root/main.elf /root/main.hex';
                },
                expectedOutput: [
                    'avr-objcopy -O ihex -R .eeprom /root/main.elf /root/main.hex'
                ]
            },
            getHexFileContent: {
                command: () => { 
                    return 'cat /root/main.hex';
                },
                expectedOutput: [
                    ':'
                ]
            }
        };
        this._loadingResolve = null;
        this._commandCheckResolve = null;
        this._commandCheckReject = null;
        this._expectedCommandOutput = null;
        this._compilationParameters = null;
    }

    /**
     * Download and load the V86 libraries. Add the emulator serial management.
     * @public
     * @returns {Promise} true in success case, false otherwise
     */
    async init() {
        try {
            const { default: VittaCompilator } = await import('/public/js/scripts/vittaCompilation/VittaCompilator.js');
            this._vittaCompilator = new VittaCompilator();
            await this._loadV86Lib();
            this._emulator = this._loadEmulator();
            await this._awaitDowload();
            await this._setupSerialOutputManagement();
            await this._awaitLoading();
            return true;
        } catch(error) {
            console.error(error);
            return false;
        }
    }

    /**
     * Load the V86 main library (libv86.js)
     * @private
     * @returns {Promise} true in success case, false otherwise
     */
    async _loadV86Lib() {
        try {
            const V86Script = document.createElement('script');
            V86Script.src = `${this._arduinoLibs.libv86.path}${this._debugString}.${this._arduinoLibs.libv86.extension}`;
            await new Promise(resolve => {
                V86Script.onload = resolve;
                document.head.appendChild(V86Script);
            });
            return true;
        } catch(error) {
            console.error(error);
            return false;
        }
    }

    /**
     * Load the V86 emulator
     * @private
     * @returns the V86 object
     */
    _loadEmulator() {
        const v86Parameters = {
            wasm_path: `${this._arduinoLibs.wasm.path}${this._debugString}.${this._arduinoLibs.wasm.extension}`,
            memory_size: 1024 * 1024 * 1024,
            vga_memory_size: 8 * 1024 * 1024,
            cdrom: { url: `${this._arduinoLibs.iso.path}.${this._arduinoLibs.iso.extension}` },
            autostart: true,
            bios: { url: `${this._arduinoLibs.seaBios.path}.${this._arduinoLibs.seaBios.extension}` },
            vga_bios: { url: `${this._arduinoLibs.vgaBios.path}.${this._arduinoLibs.vgaBios.extension}` },
            disable_keyboard: true,
            disable_mouse: true,
            cmdline: "console=ttyS0,115200"
        };
        /* To enable the emulator screen, you need to have the relevant dom elements:
            <div id="screen_container">
                <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
                <canvas style="display: none"></canvas>
            </div>
        */
        if (this._debugEmulatorScreen) v86Parameters.screen_container = document.getElementById("screen_container");
        return new V86(v86Parameters);
    }

    /**
     * Await the V86 assets download completion. Track the download progress
     * @private
     * @returns {Promise} true in success case, false otherwise 
     */
    async _awaitDowload() {
        let downloadSuccess = false;
        await new Promise((resolve, reject) => {
            try {
                let firstDownloadSkipped = false,
                    secondDownloadStarted = false;
                this._emulator.bus.register("download-progress", (progress) => {
                    if (progress.total && progress.loaded) {
                        let percentage = (progress.loaded / progress.total) * 100;
                        // There is currently a fast first download occuring in v86, so we skip it
                        if (!firstDownloadSkipped && percentage === 100) firstDownloadSkipped = true;
                        if (firstDownloadSkipped && percentage !== 100) secondDownloadStarted = true;
                        if (!secondDownloadStarted) return;
                        this.trigger('downloadProgress', percentage);
                    }
                });
        
                this._emulator.bus.register("emulator-ready", () => {
                    this.trigger('downloadComplete');
                    resolve(true);
                });
            } catch (error) {
                console.error(error);
                reject(false);
            }
        });
        return downloadSuccess;
    }

    /**
     * Manage V86 serial output
     * @private
     * @returns {Promise} true
     */
    async _setupSerialOutputManagement() {
        this._emulator.add_listener("serial0-output-byte", (byte) => {
            this._addCharToSerialHistory(byte);
        });
        return true;
    }

    /**
     * Convert a byte to the relevant character, process it and add it to the serial history. Also trigger events relative to emulator loading and command processing
     * @private
     * @param {number} byte - The byte provided by the serial output
     * @returns {undefined} Early return when a new line is detected
     */
    _addCharToSerialHistory(byte) {
        const currentChar = String.fromCharCode(byte);
        this._serialDebug.push(currentChar);
        if (currentChar === '\r') return;
        if (currentChar === '\n') {
            if (this._debugSerial) console.log(this._serialHistory[this._serialHistory.length-1]);
            this._serialHistory.push('');
            return;
        }
        this._serialHistory[this._serialHistory.length-1] += currentChar;
        this._cleanANSISequences();
        this._checkLoaded();
        this._checkCommandResolve();
    }

    /**
     * Remove the ANSI Sequences from the last serial line
     * @private
     */
    _cleanANSISequences() {
        this._serialHistory[this._serialHistory.length-1] = this._serialHistory[this._serialHistory.length-1].replace(/\x1B\[[0-9;]*[A-Za-z]/g, "")
    }

    /**
     * Check if the emulator is fully loaded. Trigger the loaded events when the emulator is loaded
     * @private
     * @returns {undefined} false if the emulator is loaded, false otherwise
     */
    _checkLoaded() {
        if (this._loaded) return true;
        if (this._serialHistory[this._serialHistory.length-1] !== '~ # ') return false;
        this._loadingResolve();
        this._loadingResolve = null;
        this._loaded = true;
        this.trigger('emulatorLoaded');
        return true;
    }

    /**
     * Await the full load of V86 emulator
     * @private
     * @returns {Promise} true when the emulator is fully loaded
     */
    async _awaitLoading() {
        await new Promise((resolve, reject) => {
            try {
                this._loadingResolve = resolve;
            } catch (error) {
                console.error(error);
                reject();
            }
        });
        return true;
    }

    /**
     * Run all the commands to compile the code
     * @param {String} code - The code to be compiled
     * @returns {String|boolean} the compiled code if succeded, false otherwise
     */
    async compile(code, compilationParameters) {
        const compileCode = `#include <Arduino.h>\n${code}`;
        this.setCompilationParameters(compilationParameters);   
        const cppFileCreated = await this._createCppFile(compileCode);
        const compilationResponse = {
            success: false,
            message: null,
            output: null
        }
        if (!cppFileCreated) {
            return this._manageError('Error while creating cpp file, aborting compilation...', compilationResponse);
        }
        const objectFileCompiled = await this._compileObjectFile();
        if (!objectFileCompiled) {
            return this._manageError('Error while compiling object file, aborting compilation...', compilationResponse);
        }
        const elfFileCompiled = await this._compileElfFile();
        if (!elfFileCompiled) {
            return this._manageError('Error while compiling elf file, aborting compilation...', compilationResponse);
        }
        const hexFileCompiled = await this._compileHexFile();
        if (!hexFileCompiled) {
            return this._manageError('Error while compiling hex file, aborting compilation...', compilationResponse);
        }
        const hexFileContent = await this._getHexFileContent();
        if (!hexFileContent) {
            return this._manageError('Error while retrieving hex file content, aborting compilation...', compilationResponse);
        }
        compilationResponse.success = true;
        compilationResponse.output = hexFileContent;
        return compilationResponse;
    }

    /**
     * Display an error and add it to the compilation response
     * @private
     * @param {String} errorMessage - The error message to be displayed in the response
     * @param {object} compilationResponse - The compilation response
     * @returns {object} the compilation response
     */
    _manageError(errorMessage, compilationResponse) {
        console.error(errorMessage);
        compilationResponse.message = errorMessage;
        return compilationResponse;
    }

    /**
     * Send the command to the emulator. Clear the serial history beforehand. Await the command process(es) to end and check if the output is correct 
     * @private
     * @param {String} command - The command to be executed in the emulator
     * @param {Array} expectedOutput - The expected serial output relative to the command
     * @returns {Promise} The serial history if the command has succeded, false otherwise
     */
    async _sendCommand(command, expectedOutput) {
        this._clearSerialHistory();
        if (this._commands[command]) {
            expectedOutput = this._commands[command].expectedOutput;
            command = this._commands[command].command();
        }
        command = [
            command,
            `echo jobs done!\n`
        ].join("\n");
        this._currentCommand = command;
        try {
            await new Promise((resolve, reject) => {
                setTimeout(reject, this._commandTimeout);
                this._commandCheckResolve = resolve;
                this._commandCheckReject = reject;
                this._expectedCommandOutput = expectedOutput;
                this._emulator.serial0_send(command);
            });
        } catch (error) {
            console.error(error);
            const formattedError = this._formatError();
            this.trigger('commandError', formattedError);
            this._clearCurrentCommand();
            return false;
        }
        return this._serialHistory;
    }

    /**
     * Format the serial history to keep the error only
     * @private
     * @param {string} command - The current command that triggered an error
     * @returns {string} The formatted error
     */
    _formatError() {
        const command = this._currentCommand;
        const lastCommandChars = command.slice(command.length - 35).replace(/\n/g, '').replace('echo jobs done!', '');

        const preventiveIndex = this._serialHistory.findIndex(element => element === 'echo jobs done!');
        const preventiveCleanedHistory = preventiveIndex !== -1 ? this._serialHistory.slice(preventiveIndex + 1) : this._serialHistory;

        const index = preventiveCleanedHistory.findIndex(element => element.includes(lastCommandChars));
        const croppedHistory = index !== -1 ? preventiveCleanedHistory.slice(index + 1) : preventiveCleanedHistory;

        const cleanedSerialHistory = croppedHistory.filter((line) => {
            if (line.includes('/root # ') || line.includes('jobs done!')) return false;
            return true;
        });
        return cleanedSerialHistory.join("\n");
    }

    /**
     * Clear the serial history (reset)
     * @private
     */
    _clearSerialHistory() {
        this._serialHistory = [''];
    }

    /**
     * Check if the current command has finished and succeeded. Trigger the command success event when relevant
     * @private
     * @returns {boolean} true if the command has finished and succeeded, false otherwise
     */
    _checkCommandResolve() {
        if (this._expectedCommandOutput === null) return false;
        // We only check the command output if the process has ended (user prompt)
        const lastSerialLine = this._serialHistory[this._serialHistory.length - 1];
        if (lastSerialLine !== 'jobs done!') return false;
        if (this._expectedCommandOutput !== false) {
            const expectedLinesLastIndex = this._expectedCommandOutput.length - 1;
            for (let i = expectedLinesLastIndex; i >= 0; i--) {
                const reverseIndex = expectedLinesLastIndex - i,
                    lastSerialHistoryIndex = this._serialHistory.length - 1;
                if (!this._serialHistory[lastSerialHistoryIndex - reverseIndex - 2] || !(this._serialHistory[lastSerialHistoryIndex - reverseIndex - 2].includes(this._expectedCommandOutput[i]))) {
                    this._commandCheckReject();
                    return false;
                }
            }
        }
        this._commandCheckResolve();
        this._clearCurrentCommand();
        return true;
    }

    /**
     * Reset all temporary parameters for the current command
     * @private
     */
    _clearCurrentCommand() {
        this._currentCommand = null;
        this._commandCheckReject = null;
        this._commandCheckResolve = null;
        this._expectedCommandOutput = null;
    }

    /**
     * Create and fill the main.cpp file
     * @private
     * @param {String} code - The code to be copied to the cpp file
     * @returns {Promise} true in success, false otherwise
     */
    async _createCppFile(code) {
        const command = [
            `cd /root`,
            `cat <<EOF > /root/main.cpp\n${code}\nEOF`
        ].join("\n"),
        expectedOutput = ['> EOF'];
        const commandSuccess = await this._sendCommand(command, expectedOutput);
        if (!commandSuccess) return false;
        this.trigger('cppFileCreated');
        return true;
    }

    /**
     * Compile the object file (main.o) from the main.cpp file
     * @private
     * @returns {Promise} true in success, false otherwise
     */
    async _compileObjectFile() {
        const commandSuccess = await this._sendCommand('compileObjectFile');
        if (!commandSuccess) return false;
        this.trigger('objectFileCreated');
        return true;
    }

    /**
     * Compile the elf file (main.elf) from the main.o file
     * @private
     * @returns {Promise} true in success, false otherwise
     */
    async _compileElfFile() {
        const commandSuccess = await this._sendCommand('compileElfFile');
        if (!commandSuccess) return false;
        this.trigger('elfFileCreated');
        return true;
    }

    /**
     * Compile the hex file (main.hex) from the main.elf file
     * @private
     * @returns {Promise} true in success, false otherwise
     */
    async _compileHexFile() {
        const commandSuccess = await this._sendCommand('compileHexFile');
        if (!commandSuccess) return false;
        this.trigger('hexFileCreated');
        return true;
    }

    /**
     * Get the main.hex file content and return it
     * @private
     * @returns {Promise} the compiled hex code, false otherwise
     */
    async _getHexFileContent() {
        const commandSuccess = await this._sendCommand('getHexFileContent');
        if (!commandSuccess) return false;
        const filteredHexFileLines = this._serialHistory.filter((line) => {
            if (line.split('')[0] === ':') return true;
            return false;
        });
        return `${filteredHexFileLines.join("\r\n")}\r\n`;
    }

    /**
     * Set the compiling parameters (mcu and fcpu)
     * @public
     * @param {Object} parameters The compiling parameters
     */
    setCompilationParameters(parameters) {
        let mcu = 'atmega328p';
        let fcpu = '16000000L';
        if (parameters !== null) {
            mcu = parameters.mcu ? parameters.mcu : mcu;
            fcpu = parameters.fcpu ? parameters.fcpu : fcpu;
        }
        this._compilationParameters = {
            mcu: mcu,
            fcpu: fcpu
        }
    }
}

export default ArduinoCompilator;