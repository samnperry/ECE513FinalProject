/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#line 1 "/Users/sevengilbert/Desktop/ECE513FinalProject/513Photon2/src/513Photon2.ino"
/////////////////////////////////////////////////////
// Connects Sensors to AWS through Particle Cloud. //
/////////////////////////////////////////////////////
#include "Particle.h"
#include "MAX30105.h"        // From SparkFun-MAX3010x library
#include "spo2_algorithm.h"  // From the same library

//SYSTEM_THREAD(ENABLED); // Optional

// Measurment Send Frequency (ms)
void setup();
void loop();
void sampleMax30102();
void sendMeasurement();
#line 11 "/Users/sevengilbert/Desktop/ECE513FinalProject/513Photon2/src/513Photon2.ino"
const unsigned long PUBLISH_INTERVAL_MS = 5000; // every 5 seconds

// Particle Vars
int LED = D7;
String trueDeviceId = "0a10aced202194944a064eec";
String deviceId;
unsigned long lastPublish = 0;

// Sensor Vars
MAX30105 particleSensor;            // for MAX3010x devices
const int BUFFER_LENGTH = 100;      // 4 seconds of data at 25 samples/sec
uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];

int32_t spo2 = 0;                  // Calculated SpO2
int8_t  validSPO2 = 0;             // 1 = valid, 0 = invalid
int32_t heartRate = 0;             // Calculated heart rate
int8_t  validHeartRate = 0;        // 1 = valid, 0 = invalid

int bufferIndex = 0;
bool bufferFilled = false;

const unsigned long SAMPLE_INTERVAL_MS = 40;  // 25 samples per second
unsigned long lastSampleTime = 0;

//-------//
// Setup //
//-------//
void setup() {
    // Init LED
    pinMode(LED, OUTPUT);
    digitalWrite(LED, LOW);
    RGB.control(true);             // Take control of the RGB LED
    RGB.color(0, 0, 255);          // Blue while starting

    // Serial Setup
    Serial.begin(115200);
    waitFor(Serial.isConnected, 5000); // optional, just for debugging

    // Particle: Get this device's unique ID: 0a10aced202194944a064eec
    deviceId = System.deviceID();
    Serial.println("True (expected) ID: " + trueDeviceId);
    Serial.println("Device ID: " + deviceId);

    // Sensor: init MAX30102 via lib
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println("MAX30102 was not found. Check wiring and power.");
        RGB.color(255, 0, 0);      // Red = fatal error
        while (1) {
            digitalWrite(LED, !digitalRead(LED));
            delay(250);
        }
    }

    // Sensor config
    byte ledBrightness = 60;    // 0–255; LED current
    byte sampleAverage = 4;     // 1, 2, 4, 8, 16, 32
    byte ledMode = 2;           // 2 = Red + IR
    byte sampleRate = 25;       // 25 samples/sec
    int  pulseWidth = 411;      // 69, 118, 215, 411
    int  adcRange = 4096;       // 2048, 4096, 8192, 16384

    particleSensor.setup(
        ledBrightness,
        sampleAverage,
        ledMode,
        sampleRate,
        pulseWidth,
        adcRange
    );

    // Turn on LEDs (low brightness to start)
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeIR(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);  // Green LED not used

    RGB.color(0, 255, 0);        // Green = sensor ready
    Serial.println("MAX30102 initialized.");
}

//-----------//
// Main loop //
//-----------//
void loop() {
    sampleMax30102();      // update heartRate & spo2

    unsigned long now = millis();

    if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
        lastPublish = now;

        bool hasValid = (validHeartRate == 1 && validSPO2 == 1);

        if (hasValid) {
            // Toggle LED and show green when readings are valid
            digitalWrite(LED, !digitalRead(LED));
            RGB.color(0, 255, 0);
        } else {
            // Solid LED off and RGB orange while waiting for valid data
            digitalWrite(LED, LOW);
            RGB.color(255, 100, 0);
        }

        /// Debug 
        Serial.print("HR = ");
        Serial.print(heartRate);
        Serial.print(" bpm (valid=");
        Serial.print(validHeartRate);
        Serial.print("), SpO2 = ");
        Serial.print(spo2);
        Serial.print(" % (valid=");
        Serial.print(validSPO2);
        Serial.println(")");
        //*/
        
        if (hasValid) {
            sendMeasurement();  // publish event for webhook
        }
    }
}

//-----------//
// Functions //
//-----------//
void sampleMax30102() {
    /*// For demo/testing:
        heartRate = random(40,120);  // bpm
        spo2 = random(50,100);       // %
    //*/

    /// Real Measure Start
        unsigned long now = millis();
        if (now - lastSampleTime < SAMPLE_INTERVAL_MS) {
            return; // Not time for next sample yet
        }
        lastSampleTime = now;

        // Make sure FIFO has data
        if (!particleSensor.available()) {
            particleSensor.check();             // Pull new data from sensor
            if (!particleSensor.available()) {
                return;                         // Still nothing
            }
        }

        // Read one sample into circular buffers
        redBuffer[bufferIndex] = particleSensor.getRed();
        irBuffer[bufferIndex]  = particleSensor.getIR();
        particleSensor.nextSample();       // Advance to next FIFO sample

        bufferIndex++;
        if (bufferIndex >= BUFFER_LENGTH) {
            bufferIndex = 0;
            bufferFilled = true;
        }

        // Once we have a full buffer, run the HR/SpO2 algorithm each new sample
        if (bufferFilled) {
            maxim_heart_rate_and_oxygen_saturation(
                irBuffer,
                BUFFER_LENGTH,
                redBuffer,
                &spo2,
                &validSPO2,
                &heartRate,
                &validHeartRate
            );
        }
    //*/ End Real Measure
}

void sendMeasurement() {
    // Unix timestamp
    unsigned long ts = Time.now();

    // JSON Example Payload:
    // {
    //   "deviceId": "abc123",
    //   "heartRate": 72,
    //   "spo2": 98,
    //   "timestamp": 1700000000
    // }

    String payload = String::format(
        "{"
          "\"deviceId\":\"%s\","
          "\"heartRate\":%d,"
          "\"spo2\":%d,"
          "\"timestamp\":%lu"
        "}",
        deviceId.c_str(),
        heartRate,
        spo2,
        ts
    );

    bool ok = Particle.publish("Photon2_SendEvent", payload, PRIVATE);

    if (ok) {
        Serial.println("Published: " + payload);
    } else {
        Serial.println("Publish failed");
    }
}