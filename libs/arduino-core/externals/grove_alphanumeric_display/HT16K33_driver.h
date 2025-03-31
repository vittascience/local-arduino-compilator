/*
    HT16K33_driver.h
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
#ifndef __HT16K33_DRIVER_H_
#define __HT16K33_DRIVER_H_


#include <Arduino.h>
#include "Wire.h"





enum orientation_type_t {
    DISPLAY_ROTATE_0 = 0,
    DISPLAY_ROTATE_90,
    DISPLAY_ROTATE_180,
    DISPLAY_ROTATE_270,
};

enum action_type_t {
    ACTION_SCROLLING = 0,
    ACTION_SHIFT,
};

enum blink_type_t {
    BLINK_OFF = 0,
    BLINK_2HZ,
    BLINK_1HZ,
};


class HT16K33 {
  public:
    HT16K33() {};

    void init(uint8_t addr);

    void setBlinkRate(blink_type_t blink_type);

    void setBrightness(uint8_t brightness);

    virtual void clear();

    bool writeBytes(uint8_t devAddr, uint8_t regAddr, uint8_t length, uint8_t* data);

  protected:
    uint8_t _addr;
};





#endif



