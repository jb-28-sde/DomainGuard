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
    fetch(`${BASE_URL}/api/fullscan`, {
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

        if (dataArray.message) {
          resultDiv.innerHTML = `
            <div class="result-card info">
              ${dataArray.message} (${dataArray.domain})
            </div>
          `;
          return;
        }

        if (!Array.isArray(dataArray) || dataArray.length === 0) {
          resultDiv.innerHTML = "<p>No scan data returned</p>";
          return;
        }

        const { all: sorted, highSimilarity, risky } = processDomainData(dataArray);

        const topVariant = sorted[0];
        const similarity = topVariant?.similarity ?? "N/A";
        const hasActiveDns = sorted.some((item) => item.dns);
        const dnsStatus = hasActiveDns ? "Active" : "Fail";
        const dnsClass = hasActiveDns ? "success" : "fail";

        let statusText = "";
        let statusClass = "";
        let statusMessage = "";

        if (hasActiveDns && similarity > 89) {
          statusText = "Safe";
          statusClass = "success";
          statusMessage = "This domain looks genuine and safe to use.";
        } else {
          statusText = "Risky";
          statusClass = "fail";
          statusMessage = "Similar domains found. Please be cautious before using it.";
        }

        function getSimilarityClass(sim) {
          if (sim >= 95) return "highlight-strong";
          if (sim >= 90) return "highlight-light";
          return "";
        }

        function getAgeRiskClass(ageRisk) {
          if (ageRisk === "HIGH") return "age-high";
          if (ageRisk === "MEDIUM") return "age-medium";
          return "";
        }

        const rows = sorted.map((v) => {
          const simClass = getSimilarityClass(v.similarity);
          const ageClass = getAgeRiskClass(v.ageRisk);
          const privacyBadge =
            v.isPrivacyProtected === true || v.isPrivacyProtected === "true"
              ? `<span class="badge-protected">Protected</span>`
              : "";

          return `
            <tr class="${simClass}">
              <td>${v.domain ?? "N/A"}</td>
              <td>${v.similarity ?? "N/A"}%</td>
              <td>${v.dns ? "Active" : "Fail"}</td>
              <td>${v.registrar ?? "N/A"}</td>
              <td>${v.createdAt ?? "N/A"}</td>
              <td>${v.ageInDays ?? "N/A"}</td>
              <td class="${ageClass}">${v.ageRisk ?? "N/A"}</td>
              <td>${privacyBadge}</td>
            </tr>
          `;
        }).join("");

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
              <span class="badge">Total Variants: ${sorted.length}</span>
              <span class="badge">High Similarity: ${highSimilarity.length}</span>
              <span class="badge">Risky: ${risky.length}</span>
            </div>
            <div style="margin-top:16px; overflow-x:auto;">
              <table class="scan-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Similarity</th>
                    <th>DNS Status</th>
                    <th>Registrar</th>
                    <th>Created Date</th>
                    <th>Age (Days)</th>
                    <th>Age Risk</th>
                    <th>Privacy Protected</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
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