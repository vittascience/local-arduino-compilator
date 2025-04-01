# local-arduino-compilator
An in-browser arduino compilation system using a custom alpine iso and [v86](https://github.com/copy/v86)

## Get started
Firstly you need to build the iso image

### Add your custom/external libraries
If necessary, put your external libraries in `libs/arduino-core/externals`. Be aware that you must remove all spaces in the file/folder names. 
Also, clean by removing the useless elements:
- examples and extras folders
- files that aren't .cpp or .h

### Build the iso file
You need to have Docker and docker-compose installed in your environment
1. Go to the root of this repo using your terminal
2. Type `sudo docker compose up --build`
3. Wait until the images have been built and the containers instanciated
4. After instanciation, the containers will build the iso image

You should end with this : (If not, take a look at the errors/warnings)

```
2025-03-27 11:59:25 + '['  '=' yes ]
2025-03-27 11:59:25 + '[' -n  ]
2025-03-27 11:59:25 + echo 'Images generated in iso'
2025-03-27 11:59:25 Images generated in iso
2025-03-27 11:59:25 + rm -rf /home/build/tmp/mkimage.LbpkKF
```

From here, you can stop the container (ctrl + D) and you should see the iso image in the iso-builder folder.

### Loading your iso using the provided example
1. Take the iso file from the `iso-builder` folder and copy it into `web/public/js/scripts/vittaCompilation/iso/` folder
2. At the root of the repo, type `npm install` (you need to have nodejs and npm installed)
3. Then type `npm run serve`
4. Open your browser and go to this url: http://localhost:3000
5. You should now be able to paste your code in the textarea and click the compile button. You can open the devtool console to see what's happening (it will take some time for the VM to load so be patient).

## How does this work?
The iso file is built using two Docker containers. The main container uses mkimage to create the iso file containing all the necessary packages to compile arduino code (avr-gcc, avr-libc...) and all the needed libraries (arduino-core libraries + external libraries). The second container delivers the custom package that includes the libraries as mkimage seems to need absolute path instead of relative one for the packages. The target OS for the iso is a x86 (32 bits) Alpine Linux as v86 dosen't support 64 bits OS.

After the build, the iso file can be loaded using [v86](https://github.com/copy/v86). v86 emulates an x86-compatible CPU and hardware. Machine code is translated to WebAssembly modules at runtime in order to achieve decent performance.
There is a javascript interface named vittaCompilator that's available in the global javascript scope. 
It provides a `compileCode` method which needs a string as argument (the code to be compiled). This method returns a promise which will return the compiled hex code.
It also exposes event observables that can be registered to add reactions to these events. You can see the list below (you will want to replace the console.log by your own code):
```
// Downloading progress event
vittaCompilator.on('downloadProgress', 'logDownloadProgress', (percentage) => {
    console.log(`Downloading local compilator: ${percentage}%`);
});
// Download completion event
vittaCompilator.on('downloadComplete', 'logDownloadComplete', () => {
    console.log(`Local compilator downloaded. Loading the VM... This may take few minutes!`);
});
// Emulator loaded event
vittaCompilator.on('emulatorLoaded', 'logEmulatorLoaded', () => {
    console.log(`VM loaded, compilator ready!`);
});
// Compilation error event
vittaCompilator.on('commandError', 'logCommandError', (error) => {
    console.warn(error);
});
// cpp file creation event
vittaCompilator.on('cppFileCreated', 'logCppFileCreated', () => {
    console.log(`cpp file created successfully!`);
});
// object file creation event
vittaCompilator.on('objectFileCreated', 'logObjectFileCreated', () => {
    console.log(`Object file created successfully!`);
});
// elf file creation event
vittaCompilator.on('elfFileCreated', 'logElfFileCreated', () => {
    console.log(`elf file created successfully!`);
});
// hex file creation event
vittaCompilator.on('hexFileCreated', 'logHexFileCreated', () => {
    console.log(`hex file created successfully!`);
});
```
