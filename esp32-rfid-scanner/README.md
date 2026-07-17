# ESP32 RFID Scanner Integration Guide

This guide walks you through setting up your ESP32 hardware with your local full-stack library server using your **Arduino IDE**.

---

## 📦 1. Required Libraries in Arduino IDE

Your ESP32 needs to parse JSON responses from the server. You must install the **ArduinoJson** library.

1. In Arduino IDE, click on the **Library Manager** icon on the left sidebar (or press `Ctrl + Shift + I`).
2. Search for **"ArduinoJson"** (by Benoit Blanchon).
3. Click **Install** on the latest version (v6 or v7 are both supported).
4. *(Optional)* Confirm you already have **LiquidCrystal_I2C** and **MFRC522** installed (which you already do, based on your test code).

---

## 🌐 2. Get Your Computer's Local IP Address (Linux)

Since your ESP32 runs as a standalone device on your network, it cannot connect to `localhost`. It must send requests directly to your computer's local network IP address.

To find your local IP address on Linux, open a terminal and run:
```bash
hostname -I
```
*Look for an IP address starting with `192.168.x.x` or `10.x.x.x` (e.g. `192.168.1.15`).*

---

## ✍️ 3. Configure the Sketch

Open [esp32-rfid-scanner.ino](file:///run/media/md-naimul-hasan-bappy/Work/CODE/full-stack/esp32-rfid-scanner/esp32-rfid-scanner.ino) in your **Arduino IDE** and update these variables:

1. **SSID**: Replace `"YOUR_WIFI_SSID"` with your Wi-Fi name.
2. **Password**: Replace `"YOUR_WIFI_PASSWORD"` with your Wi-Fi password.
3. **Server URL**: Replace `192.168.1.XX` with your computer's local IP address.
   ```cpp
   const char* serverUrl = "http://192.168.1.15:3000/api/rfid/scan"; // Example
   ```

---

## ⚡ 4. Upload and Test

1. **Connect** your ESP32 board to your computer via USB.
2. **Select Board**: Under `Tools > Board`, select your ESP32 board (e.g., `ESP32 Dev Module`).
3. **Select Port**: Under `Tools > Port`, select the active USB port (e.g., `/dev/ttyUSB0` or `/dev/ttyACM0`).
4. **Upload**: Click the **Upload** arrow button at the top-left of the IDE.
5. **Open Serial Monitor**: Open the serial monitor (`Ctrl + Shift + M`) and set the baud rate to `115200` to see real-time debugging logs.

---

## 💻 5. Start the Full-Stack Web Application

Ensure your backend server is running so it can receive scanned RFIDs from the ESP32.

### Start the Backend Server:
```bash
cd library-back-end
npm run dev
```

### Start the Frontend Server:
```bash
cd front-end
npm run dev
```

Open the frontend dashboard in your browser (typically `http://localhost:5173`). Go to the **Transactions** or **Scanner** tab.

### Testing the Scanner:
1. Scan a registered student card -> The LCD will show **"Student Found: [Name]"**, the green LED will light up, and the buzzer will beep. The frontend page will auto-fill the student's RFID field.
2. Scan a registered book tag -> The LCD will show **"Book Found: [Title]"**, the green LED will light up, and the buzzer will beep. The frontend page will auto-fill the book's RFID field.
3. Scan an unregistered tag -> The LCD will show **"Unknown RFID"**, the red LED will light up, and the buzzer will beep 3 times.
