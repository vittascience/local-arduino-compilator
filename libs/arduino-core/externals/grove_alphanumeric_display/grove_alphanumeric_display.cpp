/*
    grove_alphanumeric_display.cpp
    A library for Grove - grove_alphanumeric_display

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

#include "grove_alphanumeric_display.h"
#include "Wire.h"


uint16_t g_display_font4[] = {
    // 0x0000,                 // display nothing.
    0x0080,                 // 'upper .'
    0x2000,                 // 'lower .'
    0x4478,                 // '0'
    0x0060,                 // '1'
    0x0758,                 // '2'
    0x0770,                 // '3'
    0x4360,                 // '4'
    0x4730,                 // '5'
    0x4738,                 // '6'
    0x0070,                 // '7'
    0x4778,                 // '8'
    0x4770,                 // '9'
    0x4378,                 // 'A'
    0x2d70,                 // 'B'
    0x4418,                 // 'C'
    0x2c70,                 // 'D'
    0x4718,                 // 'E'
    0x4318,                 // 'F'
    0x4538,                 // 'G'
    0x4368,                 // 'H'
    0x2c10,                 // 'I'
    0x0478,                 // 'J'
    0x2806,                 // 'K'
    0x4408,                 // 'L'
    0x40ea,                 // 'M'
    0x40ec,                 // 'N'
    0x4478,                 // 'O'
    0x4358,                 // 'P'
    0x447c,                 // 'Q'
    0x435c,                 // 'R'
    0x0494,                 // 'S'
    0x2810,                 // 'T'
    0x4468,                 // 'U'
    0x500a,                 // 'V'
    0x506c,                 // 'W'
    0x1086,                 // 'X'
    0x0882,                 // 'Y'
    0x1412,                 // 'Z'
    0x0000,                 //  '/' ilegal num
};



#define LAST_ITEM 38
uint16_t g_display_font2[] = {
    // 0x0000,                 // display nothing.
    0x4000,                 // '.'
    0x0000,                 //  '/'   display nothing.
    0xa145,                 // '0'
    0x8001,                 // '1'
    0x3107,                 // '2'
    0xb007,                 // '3'
    0x9043,                 // '4'
    0xb046,                 // '5'
    0xb146,                 // '6'
    0x8005,                 // '7'
    0xb147,                 // '8'
    0xb047,                 // '9'
    0x9147,                 // 'A'
    0xb415,                 // 'B'
    0x2144,                 // 'C'
    0xa415,                 // 'D'
    0x3146,                 // 'E'
    0x1146,                 // 'F'
    0xb144,                 // 'G'
    0x9143,                 // 'H'
    0x2414,                 // 'I'
    0xA101,                 // 'J'
    0x0c18,                 // 'K'
    0x2140,                 // 'L'
    0x8169,                 // 'M'
    0x8961,                 // 'N'
    0xa145,                 // 'O'
    0x1147,                 // 'P'
    0xa945,                 // 'Q'
    0x1947,                 // 'R'
    0x2824,                 // 'S'
    0x0414,                 // 'T'
    0xa141,                 // 'U'
    0x8821,                 // 'V'
    0x8b41,                 // 'W'
    0x0a28,                 // 'X'
    0x0428,                 // 'Y'
    0x220c,                 // 'Z'
    0x0000,                 // ilegal num
};

uint16_t segments4Tubes[] = {0x10, 0x4000, 0x80, 0x40, 0x2, 0x2000, 0x200, 0x100, 0x400, 0x8, 0x1000, 0x20, 0x4, 0x800};
uint16_t segments2Tubes[] = {0x4, 0x40, 0x20, 0x1, 0x8, 0x10, 0x2, 0x1000, 0x2000, 0x100, 0x200, 0x8000, 0x800, 0x400};

Seeed_Digital_Tube::Seeed_Digital_Tube() {

    _ms = 100;
}


void Seeed_Digital_Tube::setTubeType(TubeType_t type, uint8_t addr) {
    _type = type;
    (_type == TYPE_2) ? (_tube_cnt = CNT_2) : (_tube_cnt = CNT_4);
    (_type == TYPE_2) ? (disp_font_p = g_display_font2) : (disp_font_p = g_display_font4);
    HT16K33::init(addr);
}

bool Seeed_Digital_Tube::isLegalToDisplay(char byte) {
    if (!((byte >= '.' && byte <= '9') || (byte >= 'A' && byte <= 'Z') || (byte >= 'a' && byte <= 'z'))) {
        return false;
    }
    return true;
}




/** @brief Display number,If the param-num's len less than 4(or equal to),The tubes display static number,otherwise,it displays scroll number.
    When it displays scroll number,the param interval is scrolling interval(ms) ..
    @param num the number to display.
    @param interval :the interval of scroll number.
 * */
void Seeed_Digital_Tube::displayNum(uint32_t num, uint32_t interval) {
    char num_str[15] = {0};
    sprintf(num_str, "%ld", (uint32_t)num);
    displayString(num_str, interval);
}



void Seeed_Digital_Tube::shiftDisplay(char* origin_disp_buf, char new_item) {
    char temp[MAX_TUBE_COUNT] = {0};

    memcpy(temp, &origin_disp_buf[1], _tube_cnt - 1);

    temp[_tube_cnt - 1] = new_item;

    memcpy(origin_disp_buf, temp, _tube_cnt);

    for (int i = 0; i < _tube_cnt; i++) {
        setTubeBuf((TubeNum)(i + 1), temp[i]);

    }
    writeBytes(_addr, 0x00, 16, _buffer);
    delay(_ms);
}

/** @brief Display string,If the param-str's len less than 4(or equal to),The tubes display static string,otherwise,it displays scroll string.
    When it displays scroll string,the param interval is scrolling interval(ms) ..
    @param str the str to display.
    @param interval :the interval of scroll string.
 * */
void Seeed_Digital_Tube::displayString(char* str, uint32_t interval) {
    int len = 0;
    clearBuf();

    len = strlen(str);

    if (_tube_cnt >= len) {
        for (int i = 0; i < len; i++) {
            //setTubeBuf((TubeNum)(_tube_cnt-len+i+1),disp_font_p[get_char_index(str[i])]);  //Convert number to char;
            setTubeBuf((TubeNum)(_tube_cnt - len + i + 1), str[i]); //Convert number to char;
        }
        writeBytes(_addr, 0x00, 16, _buffer);
        delay(_ms);
    } else {
        if (len > 255) {
            len = 255;
        }
        char origin_disp_buf[MAX_TUBE_COUNT] = {0};

        for (int i = 0; i < len; i++) {
            shiftDisplay(origin_disp_buf, str[i]);
            delay(interval);
        }
        for (int i = 0; i < _tube_cnt; i++) {
            shiftDisplay(origin_disp_buf, 0);
            delay(interval);
        }

    }
}


void Seeed_Digital_Tube::clear() {
    memset(_buffer, 0, sizeof(_buffer));
    writeBytes(_addr, 0x00, 16, _buffer);
    delay(_ms);
}


void Seeed_Digital_Tube::fulDisplay() {
    uint8_t buf[16] = {0};
    memcpy(_buffer, buf, sizeof(buf));
    memset(_buffer, 0xff, sizeof(_buffer));
    writeBytes(_addr, 0x00, 16, _buffer);
    delay(_ms);
}

/** There are some differences of the hardware design of two kinds of display(two & four tubes).
    two digital tubes use _buffer[2,3,4,5] to control display.
    four digital tubes use _buffer[2,3,4,5,6,7,8,9,10,11] to control display.

 **/
void Seeed_Digital_Tube::replace_bit12(TubeNum tube_num, bool bit1, bool bit2) {
    switch (tube_num) {
        case FIRST_TUBE:
            _buffer[10] &= ~(1 << 4);
            _buffer[10] &= ~(1 << 3);

            _buffer[10] |= (bit1 << 4);
            _buffer[10] |= (bit2 << 3);
            break;
        case SECOND_TUBE:

            _buffer[10] &= ~(1 << 6);
            _buffer[11] &= ~(1 << 6);

            _buffer[10] |= (bit1 << 6);
            _buffer[11] |= (bit2 << 6);
            break;
        case THIRD_TUBE:
            _buffer[10] &= ~(1 << 5);
            _buffer[11] &= ~(1 << 1);

            _buffer[10] |= (bit1 << 5);
            _buffer[11] |= (bit2 << 1);
            break;
        case FOURTH_TUBE:
            _buffer[11] &= ~(1 << 2);
            _buffer[11] &= ~(1 << 0);

            _buffer[11] |= (bit1 << 2);
            _buffer[11] |= (bit2 << 0);
            break;
        default: break;
    }
}

void Seeed_Digital_Tube::setPoint(bool first_dot, bool second_dot) {
    if (TYPE_4 == _type) {
        //upper dot control
        if (first_dot) {
            _buffer[10] |= disp_font_p[0];
            _buffer[11] |= disp_font_p[0] >> 8;
        }
        //lower dot control
        if (second_dot) {
            _buffer[10] |= disp_font_p[1];
            _buffer[11] |= disp_font_p[1] >> 8;
        }
    } else if (TYPE_2 == _type) {
        if (first_dot) {
            _buffer[SECOND_TUBE * 2] |= disp_font_p[0] >> 8;
        }

        if (second_dot)

        {
            _buffer[FIRST_TUBE * 2] |= disp_font_p[0] >> 8;
        }
    } else {}
}

void Seeed_Digital_Tube::setTubeSegments(TubeNum tube_num, uint16_t segments) {
    uint16_t value = 0;

    if (TYPE_4 == _type) {
        for (int i = 0; i < 16; i++) {
            if (bitRead(segments, i) == 1) {
                value += segments4Tubes[i];
            }
        }

        _buffer[tube_num * 2] = value;
        _buffer[tube_num * 2 + 1] = value >> 8;
        replace_bit12(tube_num, value & 0x02, value & 0x04);
    } else if (TYPE_2 == _type) {
        for (int i = 0; i < 16; i++) {
            if (bitRead(segments, i) == 1) {
                value += segments2Tubes[i];
            }
        }

        // Set tube_num to 1 if it's 2, and 2 if it's 1, so that it's compatible with the hardware.
        tube_num = (TubeNum)(((int)tube_num + 1) & (~(int)tube_num));

        _buffer[tube_num * 2] = value >> 8;
        _buffer[tube_num * 2 + 1] = value;
    }
}

void Seeed_Digital_Tube::setTubeBuf(TubeNum tube_num, char byte) {
    uint16_t value = disp_font_p[get_char_index(byte)];

    if (TYPE_4 == _type) {


        _buffer[tube_num * 2] = value;
        _buffer[tube_num * 2 + 1] = value >> 8;
        replace_bit12(tube_num, value & 0x02, value & 0x04);
    } else if (TYPE_2 == _type) {
        if (false == isLegalToDisplay(byte)) {
            byte = '/';
        }
        //if first,set to 2,if second ,set to 1. To compatible with the hardware.
        tube_num = (TubeNum)(((int)tube_num + 1) & (~(int)tube_num));

        if (byte >= 'a' && byte <= 'z') {
            byte -= 32;
        }

        if ((byte >= '.' && byte <= '9')) {
            _buffer[tube_num * 2] = disp_font_p[byte - '0' + 2] >> 8;
            _buffer[tube_num * 2 + 1] = disp_font_p[byte - '0' + 2];
        } else {
            _buffer[tube_num * 2] = disp_font_p[byte - 'A' + 10 + 2] >> 8;
            _buffer[tube_num * 2 + 1] = disp_font_p[byte - 'A' + 10 + 2];
        }
    }

}



/** @brief Specify the display char of a digital tube.
    @param tube_num The number of tube ,total 4.
    @param c ,The char to display
 * */
void Seeed_Digital_Tube::setTubeSingleChar(TubeNum tube_num, char c) {
    if (!(((c >= 'A') && (c <= 'Z')) || ((c >= 'a') && (c <= 'z')) || (c == '.'))) {
        return ;
    }
    if (TYPE_4 == _type) {
        setTubeBuf(tube_num, c);
    } else if (TYPE_2 == _type) {
        if (tube_num > SECOND_TUBE) {
            return;
        }

        setTubeBuf(tube_num, c);
    } else {
    }
}

/** @brief Specify the display number of a digital tube.
    @param tube_num The number of tube ,total 4.
    @param num ,The number to display
 * */
void Seeed_Digital_Tube::setTubeSingleNum(TubeNum tube_num, char num) {
    if (!((num >= 0) && (num <= 9))) {
        return ;
    }
    if (TYPE_4 == _type) {
        setTubeBuf(tube_num, num + 0x30);
    } else if (TYPE_2 == _type) {
        if (tube_num > SECOND_TUBE) {
            return;
        }

        setTubeBuf(tube_num, num + 0x30);
    } else {
    }

}


void Seeed_Digital_Tube::display_one_tube(TubeNum tube_num, uint16_t value) {
    _buffer[tube_num * 2] = value;
    _buffer[tube_num * 2 + 1] = value >> 8;
    replace_bit12(tube_num, value & 0x02, value & 0x04);
    writeBytes(_addr, 0x00, 16, _buffer);
    delay(_ms);
}


void Seeed_Digital_Tube::clearBuf() {
    memset(_buffer, 0, sizeof(_buffer));
}

int Seeed_Digital_Tube::get_char_index(char c) {
    if ((c >= '0') && (c <= '9')) {
        return c - 0x30 + 2;
    } else if ((c >= 'A') && (c <= 'Z')) {
        return c - 0x37 + 2;
    } else if ((c >= 'a') && (c <= 'z')) {
        return c - 0x57 + 2;
    } else {
        return LAST_ITEM;
    }
}


void Seeed_Digital_Tube::display() {
    writeBytes(_addr, 0x00, 16, _buffer);
    delay(_ms);
}





