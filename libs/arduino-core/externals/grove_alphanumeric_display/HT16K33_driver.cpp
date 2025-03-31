/*
    HT16K33_driver.cpp
    A library for Grove - grove_quad_alphanumeric_display

    Copyright (c) 2018 seeed technology inc.
    Website    : www.seeed.cc
    Author     : Jerry Yip
    Create Time: 2018-06
    Version    : 0.1
    Change Log :
    Copyright (c) 2018 seeed technology inc.
    Website    : www.seeed.cc
    Author     : downey
    Create Time: 2018-06
    Version    : 1.1
    Change Log :for digital tube development.

    The MIT License (MIT)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/
#include <Arduino.h>
#include "HT16K33_driver.h"



bool HT16K33::writeBytes(uint8_t devAddr, uint8_t regAddr, uint8_t length, uint8_t* data) {
    Wire.beginTransmission(devAddr);
    Wire.write((uint8_t) regAddr);
    for (uint8_t i = 0; i < length; i++) {
        Wire.write((uint8_t) data[i]);
    }
    Wire.endTransmission();
}



void HT16K33::init(uint8_t addr) {
    _addr = addr;
    // turn on oscillator
    writeBytes(_addr, 0x21, 0, (uint8_t*)NULL);
}

/*brightness:0-15*/
void HT16K33::setBrightness(uint8_t brightness) {
    writeBytes(_addr, (0xE0 | brightness), 0, (uint8_t*)NULL);
}


void HT16K33::setBlinkRate(blink_type_t blink_type) {
    writeBytes(_addr, (0x80 | 0x01 | (blink_type << 1)), 0, (uint8_t*)NULL);
}

void HT16K33::clear() {

}

