import { BASE_URL } from "./config.js";
import { processDomainData } from "./processDomainData.js";

document.addEventListener("DOMContentLoaded", () => {
  const domainInput = document.getElementById("domainInput");
  const scanBtn = document.getElementById("scanBtn");
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");
  const form = document.getElementById("scanForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleScan();
  });

  function handleScan() {
    const domain = domainInput.value.trim();

    // Clear previous state
    errorDiv.textContent = "";
    resultDiv.innerHTML = "";

    // Validation
    if (!domain) {
      errorDiv.textContent = "Domain cannot be empty";
      return;
    }

    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainPattern.test(domain)) {
      errorDiv.textContent = "Enter a valid domain (e.g. example.com)";
      return;
    }

    // Loading state
    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning...";
    resultDiv.innerHTML = "<p>Scanning, please wait...</p>";

    // API Call
    fetch(`${BASE_URL}/api/Fullscan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Server error");
        return data;
      })
      .then((dataArray) => {
        console.log("API Response:", dataArray);

        // Already scanned / single result message
        if (dataArray.message) {
          resultDiv.innerHTML = `
            <div class="result-card info">
              ${dataArray.message} (${dataArray.domain})
            </div>
          `;
          return;
        }

        // Empty response
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
          resultDiv.innerHTML = "<p>No scan data returned</p>";
          return;
        }

        // Sort variants by similarity descending
        const { all: sorted, highSimilarity, risky } = processDomainData(dataArray);

        // Main stats for top variant
        const topVariant = sorted[0];
        const similarity = topVariant?.similarity ?? "N/A";
        const hasActiveDns = sorted.some((item) => item.dns);
        const dnsStatus = hasActiveDns ? "Active" : "Fail";
        const dnsClass = hasActiveDns ? "success" : "fail";

        // User-friendly status
        let statusText = "";
        let statusClass = "";
        let statusMessage = "";

        if (hasActiveDns && similarity > 85) {
          statusText = "Safe";
          statusClass = "success";
          statusMessage = "This domain looks genuine and safe to use.";
        } else {
          statusText = "Risky";
          statusClass = "fail";
          statusMessage =
            "Similar domains found. Please be cautious before using it.";
        }

        // Render full UI
        resultDiv.innerHTML = `
          <div class="result-card">
            <h3>Scan Result</h3>

            <p><strong>Domain:</strong> ${domain}</p>

            <p style="margin-top:8px;">
              <strong>Status:</strong>
              <span class="badge ${statusClass}">${statusText}</span>
            </p>

            <p style="margin-top:8px;">${statusMessage}</p>

            <hr style="margin:12px 0;">

            <div class="stats">
              <span class="badge success">Top Similarity: ${similarity}%</span>
              <span class="badge ${dnsClass}">DNS: ${dnsStatus}</span>
            </div>

            <p><strong>Total Variants Found:</strong> ${sorted.length}</p>

            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Similarity</th>
                  <th>DNS</th>
                </tr>
              </thead>
              <tbody>
                ${sorted
                  .map(
                    (v) => `
                  <tr>
                    <td>${v.domain}</td>
                    <td>${v.similarity}%</td>
                    <td>${v.dns ? "Active" : "Fail"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      })
      .catch((err) => {
        console.error("Error:", err);
        errorDiv.textContent = err.message;
      })
      .finally(() => {
        scanBtn.disabled = false;
        scanBtn.textContent = "Scan";
      });
  }
});