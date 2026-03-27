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
          throw new Error(data.message || "Server error");
        }

        return data;
      })
      .then(() => {
        // ✅ EXACT TL REQUIREMENT
        const successMsg = document.createElement("p");
        successMsg.textContent = "Saved in database.";

        successMsg.style.color = "green";
        successMsg.style.fontWeight = "600";

        resultDiv.appendChild(successMsg);
      })
      .catch((err) => {
        console.error(err);
        errorDiv.textContent = err.message;
      });
  }
});