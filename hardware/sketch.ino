#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// MFRC522 Pins
#define RST_PIN   15
#define SS_PIN    5

// Hardware Pins
#define BUZZER_PIN 13
#define RED_LED    12
#define GREEN_LED  14

// Wi-Fi Credentials for Wokwi Simulation
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Backend API Endpoint
// IMPORTANT: Replace "YOUR_LOCAL_IP" with your actual computer's local IP address (e.g., 192.168.1.10)
const char* backendUrl = "https://6eab6a63176ab892-103-72-212-211.serveousercontent.com/api/rfid/scan";

MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  delay(1000); // Give serial monitor time to connect
  Serial.println("\n--- Hardware Simulation Diagnostics ---");

  // Initialize I2C and Scan
  Wire.begin(21, 22);
  Serial.println("Scanning I2C bus...");
  int nDevices = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    if (error == 0) {
      Serial.printf("  I2C device found at address 0x%02X\n", address);
      nDevices++;
    }
  }
  if (nDevices == 0) {
    Serial.println("  No I2C devices found (Check LCD SDA/SCL wiring!)");
  }

  // Initialize SPI & MFRC522 and Scan
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("Checking MFRC522 connection...");
  byte mfrcVersion = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.printf("  MFRC522 Version Register: 0x%02X\n", mfrcVersion);
  if (mfrcVersion == 0x00 || mfrcVersion == 0xFF) {
    Serial.println("  WARNING: Communication with MFRC522 failed (Check SPI wiring!)");
  } else {
    Serial.println("  MFRC522 Connection: OK!");
  }
  Serial.println("---------------------------------------\n");
  
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Connecting Wi-Fi");

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);

  // Initial LED State
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, HIGH); // Red LED on during connection

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Wi-Fi Connected");
    lcd.setCursor(0, 1);
    lcd.print("IP: ");
    lcd.print(WiFi.localIP().toString());
    
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    tone(BUZZER_PIN, 1000, 150);
    delay(150);
    tone(BUZZER_PIN, 1200, 150);
    delay(1000);
    
    digitalWrite(GREEN_LED, LOW);
  } else {
    Serial.println("\nWi-Fi Connection Failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Wi-Fi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Offline Mode");
    delay(2000);
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan ID Card");
}

void loop() {
  // Listen for commands from Serial (keeps compatibility with manual commands)
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "MODE_BORROW") {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Mode: Borrowing");
    } else if (command == "MODE_RETURN") {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Mode: Returning");
    } else if (command == "SUCCESS") {
      triggerFeedback(true, "Success!", "");
    } else if (command == "ERROR") {
      triggerFeedback(false, "Error!", "");
    }
  }

  // Scan RFID Tag
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  // Retrieve UID
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.print("Scanned UID: ");
  Serial.println(uid);

  // Short beep to indicate scan capture
  tone(BUZZER_PIN, 1500, 100);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Verifying...");

  // Send UID to Backend
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(backendUrl);
    http.addHeader("Content-Type", "application/json");

    JsonDocument doc;
    doc["rfidUid"] = uid;
    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.println(response);

      JsonDocument responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);

      if (!error) {
        String type = responseDoc["type"].as<String>();

        if (type == "student") {
          String name = responseDoc["student"]["name"].as<String>();
          triggerFeedback(true, name, "Student Card");
        } else if (type == "book") {
          String title = responseDoc["book"]["title"].as<String>();
          triggerFeedback(true, title, "Book Tag");
        } else {
          triggerFeedback(false, "Unknown Card", "Access Denied");
        }
      } else {
        triggerFeedback(false, "Parse Error", "Invalid JSON");
      }
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpResponseCode);
      triggerFeedback(false, "Server Error", "Code: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("Wi-Fi Disconnected!");
    triggerFeedback(false, "Wi-Fi Offline", "Cannot Verify");
  }

  mfrc522.PICC_HaltA();
}

// Function to trigger buzzer, LEDs, and update LCD based on success or error
void triggerFeedback(bool success, String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16)); // Limit to LCD line width
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));

  if (success) {
    digitalWrite(GREEN_LED, HIGH);
    tone(BUZZER_PIN, 1800, 100);
    delay(150);
    tone(BUZZER_PIN, 2000, 200);
    delay(1500); // Display name for 1.5 seconds
    digitalWrite(GREEN_LED, LOW);
  } else {
    digitalWrite(RED_LED, HIGH);
    tone(BUZZER_PIN, 600, 400);
    delay(1500);
    digitalWrite(RED_LED, LOW);
  }

  // Restore default screen
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan ID Card");
}