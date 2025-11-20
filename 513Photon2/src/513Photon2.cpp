/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#include "Particle.h"
#line 1 "/Users/sevengilbert/Desktop/ECE513FinalProject/513Photon2/src/513Photon2.ino"
void setup();
void loop();
#line 1 "/Users/sevengilbert/Desktop/ECE513FinalProject/513Photon2/src/513Photon2.ino"
int led = D7;

void setup() {
    pinMode(led, OUTPUT);
}

void loop(){
    digitalWrite(led, HIGH);

    String Photon2_513 = String(random(60,80));
    Particle.variable("Photon2_513", Photon2_513);
    Particle.publish("Photon2_513", Photon2_513, PRIVATE);
    delay(30000);
}