import { BASE_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const domainInput = document.getElementById("domainInput");
  const scanBtn = document.getElementById("scanBtn");
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");

  scanBtn.addEventListener("click", handleScan);

  function handleScan() {
    const domain = domainInput.value.trim();

    errorDiv.textContent = "";
    resultDiv.textContent = "";

    if (!domain) {
      errorDiv.textContent = "Domain cannot be empty";
      return;
    }

    fetch(`${BASE_URL}/api/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domain })
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          // ✅ SHOW BACKEND ERROR MESSAGE
          throw new Error(data.message || "Server error");
        }

        return data;
      })
      .then((data) => {
        const domainEl = document.createElement("p");
        domainEl.textContent = "Domain: " + (data.domain || domain);

        const statusEl = document.createElement("p");
        statusEl.textContent = "Status: " + (data.status || "Not Available");

        const messageEl = document.createElement("p");
        messageEl.textContent = "Message: " + (data.message || "No message");

        resultDiv.appendChild(domainEl);
        resultDiv.appendChild(statusEl);
        resultDiv.appendChild(messageEl);
      })
      .catch((err) => {
        console.error(err);

        // ✅ BETTER ERROR DISPLAY
        errorDiv.textContent = err.message;
      });
  }
});