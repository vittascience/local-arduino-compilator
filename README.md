# local-arduino-compilator
An in-browser arduino compilation system

## Get started
Firstly you need to build the iso image

### Add your custom/external libraries
If necessary, put your external libraries in libs/arduino-core/externals. Be aware that you must remove all spaces in the file/folder names. 
Also, clean by removing the useless elements:
- examples and extras folders
- files that aren't .cpp or .h

### Build the iso file
You need to have Docker and docker-compose installed in your environment
1. Go to the root of this repo using your terminal
2. Type sudo docker compose up --build
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
