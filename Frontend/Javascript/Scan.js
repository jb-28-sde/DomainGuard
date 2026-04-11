import { BASE_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("scanForm").addEventListener("submit", (e) =>{
        e.preventDefault();
    });
    const domainInput = document.getElementById("domainInput");
    const scanBtn = document.getElementById("scanBtn");
    const resultDiv = document.getElementById("result");
    const errorDiv = document.getElementById("error");

    const handleScan = async () => {
        const domain = domainInput.value.trim();

        // 1. Validation
        if (!domain) {
            errorDiv.textContent = "Please enter a domain";
            return;
        }

        // 2. Clear UI and show Loading
        errorDiv.textContent = "";
        resultDiv.innerHTML = "<p>Scanning... Please wait.</p>";

        try {
            // 3. Correct Fetch (Using port 4001 and the correct route)
            const response = await fetch(`${BASE_URL}/api/fullscan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: domain })
            });

            const data = await response.json();

            // 4. Show Output in Browser
            console.log("API Response:", data);
            resultDiv.innerHTML = `<h3>Results:</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;

        } catch (error) {
            console.error("Connection Error:", error);
            errorDiv.textContent = "Error: Cannot connect to Backend.";
        }
    };

    // 5. Attach the function to the button
    scanBtn.addEventListener("click", handleScan);
});