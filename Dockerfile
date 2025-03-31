# Use Alpine 3.20 with 32-bit architecture
FROM i386/alpine
# FROM alpine:latest

RUN apk add --no-interactive alpine-sdk \
alpine-conf \
syslinux xorriso \
squashfs-tools grub \
grub-efi \
doas \
mtools \
dosfstools \
grub-efi \
rsync

# Packages for arduino compilation
RUN apk add --no-interactive gcc-avr \
binutils-avr \
avr-libc

# Prepare the workspace
WORKDIR /home

# Copy arduino atmega328p libraries and precompile them
COPY ./libs/arduino-core /home/arduino-core/atmega328p_tmp
RUN rsync -av --progress /home/arduino-core/atmega328p_tmp/ /home/arduino-core/atmega328p/ --exclude=firmwares && \
    rm -rf /home/arduino-core/atmega328p_tmp

RUN mkdir -p /home/arduino-core/atmega328p/lib && \
    avr-gcc -Os -mmcu=atmega328p \
        -DF_CPU=16000000L -DARDUINO=184 -DINCLUDE_PULSEIN -UEXCLUDE_PULSEIN \
        -x assembler-with-cpp \
        -I/home/arduino-core/atmega328p/cores/arduino \
        -I/home/arduino-core/atmega328p/variants/standard \
        -I/home/arduino-core/atmega328p \
        -c /home/arduino-core/atmega328p/cores/arduino/wiring_pulse.S \
        -o /home/arduino-core/atmega328p/cores/arduino/wiring_pulse.S.o && \
    avr-ar rcs /home/arduino-core/atmega328p/lib/core_extras.a /home/arduino-core/atmega328p/cores/arduino/wiring_pulse.S.o && \
    echo "✅ core_extras.a (wiring_pulse.S) successfully compiled!"

RUN find /home/arduino-core/atmega328p/ \
        \( -path "*/firmwares/*" -o -path "*/extras/*" -o -path "*/examples/*" \
        -o -path "*/bootloaders/*" -o -path "*/drivers/*" -o -path "*/libraries/*" \
        -o -path "*/LP examples/*" \) -prune -o \
        -type f \( -name "*.c" -o -name "*.cpp" \) -print > /tmp/sources.txt && \
    find /home/arduino-core/atmega328p/externals \
        \( -path "*/firmwares/*" -o -path "*/extras/*" -o -path "*/examples/*" \
        -o -path "*/bootloaders/*" -o -path "*/drivers/*" -o -path "*/libraries/*" \
        -o -path "*/LP examples/*" \) -prune -o \
        -type d -print > /tmp/include_dirs.txt && \
    if [ -s /tmp/include_dirs.txt ]; then \
        INCLUDE_PATHS=$(awk '{print "-I" $0}' /tmp/include_dirs.txt | tr '\n' ' '); \
    else \
        INCLUDE_PATHS=""; \
    fi && \
    if [ -s /tmp/sources.txt ]; then \
        while IFS= read -r file; do \
            avr-gcc -Os -ffunction-sections -fdata-sections -fno-exceptions \
                -mmcu=atmega328p -DF_CPU=16000000L -DARDUINO=184 -DINCLUDE_PULSEIN -UEXCLUDE_PULSEIN \
                -I/home/arduino-core/atmega328p/cores/arduino \
                -I/home/arduino-core/atmega328p/variants/standard \
                -I/home/arduino-core/atmega328p \
                $INCLUDE_PATHS \
                -c "$file" -o "${file%.*}.o" || true; \
        done < /tmp/sources.txt; \
    else \
        echo "⚠️ No source file found!"; \
    fi && \
    find /home/arduino-core/atmega328p -name "*.o" > /tmp/objects.txt && \
    avr-ar rcs /home/arduino-core/atmega328p/lib/core.a $(cat /tmp/objects.txt) && \
    echo "✅ core.a successfully compiled!"

RUN chmod -R 755 /home/arduino-core

RUN getent group abuild || addgroup -S abuild && \
    adduser -S build -G abuild

RUN printf "permit persist :abuild\npermit nopass :abuild\n" > /etc/doas.d/doas.conf

RUN chmod -R 777 /etc/apk/keys/
USER build

RUN chmod 777 /home/build

RUN abuild-keygen -a -n
RUN cp /home/build/.abuild/*.rsa.pub /etc/apk/keys/

WORKDIR /home/build

RUN git clone --depth=1 https://gitlab.alpinelinux.org/alpine/aports.git

RUN mkdir -p /home/build/aports/community/arduino-libs
WORKDIR /home/build/aports/community/arduino-libs
COPY ./config/APKBUILD /home/build/aports/community/arduino-libs/APKBUILD
RUN tar -czf /home/build/aports/community/arduino-libs/arduino-core.tar.gz -C /home/arduino-core .
RUN abuild checksum
RUN abuild -r

RUN mkdir -pv /home/build/tmp
ENV TMPDIR=/home/build/tmp
RUN mkdir /home/build/iso

COPY ./config/genapkovl-mkimgoverlay.sh /home/build/aports/scripts/genapkovl-mkimgoverlay.sh
COPY ./config/mkimg.virt-arduino.sh /home/build/aports/scripts/mkimg.virt-arduino.sh
COPY ./config/init.sh /home/init.sh
COPY ./config/custom-repositories /home/custom-repositories

USER root
RUN chmod +x /home/build/aports/scripts/mkimg.virt-arduino.sh
RUN chmod +x /home/build/aports/scripts/genapkovl-mkimgoverlay.sh
USER build
WORKDIR /home/build


CMD ["/bin/sh", "/home/init.sh"]
# CMD ["/bin/sh"]
