#include <Arduino.h>
#include <stdlib.h>

unsigned long countPulseASM(volatile uint8_t *port, uint8_t bit, uint8_t stateMask, unsigned long maxloops);