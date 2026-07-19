#include <WiFi.h>

#include <HTTPClient.h>

#include <ArduinoJson.h>

#include <Wire.h>

#include <LiquidCrystal_I2C.h>

#include <SPI.h>

#include <MFRC522.h>



// ==========================================

// 🔴 CONFIGURATION: UPDATE THESE VALUES

// ==========================================

const char* ssid = "Shadman";             // <--- Your WiFi Name

const char* password = "shadman_1234";     // <--- Your WiFi Password



// Backend server URL. Replace with your computer's current local IP address.
// Your computer's current active local IPs: 192.168.0.102 (Ethernet) or 192.168.0.105 (Wi-Fi).
// NOTE: Do NOT use "localhost" or "127.0.0.1" as they refer to the ESP32 itself!
const char* serverUrl = "http://192.168.0.102:3000/api/rfid/scan";



// ==========================================

// 🔌 HARDWARE CONFIGURATION (Matching your test pins)

// ==========================================

// LCD setup (I2C Address 0x27, 16 columns, 2 rows)

// SDA = GPIO 21, SCL = GPIO 22

LiquidCrystal_I2C lcd(0x27, 16, 2);



// RFID RC522 setup

// VSPI pins default on ESP32: SCK = 18, MISO = 19, MOSI = 23, SS/CS = 5, RST = 4

#define SS_PIN 5

#define RST_PIN 4

MFRC522 mfrc522(SS_PIN, RST_PIN);



// BUZZER Pin

#define BUZZER_PIN 2



// LED Pins

#define GREEN_LED 12

#define RED_LED 13



// Non-blocking blinking control variables

unsigned long previousMillis = 0;

const long interval = 500;

bool redState = LOW;



void setup() {

  Serial.begin(115200);

  delay(1500); // Wait for Serial Monitor to connect

  Serial.println("\n--- ESP32 RFID Scanner Startup ---");



  // 1. Initialize LCD

  Wire.begin(21, 22);

  lcd.init();

  lcd.backlight();

  lcd.setCursor(0, 0);

  lcd.print("Init Hardware...");



  // 2. Initialize SPI Bus and MFRC522 reader FIRST

  SPI.begin(18, 19, 23, 5);

  mfrc522.PCD_Init();

  mfrc522.PCD_DumpVersionToSerial(); // Verify connection immediately



  // 3. Initialize Buzzer and LEDs

  pinMode(BUZZER_PIN, OUTPUT);

  pinMode(GREEN_LED, OUTPUT);

  pinMode(RED_LED, OUTPUT);



  // Turn on RED LED to indicate Wi-Fi connection phase

  digitalWrite(RED_LED, HIGH);



  // 4. Connect to Wi-Fi

  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("Connecting WiFi");

  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");

  }

  Serial.println("");

  Serial.println("WiFi connected!");

  Serial.print("ESP32 IP: ");

  Serial.println(WiFi.localIP());



  // Indication of successful connection

  digitalWrite(RED_LED, LOW);

  

  // Quick double beep on connection

  digitalWrite(BUZZER_PIN, HIGH);

  delay(100);

  digitalWrite(BUZZER_PIN, LOW);

  delay(100);

  digitalWrite(BUZZER_PIN, HIGH);

  delay(100);

  digitalWrite(BUZZER_PIN, LOW);



  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("LibraSync");

  lcd.setCursor(0, 1);

  lcd.print("Please Scan...");
}



void loop() {

  // If WiFi disconnects, attempt reconnection

  if (WiFi.status() != WL_CONNECTED) {

    lcd.clear();

    lcd.setCursor(0, 0);

    lcd.print("WiFi Connection");

    lcd.setCursor(0, 1);

    lcd.print("Lost. Reconnecting");

    

    WiFi.disconnect();

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {

      blinkRed();

      delay(100);

    }

    

    lcd.clear();

    lcd.setCursor(0, 0);

    lcd.print("WiFi Restored");

    delay(1000);

    lcd.clear();

    lcd.setCursor(0, 0);

    lcd.print("LibraSync");

    lcd.setCursor(0, 1);

    lcd.print("Please Scan...");

  }



  // 🔴 Blink RED LED continuously while waiting/idle

  if (!mfrc522.PICC_IsNewCardPresent()) {

    blinkRed();

    return;

  }



  if (!mfrc522.PICC_ReadCardSerial()) return;



  // Turn off RED LED & stop blinking during scanning process

  digitalWrite(RED_LED, LOW);



  // Initial short beep to acknowledge physical scan

  digitalWrite(BUZZER_PIN, HIGH);

  delay(100);

  digitalWrite(BUZZER_PIN, LOW);



  // Convert UID to string in UPPERCASE hex format

  String uid = "";

  for (byte i = 0; i < mfrc522.uid.size; i++) {

    byte b = mfrc522.uid.uidByte[i];

    if (b < 0x10) uid += "0";

    uid += String(b, HEX);

  }

  uid.toUpperCase();



  Serial.print("Scanned RFID UID: ");

  Serial.println(uid);



  // Send the scanned UID to the backend

  sendRfidScan(uid);



  // Keep result on screen for 2.5 seconds before resetting

  delay(2500);



  // Reset screen and LEDs back to idle state

  digitalWrite(GREEN_LED, LOW);

  digitalWrite(RED_LED, LOW);

  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("LibraSync");

  lcd.setCursor(0, 1);

  lcd.print("Please Scan...");



  mfrc522.PICC_HaltA();

}



// 🔴 Non-blocking blink function for red LED

void blinkRed() {

  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {

    previousMillis = currentMillis;

    redState = !redState;

    digitalWrite(RED_LED, redState);

  }

}



// Send POST request with UID to Node.js backend

void sendRfidScan(String uid) {

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(serverUrl);

    http.addHeader("Content-Type", "application/json");



    // Construct JSON request body

    StaticJsonDocument<200> reqDoc;

    reqDoc["rfidUid"] = uid;

    String requestBody;

    serializeJson(reqDoc, requestBody);



    lcd.clear();

    lcd.setCursor(0, 0);

    lcd.print("Processing...");



    int httpResponseCode = http.POST(requestBody);



    if (httpResponseCode > 0) {

      String response = http.getString();

      Serial.print("HTTP Code: ");

      Serial.println(httpResponseCode);

      Serial.println("Response: " + response);



      // Parse JSON response from server

      StaticJsonDocument<1024> resDoc;

      DeserializationError error = deserializeJson(resDoc, response);



      if (!error) {

        String type = resDoc["type"];

        

        if (type == "student") {

          // Access Granted - Student Found

          String studentName = resDoc["student"]["name"];
          
          // Extract first name (everything before the first space)
          int spaceIdx = studentName.indexOf(' ');
          String firstName = (spaceIdx > 0) ? studentName.substring(0, spaceIdx) : studentName;
          firstName = toPascalCase(firstName);

          lcd.clear();

          lcd.setCursor(0, 0);

          lcd.print("Hi, ");
          lcd.print(firstName.substring(0, 16));

          lcd.setCursor(0, 1);

          lcd.print("Scan book..."); // Limit length to LCD display bounds



          digitalWrite(GREEN_LED, HIGH);

          digitalWrite(BUZZER_PIN, HIGH);

          delay(300);

          digitalWrite(BUZZER_PIN, LOW);



        } else if (type == "book") {

          // Access Granted - Book Found

          String bookTitle = resDoc["book"]["title"];

          lcd.clear();

          lcd.setCursor(0, 0);

          lcd.print("Book Found:");

          lcd.setCursor(0, 1);

          lcd.print(bookTitle.substring(0, 16)); // Limit length to LCD display bounds



          digitalWrite(GREEN_LED, HIGH);

          digitalWrite(BUZZER_PIN, HIGH);

          delay(300);

          digitalWrite(BUZZER_PIN, LOW);



        } else {

          // Unknown Card (Access Denied / Not Registered)

          lcd.clear();

          lcd.setCursor(0, 0);

          lcd.print("Unknown RFID");

          lcd.setCursor(0, 1);

          lcd.print("Please Register");



          digitalWrite(RED_LED, HIGH);

          for (int i = 0; i < 3; i++) {

            digitalWrite(BUZZER_PIN, HIGH);

            delay(150);

            digitalWrite(BUZZER_PIN, LOW);

            delay(150);

          }

        }

      } else {

        // Parsing Error

        lcd.clear();

        lcd.setCursor(0, 0);

        lcd.print("Response Error");

        digitalWrite(RED_LED, HIGH);

      }

    } else {

      // Connection Error

      Serial.print("HTTP Post failed. Error code: ");

      Serial.println(httpResponseCode);

      lcd.clear();

      lcd.setCursor(0, 0);

      lcd.print("Server Timeout");

      lcd.setCursor(0, 1);

      lcd.print("Check server IP");

      digitalWrite(RED_LED, HIGH);

    }

    http.end();

  } else {

    lcd.clear();

    lcd.setCursor(0, 0);

    lcd.print("No WiFi Conn.");

  }

}

// Helper function to format strings to PascalCase/TitleCase
String toPascalCase(String str) {
  if (str.length() == 0) return str;
  str.toLowerCase();
  str.setCharAt(0, toupper(str.charAt(0)));
  return str;
}