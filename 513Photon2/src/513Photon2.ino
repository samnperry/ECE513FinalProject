SYSTEM_THREAD(ENABLED); // uncomment this to use your particle device without WIFI connection
int counter = 0;
int LED = D7;
// setup() runs once, when the device is first turned on.
void setup() {

    
// Put initialization like pinMode and begin functions here.
    pinMode(LED, OUTPUT);
    RGB.control(true); // take control of the RGB LED
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
    delay(1000);
}