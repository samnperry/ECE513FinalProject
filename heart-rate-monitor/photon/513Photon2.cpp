/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#line 1 "/Users/sevengilbert/Desktop/ECE513FinalProject/heart-rate-monitor/photon/513Photon2.ino"
/////////////////////////////////////////////////////
// Connects Sensors to AWS through Particle Cloud. //
// State-machine restructure (ECE 513 requirements) //
/////////////////////////////////////////////////////

#include "Particle.h"
#include "MAX30105.h"        // SparkFun-MAX3010x
#include "spo2_algorithm.h"  // Same library

int recordAddr(uint16_t idx);
void queueSaveHeader();
void queueLoadOrInit();
uint16_t queueCount();
bool queuePopOldest();
void queuePruneOlderThan24h();
void onHookResponse(const char *event, const char *data);
void onHookError(const char *event, const char *data);
void setRgb(uint8_t r, uint8_t g, uint8_t b);
void updateRgb(unsigned long now);
bool isOnline();
bool withinAllowedHours();
uint32_t bestEffortTimestamp();
void resetAcquisitionBuffers();
void updateMax30102();
void setup();
void loop();
#line 10 "/Users/sevengilbert/Desktop/ECE513FinalProject/heart-rate-monitor/photon/513Photon2.ino"
SYSTEM_THREAD(ENABLED); // keeps loop() responsive during cloud reconnects

// -------------------- Defaults / Requirements --------------------
const unsigned long MEASUREMENT_INTERVAL_MS = 5UL * 60UL * 1000UL; // default: 30 min
const unsigned long PROMPT_WINDOW_MS        = 5UL  * 60UL * 1000UL; // prompt window: 5 min
const unsigned long LED_BLINK_MS            = 500;                  // blink speed
const unsigned long SAMPLE_INTERVAL_MS      = 40;                   // 25 Hz sampling
const unsigned long ACK_TIMEOUT_MS          = 10UL * 1000UL;        // wait for webhook response

const uint8_t ALLOWED_START_HOUR = 6;   // 6am
const uint8_t ALLOWED_END_HOUR   = 22;  // 10pm (exclusive)

const uint32_t FINGER_IR_THRESHOLD = 20000; // tune for your sensor/module
const uint8_t  STABLE_REQUIRED     = 6;     // consecutive valid algorithm outputs needed

// Particle webhook event name (must match your webhook trigger)
const char* MEAS_EVENT = "Photon2_SendEvent";

// Backend API key requirement (put your real key here)
const char* API_KEY = "REPLACE_WITH_REAL_API_KEY";

// -------------------- D7 (optional debug LED) --------------------
const int LED_D7 = D7;

// -------------------- Particle Vars --------------------
String deviceId;

// -------------------- Sensor Vars --------------------
MAX30105 particleSensor;

static const int BUFFER_LENGTH = 100; // 4 seconds at 25 Hz
uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];

int32_t spo2 = 0;
int8_t  validSPO2 = 0;
int32_t heartRate = 0;
int8_t  validHeartRate = 0;

unsigned long lastSampleTime = 0;
int  bufferIndex   = 0;
bool bufferFilled  = false;

uint32_t lastIR  = 0;
uint32_t lastRed = 0;

// -------------------- Offline Queue in EEPROM --------------------
// Stores up to ~24h worth at 30-min interval (48 samples). Capacity 64 gives margin.
struct MeasurementRecord {
  uint32_t timestamp;   // Unix seconds (best-effort)
  int16_t  heartRate;
  int16_t  spo2;
  uint16_t reserved;    // alignment / future use
};

struct QueueHeader {
  uint32_t magic;
  uint16_t head;        // index of oldest
  uint16_t count;       // number of valid records
};

const uint32_t QUEUE_MAGIC    = 0x51305130; // "5130"-ish marker
const uint16_t QUEUE_CAPACITY = 64;
const int EEPROM_ADDR_HEADER  = 0;
const int EEPROM_ADDR_RECORDS = EEPROM_ADDR_HEADER + sizeof(QueueHeader);

QueueHeader qh;

int recordAddr(uint16_t idx) {
  return EEPROM_ADDR_RECORDS + (int)(idx * sizeof(MeasurementRecord));
}

void queueSaveHeader() {
  EEPROM.put(EEPROM_ADDR_HEADER, qh);
}

void queueLoadOrInit() {
  EEPROM.get(EEPROM_ADDR_HEADER, qh);
  if (qh.magic != QUEUE_MAGIC || qh.count > QUEUE_CAPACITY || qh.head >= QUEUE_CAPACITY) {
    qh.magic = QUEUE_MAGIC;
    qh.head  = 0;
    qh.count = 0;
    queueSaveHeader();
  }
}

uint16_t queueCount() { return qh.count; }

bool queuePeekOldest(MeasurementRecord &out) {
  if (qh.count == 0) return false;
  EEPROM.get(recordAddr(qh.head), out);
  return true;
}

bool queuePopOldest() {
  if (qh.count == 0) return false;
  qh.head = (qh.head + 1) % QUEUE_CAPACITY;
  qh.count--;
  queueSaveHeader();
  return true;
}

bool queuePush(const MeasurementRecord &rec) {
  uint16_t writeIdx = (qh.head + qh.count) % QUEUE_CAPACITY;

  // If full, overwrite oldest (advance head)
  if (qh.count == QUEUE_CAPACITY) {
    qh.head = (qh.head + 1) % QUEUE_CAPACITY;
    qh.count = QUEUE_CAPACITY - 1;
    writeIdx = (qh.head + qh.count) % QUEUE_CAPACITY;
  }

  EEPROM.put(recordAddr(writeIdx), rec);
  qh.count++;
  queueSaveHeader();
  return true;
}

// Best-effort prune: only when Time is valid.
void queuePruneOlderThan24h() {
  if (!Time.isValid()) return;

  const uint32_t now = Time.now();
  const uint32_t maxAge = 24UL * 60UL * 60UL;

  while (qh.count > 0) {
    MeasurementRecord r;
    if (!queuePeekOldest(r)) break;

    // If timestamp looks invalid, keep it rather than accidentally dropping.
    if (r.timestamp == 0) break;

    if ((now - r.timestamp) > maxAge) {
      queuePopOldest();
    } else {
      break;
    }
  }
}

// -------------------- Webhook ACK tracking --------------------
// Webhook response events are typically:
//   hook-response/<eventName>/...
//   hook-error/<eventName>/...
volatile bool g_hookReceived = false;
volatile bool g_hookSuccess  = false;

void onHookResponse(const char *event, const char *data) {
  (void)event; (void)data;
  g_hookReceived = true;
  g_hookSuccess  = true;
}

void onHookError(const char *event, const char *data) {
  (void)event; (void)data;
  g_hookReceived = true;
  g_hookSuccess  = false;
}

// -------------------- LED Helpers (non-blocking) --------------------
enum RgbMode : uint8_t {
  RGB_OFF,
  RGB_SOLID_ORANGE,
  RGB_SOLID_RED,
  RGB_BLINK_BLUE,
  RGB_SOLID_GREEN,
  RGB_SOLID_YELLOW
};

RgbMode rgbMode = RGB_OFF;
bool rgbBlinkOn = false;
unsigned long lastRgbToggleMs = 0;

void setRgb(uint8_t r, uint8_t g, uint8_t b) {
  RGB.color(r, g, b);
}

void setRgbMode(RgbMode m) {
  rgbMode = m;
  rgbBlinkOn = false;
  lastRgbToggleMs = millis();

  switch (rgbMode) {
    case RGB_OFF:          setRgb(0, 0, 0); break;
    case RGB_SOLID_ORANGE: setRgb(255, 165, 0); break;
    case RGB_SOLID_RED:    setRgb(255, 0, 0); break;
    case RGB_SOLID_GREEN:  setRgb(0, 255, 0); break;
    case RGB_SOLID_YELLOW: setRgb(255, 255, 0); break;
    case RGB_BLINK_BLUE:   setRgb(0, 0, 255); rgbBlinkOn = true; break;
  }
}

void updateRgb(unsigned long now) {
  if (rgbMode == RGB_BLINK_BLUE) {
    if (now - lastRgbToggleMs >= LED_BLINK_MS) {
      lastRgbToggleMs = now;
      rgbBlinkOn = !rgbBlinkOn;
      if (rgbBlinkOn) setRgb(0, 0, 255);
      else            setRgb(0, 0, 0);
    }
  }
}

// -------------------- State Machine --------------------
enum AppState : uint8_t {
  STATE_BOOT = 0,
  STATE_IDLE_WAIT,
  STATE_PROMPT_USER,
  STATE_ACQUIRE,
  STATE_MEASUREMENT_READY,
  STATE_SEND_PENDING,
  STATE_WAIT_SERVER_ACK,
  STATE_STORE_OFFLINE,
  STATE_FLUSH_BACKLOG,
  STATE_FLASH_GREEN,
  STATE_FLASH_YELLOW,
  STATE_ERROR_FATAL
};

AppState state = STATE_BOOT;
unsigned long stateEnterMs = 0;

unsigned long nextPromptMs      = 0;
unsigned long promptSessionMs   = 0;  // start of 5-min prompt window
unsigned long sendStartMs       = 0;
unsigned long flashEndMs        = 0;

uint8_t stableCount = 0;

MeasurementRecord pending;
bool pendingValid     = false;
bool pendingFromQueue = false;

bool isOnline() {
  // "connected to Wi-Fi" in practice means we can publish + receive hook-response
  return WiFi.ready() && Particle.connected();
}

bool withinAllowedHours() {
  if (!Time.isValid()) return true; // best-effort when time unknown
  int h = Time.hour();
  if (ALLOWED_START_HOUR < ALLOWED_END_HOUR) {
    return (h >= ALLOWED_START_HOUR && h < ALLOWED_END_HOUR);
  }
  // wraparound case (not used here, but safe)
  return (h >= ALLOWED_START_HOUR || h < ALLOWED_END_HOUR);
}

uint32_t bestEffortTimestamp() {
  // If RTC synced at least once, Time.now() stays usable even if Wi-Fi drops.
  if (Time.isValid()) return Time.now();
  return 0; // backend can also timestamp on receipt
}

void resetAcquisitionBuffers() {
  bufferIndex  = 0;
  bufferFilled = false;
  stableCount  = 0;
  lastSampleTime = 0;
  validSPO2 = 0;
  validHeartRate = 0;

  // Clear FIFO to start clean
  particleSensor.clearFIFO();
}

// Reads one sample when it's time; updates lastIR/lastRed and runs algorithm when bufferFilled.
void updateMax30102() {
  unsigned long now = millis();
  if (now - lastSampleTime < SAMPLE_INTERVAL_MS) return;
  lastSampleTime = now;

  if (!particleSensor.available()) {
    particleSensor.check();
    if (!particleSensor.available()) return;
  }

  lastRed = particleSensor.getRed();
  lastIR  = particleSensor.getIR();

  redBuffer[bufferIndex] = lastRed;
  irBuffer[bufferIndex]  = lastIR;

  particleSensor.nextSample();

  bufferIndex++;
  if (bufferIndex >= BUFFER_LENGTH) {
    bufferIndex = 0;
    bufferFilled = true;
  }

  if (bufferFilled) {
    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, BUFFER_LENGTH,
      redBuffer,
      &spo2, &validSPO2,
      &heartRate, &validHeartRate
    );
  }

    // Debug print (throttled)
    static unsigned long lastPrintMs = 0;
    if (lastPrintMs == 0) lastPrintMs = now;

    if (now - lastPrintMs >= 500) { // ~2 prints/sec
    lastPrintMs = now;

    Serial.printf(
        "[MAX30102] IR=%lu  RED=%lu  BPM=%d (v=%d)  SpO2=%.d%% (v=%d)  bufFilled=%d  state=%d\n",
        (unsigned long)lastIR,
        (unsigned long)lastRed,
        (int)heartRate, (int)validHeartRate,
        (int)spo2,      (int)validSPO2,
        (int)bufferFilled,
        (int)state
    );

  }
}

bool publishMeasurement(const MeasurementRecord &rec) {
  // Build JSON payload
  String payload = String::format(
    "{"
      "\"deviceId\":\"%s\","
      "\"heartRate\":%d,"
      "\"spo2\":%d,"
      "\"timestamp\":%lu,"
      "\"apiKey\":\"%s\""
    "}",
    deviceId.c_str(),
    (int)rec.heartRate,
    (int)rec.spo2,
    (unsigned long)rec.timestamp,
    API_KEY
  );

  return Particle.publish(MEAS_EVENT, payload, PRIVATE);
}

void enterState(AppState s) {
  state = s;
  stateEnterMs = millis();

  switch (state) {
    case STATE_IDLE_WAIT:
      Serial.println("\n[STATE] STATE_IDLE_WAIT");
      setRgbMode(RGB_OFF);
      digitalWrite(LED_D7, LOW);
      break;

    case STATE_PROMPT_USER:
      Serial.println("\n[STATE] STATE_PROMPT_USER");
      setRgbMode(RGB_BLINK_BLUE);
      digitalWrite(LED_D7, LOW);
      break;

    case STATE_ACQUIRE:
      Serial.println("\n[STATE] STATE_ACQUIRE");
      setRgbMode(RGB_SOLID_ORANGE);
      digitalWrite(LED_D7, HIGH);
      break;

    case STATE_MEASUREMENT_READY:
      Serial.println("\n[STATE] STATE_MEASUREMENT_READY");
      break;

    case STATE_SEND_PENDING:
      Serial.println("\n[STATE] STATE_SEND_PENDING");
      break;

    case STATE_WAIT_SERVER_ACK:
      Serial.println("\n[STATE] STATE_WAIT_SERVER_ACK");
      setRgbMode(RGB_SOLID_ORANGE);
      break;

    case STATE_STORE_OFFLINE:
      Serial.println("\n[STATE] STATE_STORE_OFFLINE");
      break;

    case STATE_FLUSH_BACKLOG:
      Serial.println("\n[STATE] STATE_FLUSH_BACKLOG");
      break;

    case STATE_FLASH_GREEN:
      Serial.println("\n[STATE] STATE_FLASH_GREEN");
      setRgbMode(RGB_SOLID_GREEN);
      flashEndMs = millis() + 300;
      break;

    case STATE_FLASH_YELLOW:
      Serial.println("\n[STATE] STATE_FLASH_YELLOW");
      setRgbMode(RGB_SOLID_YELLOW);
      flashEndMs = millis() + 300;
      break;

    case STATE_ERROR_FATAL:
      Serial.println("\n[STATE] STATE_ERROR_FATAL");
      setRgbMode(RGB_SOLID_RED);
      break;

    default:
      Serial.println("\n[STATE] STATE_UNKNOWN");
      break;
  }
}


// -------------------- setup / loop --------------------
void setup() {
  pinMode(LED_D7, OUTPUT);
  digitalWrite(LED_D7, LOW);

  Serial.begin(115200);
  waitFor(Serial.isConnected, 3000);

  deviceId = System.deviceID();
  Serial.println("Device ID: " + deviceId);

  RGB.control(true);
  setRgbMode(RGB_OFF);

  // Offline queue init
  queueLoadOrInit();

  // Subscribe to webhook response/error for ACK behavior
  Particle.subscribe(String::format("hook-response/%s", MEAS_EVENT), onHookResponse, MY_DEVICES);
  Particle.subscribe(String::format("hook-error/%s",    MEAS_EVENT), onHookError,    MY_DEVICES);

  // Sensor init
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring/power.");
    enterState(STATE_ERROR_FATAL);
    return;
  }

  // Sensor config (your existing settings)
  byte ledBrightness = 60;
  byte sampleAverage = 4;
  byte ledMode       = 2;   // Red + IR
  byte sampleRate    = 25;
  int  pulseWidth    = 411;
  int  adcRange      = 4096;

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeIR(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  Serial.println("MAX30102 initialized.");

  // Start schedule: prompt soon on boot (change to MEASUREMENT_INTERVAL_MS if you want strict cadence)
  nextPromptMs = millis() + 2000;

  enterState(STATE_IDLE_WAIT);
}

void loop() {
  const unsigned long now = millis();

  if (state == STATE_ERROR_FATAL) {
    // Non-blocking “fatal” indicator (blink D7 while RGB solid red)
    if ((now / 250) % 2 == 0) digitalWrite(LED_D7, HIGH);
    else                      digitalWrite(LED_D7, LOW);
    return;
  }

  // Always keep LED patterns updated
  updateRgb(now);

  // Best-effort prune (only when RTC valid)
  queuePruneOlderThan24h();

  switch (state) {

    case STATE_IDLE_WAIT: {
      // If we reconnect and have backlog, flush first
      if (isOnline() && queueCount() > 0) {
        enterState(STATE_FLUSH_BACKLOG);
        break;
      }

      // Only prompt within allowed hours
      if (!withinAllowedHours()) {
        // Stay idle; when hour becomes valid again, we'll prompt if nextPromptMs has passed.
        break;
      }

      if (now >= nextPromptMs) {
        // Start a new 5-minute prompt session
        promptSessionMs = now;
        pendingValid = false;
        pendingFromQueue = false;
        enterState(STATE_PROMPT_USER);
      }
      break;
    }

    case STATE_PROMPT_USER: {
      // Prompt window expired?
      if (now - promptSessionMs >= PROMPT_WINDOW_MS) {
        // Stop prompting until next interval
        nextPromptMs = now + MEASUREMENT_INTERVAL_MS;
        enterState(STATE_IDLE_WAIT);
        break;
      }

      // Sample sensor to detect finger presence
      updateMax30102();

      // If finger present, start acquisition
      if (lastIR > FINGER_IR_THRESHOLD) {
        resetAcquisitionBuffers();
        enterState(STATE_ACQUIRE);
      }
      break;
    }

    case STATE_ACQUIRE: {
      // Still bounded by the original prompt session window
      if (now - promptSessionMs >= PROMPT_WINDOW_MS) {
        nextPromptMs = now + MEASUREMENT_INTERVAL_MS;
        enterState(STATE_IDLE_WAIT);
        break;
      }

      updateMax30102();

      // If finger removed, go back to prompt (still within the same 5-min window)
      if (lastIR < (FINGER_IR_THRESHOLD / 2)) {
        enterState(STATE_PROMPT_USER);
        break;
      }

      // Track stability once algorithm is running
      if (bufferFilled && validHeartRate == 1 && validSPO2 == 1) {
        stableCount++;
      } else {
        stableCount = 0;
      }

      if (stableCount >= STABLE_REQUIRED) {
        // Latch a single “measurement taken”
        pending.timestamp = bestEffortTimestamp();
        pending.heartRate = (int16_t)heartRate;
        pending.spo2      = (int16_t)spo2;
        pending.reserved  = 0;

        pendingValid = true;
        enterState(STATE_MEASUREMENT_READY);
      }
      break;
    }

    case STATE_MEASUREMENT_READY: {
      if (!pendingValid) {
        enterState(STATE_IDLE_WAIT);
        break;
      }

      // Branch on connectivity:
      // - Online: send now, but only flash GREEN after server ACK
      // - Offline: flash YELLOW briefly + store locally (<=24h) and send later
      if (isOnline()) enterState(STATE_SEND_PENDING);
      else           enterState(STATE_STORE_OFFLINE);
      break;
    }

    case STATE_SEND_PENDING: {
      if (!pendingValid) {
        enterState(STATE_IDLE_WAIT);
        break;
      }

      if (!isOnline()) {
        // Fell offline before sending
        enterState(STATE_STORE_OFFLINE);
        break;
      }

      // Reset ACK flags and publish
      g_hookReceived = false;
      g_hookSuccess  = false;

      bool ok = publishMeasurement(pending);
      if (!ok) {
        // Publish couldn’t be queued -> treat like offline storage
        enterState(STATE_STORE_OFFLINE);
        break;
      }

      Serial.println("Published measurement event (waiting for server ACK)...");
      sendStartMs = now;
      enterState(STATE_WAIT_SERVER_ACK);
      break;
    }

    case STATE_WAIT_SERVER_ACK: {
      // Wait for hook-response/hook-error. GREEN only on success.
      if (g_hookReceived) {
        if (g_hookSuccess) {
          Serial.println("Server ACK received (DB recorded).");

          // If this record came from backlog, remove it now that it’s confirmed.
          if (pendingFromQueue) {
            queuePopOldest();
          }

          // Schedule next measurement prompt interval from now
          nextPromptMs = now + MEASUREMENT_INTERVAL_MS;

          enterState(STATE_FLASH_GREEN);
        } else {
          Serial.println("Server returned hook-error.");
          // If this was a new measurement, store it offline.
          // If it was from the queue, keep it (don’t pop) and stop flushing for now.
          if (!pendingFromQueue) enterState(STATE_STORE_OFFLINE);
          else {
            nextPromptMs = now + MEASUREMENT_INTERVAL_MS;
            enterState(STATE_IDLE_WAIT);
          }
        }
        break;
      }

      // Timeout waiting for ACK
      if (now - sendStartMs >= ACK_TIMEOUT_MS) {
        Serial.println("ACK timeout.");
        if (!pendingFromQueue) enterState(STATE_STORE_OFFLINE);
        else {
          nextPromptMs = now + MEASUREMENT_INTERVAL_MS;
          enterState(STATE_IDLE_WAIT);
        }
      }
      break;
    }

    case STATE_STORE_OFFLINE: {
      // REQUIREMENT: if offline -> briefly flash YELLOW + store locally up to 24 hours
      if (pendingValid) {
        queuePush(pending);
        Serial.println("Stored measurement offline in EEPROM queue.");
      }

      // Schedule next measurement prompt interval from now
      nextPromptMs = now + MEASUREMENT_INTERVAL_MS;

      enterState(STATE_FLASH_YELLOW);
      break;
    }

    case STATE_FLUSH_BACKLOG: {
      if (!isOnline()) {
        enterState(STATE_IDLE_WAIT);
        break;
      }

      if (queueCount() == 0) {
        enterState(STATE_IDLE_WAIT);
        break;
      }

      MeasurementRecord r;
      if (!queuePeekOldest(r)) {
        enterState(STATE_IDLE_WAIT);
        break;
      }

      pending = r;
      pendingValid = true;
      pendingFromQueue = true;

      enterState(STATE_SEND_PENDING);
      break;
    }

    case STATE_FLASH_GREEN: {
      // Brief green flash after server-confirmed record
      if (now >= flashEndMs) {
        setRgbMode(RGB_OFF);
        enterState(STATE_IDLE_WAIT);
      }
      break;
    }

    case STATE_FLASH_YELLOW: {
      // Brief yellow flash after offline store
      if (now >= flashEndMs) {
        setRgbMode(RGB_OFF);
        enterState(STATE_IDLE_WAIT);
      }
      break;
    }

    default:
      enterState(STATE_IDLE_WAIT);
      break;
  }
}
