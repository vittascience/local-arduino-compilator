#!/bin/sh
cd /home/build
cp -R -f /home/build/packages/community/ /home/shared-packages
sh -x aports/scripts/mkimage.sh --tag edge \
	--outdir iso \
	--arch x86 \
	--repository https://dl-cdn.alpinelinux.org/alpine/edge/main \
	--repository https://dl-cdn.alpinelinux.org/alpine/edge/community \
	--repositories-file /home/custom-repositories \
	--profile virt-arduino

mv -f iso/alpine-virt-arduino-edge-x86.iso /home/iso-builder/alpine-virt-arduino-edge-x86.iso