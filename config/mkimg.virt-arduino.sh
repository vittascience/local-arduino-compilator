profile_virt-arduino() {
        profile_virt                                     
        profile_abbrev="virt"                                           
        title="Virtual"                                         
        desc="Minimized virtual image with Arduino packages."                           
        arch="x86"                                  
        kernel_addons=                                            
        kernel_flavors="virt"                                                            
        syslinux_serial="0 115200" 
        apks="$apks avr-libc arduino-libs"
        apkovl="aports/scripts/genapkovl-mkimgoverlay.sh"
}