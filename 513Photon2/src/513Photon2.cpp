/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#include "Particle.h"
#line 1 "/Users/sevengilbert/Desktop/ECE513FinalProject/513Photon2/src/513Photon2.ino"
void setup();
void loop();
#line 1 "/Users/sevengilbert/Desktop/ECE513FinalProject/513Photon2/src/513Photon2.ino"
SYSTEM_THREAD(ENABLED); // uncomment this to use your particle device without WIFI connection
int counter = 0;
int LED = D7;
// setup() runs once, when the device is first turned on.
void setup() {
// Put initialization like pinMode and begin functions here.
pinMode(LED, OUTPUT);
RGB.control(true); // take control of the RGB LED
Serial.begin();
}
// loop() runs over and over again, as quickly as it can execute.
void loop() {
// The core of your code will likely live here.
if (counter % 2 == 0) {
digitalWrite(LED, HIGH);
RGB.color(255, 0, 0); // set color red
}
else {
digitalWrite(LED, LOW);
RGB.color(0, 255, 0); // set color green
}
counter++;
Serial.printf("{\"t\":%d,\"str\":\"%s\"}", (int)Time.now(), Time.timeStr().c_str());
Serial.println(); // \r\n
delay(1000);
}