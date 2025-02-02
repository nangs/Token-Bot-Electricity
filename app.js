const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

let tokenMemory = "";      // Stores the latest token
let tokenReceived = false; // Tracks if ESP8266 has acknowledged the token
let espStatus = "offline"; // Tracks the online/offline status of the ESP8266
let processingStatus = "Waiting for processing..."; // Token processing status

// Default route to serve the HTML page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint to receive token from the web interface
app.post("/set-token", (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }
    tokenMemory = token + "#";
    tokenReceived = false; // Reset the flag when a new token is set
    console.log("Token received:", tokenMemory);
    res.json({ message: "Token saved successfully" });
});

// Endpoint for ESP8266 to retrieve the token
app.get("/get-token", (req, res) => {
	tokenReceived = true;
    res.json({ token: tokenMemory });
});

// Endpoint for ESP8266 to confirm receipt of the token
app.post("/ack-token", (req, res) => {
    if (tokenMemory) {  // Only acknowledge if token exists
        console.log("ESP8266 acknowledged the token:", tokenMemory);
        tokenMemory = ""; // Clear token after acknowledgment
        tokenReceived = true;
    } else {
        tokenReceived = false;
    }
    res.json({ message: "ESP8266 received the token and it has been cleared" });
});

// Endpoint to check if ESP8266 has received the token
app.get("/token-status", (req, res) => {

    res.json({ received: tokenReceived });
});

// Route to update the status (ESP-01 will call this)
app.post("/update-status", (req, res) => {
    const { status } = req.body;
    if (status) {
        espStatus = status;
		
		console.log("Updated ESP Status:", status);
				
        res.json({ message: "Status updated successfully" });
    } else {
        res.status(400).json({ error: "Missing status parameter" });
    }
});

// Route to get the latest status (Frontend calls this)
app.get("/update-status", (req, res) => {
    res.json({ status: espStatus });
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from other devices using: http://YOUR_LOCAL_IP:${PORT}`);
});
