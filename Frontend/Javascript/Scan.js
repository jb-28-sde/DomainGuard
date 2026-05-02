import { BASE_URL } from "./config.js";
import { processDomainData } from "./processDomainData.js";

document.addEventListener("DOMContentLoaded", () => {
  const domainInput = document.getElementById("domainInput");
  const scanBtn = document.getElementById("scanBtn");
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");
  const recommendDiv = document.getElementById("recommendations");
  const recommendBtn = document.getElementById("recommendBtn");
  const pdfBtn = document.getElementById("pdfBtn");
  const form = document.getElementById("scanForm");

  let currentDomain = null;
  let currentScanData = null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleScan();
  });

  scanBtn.addEventListener("click", () => {
    handleScan();
  });

  recommendBtn.addEventListener("click", () => {
    if (currentScanData) {
      generateRecommendations(currentScanData);
    }
  });

  pdfBtn.addEventListener("click", () => {
    if (currentScanData) {
      generatePDF(currentScanData);
    }
  });

  const demoBtn = document.getElementById("demoBtn");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      loadDemoData();
    });
  }

  function handleScan() {
    const domain = domainInput.value.trim();

    errorDiv.textContent = "";
    resultDiv.innerHTML = "";
    recommendDiv.style.display = "none";

    if (!domain) {
      errorDiv.textContent = "Domain cannot be empty";
      return;
    }

    const domainPattern =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

    if (!domainPattern.test(domain)) {
      errorDiv.textContent = "Enter a valid domain (e.g. example.com)";
      return;
    }

    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning...";
    resultDiv.innerHTML = "<p>Scan started... waiting for results</p>";

    fetch(`${BASE_URL}/api/fullscan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    })
      .then((res) => res.json())
      .then((response) => {
        resultDiv.innerHTML = `
          <div class="result-card info">
            Scan started for <b>${response.domain}</b><br/>
            Job ID: ${response.jobId}<br/>
            <p>Processing in background...</p>
          </div>
        `;

        pollResult(domain);
      })
      .catch((err) => {
        console.error(err);
        errorDiv.textContent = err.message;
      })
      .finally(() => {
        scanBtn.disabled = false;
        scanBtn.textContent = "Scan";
      });
  }

  function pollResult(domain) {
    let attempts = 0;
    const maxAttempts = 360;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch(`${BASE_URL}/api/result/${domain}`);
        const data = await res.json();

        if (data.status === "completed" && data.data) {
          clearInterval(interval);
          errorDiv.textContent = "";
          const resultsArray = data.data.results || [];
          renderResult(domain, resultsArray);
          currentScanData = resultsArray;
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          errorDiv.textContent =
            "Scan is still running. Please wait a little longer and try again.";
        } else if (attempts % 20 === 0) {
          resultDiv.innerHTML = `
            <div class="result-card info">
              Scan started for <b>${domain}</b><br/>
              <p>Still processing... this can take a bit longer while WHOIS data is collected.</p>
            </div>
          `;
        }
      } catch (err) {
        console.error(err);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          errorDiv.textContent = "Error fetching results";
        }
      }
    }, 500);
  }

  function renderResult(domain, resultArray) {
    currentDomain = domain;
    const dataArray = Array.isArray(resultArray) ? resultArray : [];
    currentScanData = dataArray;

    const { all: sorted, highSimilarity, risky } = processDomainData(dataArray);
    const topVariant = sorted[0];
    const similarity =
      typeof topVariant?.similarity === "number" ? topVariant.similarity : 0;

    const hasActiveDns = sorted.some((item) => {
      const dnsValue = item.dns !== undefined ? item.dns : item.dns_exists;
      return dnsValue === true;
    });

    const dnsStatus = hasActiveDns ? "Active" : "Inactive";
    const dnsClass = hasActiveDns ? "success" : "fail";

    let statusText = "";
    let statusClass = "";
    let statusMessage = "";

    if (hasActiveDns && similarity > 89) {
      statusText = "Safe";
      statusClass = "success";
      statusMessage = "This domain looks genuine and safe to use.";
    } else if (similarity > 80) {
      statusText = "Warning";
      statusClass = "warning";
      statusMessage = "High similarity found with similar domains.";
    } else {
      statusText = "Risky";
      statusClass = "fail";
      statusMessage = "Similar domains found. Be careful!";
    }

    const rows = sorted
      .map((variant) => {
        const sim =
          typeof variant.similarity === "number"
            ? variant.similarity.toFixed(1)
            : variant.similarity;
        const owner =
          variant.owner && variant.owner !== "N/A"
            ? variant.owner
            : variant.registrar && variant.registrar !== "N/A"
              ? variant.registrar
              : "Unknown";
        const riskLevel = String(
          variant.risk_level ?? variant.ageRisk ?? "N/A",
        ).toUpperCase();
        const riskColor =
          riskLevel === "CRITICAL" || riskLevel === "HIGH"
            ? "#ffcccc"
            : riskLevel === "MEDIUM"
              ? "#fff1bf"
              : "#ccffcc";
        const dnsExists =
          variant.dns !== undefined ? variant.dns : variant.dns_exists;
        const createdDate =
          variant.createdAt && variant.createdAt !== "N/A"
            ? variant.createdAt
            : "N/A";
        const ageText =
          typeof variant.ageInDays === "number"
            ? `${variant.ageInDays} days`
            : "N/A";

        return `
        <tr>
          <td><strong>${variant.domain ?? "N/A"}</strong></td>
          <td>${sim}%</td>
          <td>${dnsExists ? "Active" : "Fail"}</td>
          <td title="WHOIS Owner: ${owner}"><small>${owner}</small></td>
          <td>${createdDate}</td>
          <td>${ageText}</td>
          <td><span style="padding: 3px 8px; border-radius: 4px; background: ${riskColor}; font-size: 12px;">${riskLevel}</span></td>
          <td>${variant.isPrivacyProtected ? "Protected" : "Public"}</td>
        </tr>
      `;
      })
      .join("");

    const noResultsMessage =
      sorted.length === 0
        ? '<tr><td colspan="8" style="text-align:center; padding: 20px; color: #999;">No domain variants found. This domain appears to be unique.</td></tr>'
        : "";

    resultDiv.innerHTML = `
      <div class="result-card">
        <h3>Scan Completed</h3>
        <p><strong>Domain:</strong> ${domain}</p>

        <p>
          <strong>Status:</strong>
          <span class="badge ${statusClass}">${statusText}</span>
        </p>

        <p>${statusMessage}</p>

        <hr/>

        <div class="stats">
          <span class="badge success">Top Similarity: ${similarity.toFixed(1)}%</span>
          <span class="badge ${dnsClass}">DNS: ${dnsStatus}</span>
          <span class="badge">Total Variants: ${sorted.length}</span>
          <span class="badge warning">High Risk: ${highSimilarity.length}</span>
          <span class="badge">Suspicious: ${risky.length}</span>
        </div>

        <div style="overflow-x:auto; margin-top:15px;">
          <table class="scan-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Similarity %</th>
                <th>DNS Status</th>
                <th>WHOIS Owner</th>
                <th>Created Date</th>
                <th>Domain Age</th>
                <th>Risk Level</th>
                <th>Privacy</th>
              </tr>
            </thead>
            <tbody>${rows}${noResultsMessage}</tbody>
          </table>
        </div>
      </div>
    `;

    recommendBtn.style.display = "block";
    pdfBtn.style.display = "block";
  }

  async function generateRecommendations(scanData) {
    try {
      recommendBtn.disabled = true;
      recommendBtn.textContent = "Loading...";

      const response = await fetch(`${BASE_URL}/api/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: currentDomain,
          scanDate: new Date().toISOString(),
          domains: scanData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const recommendations = result.data.domains[0]?.recommendations || [];
        displayRecommendations(recommendations);
      } else {
        errorDiv.textContent = "Failed to generate recommendations";
      }
    } catch (err) {
      console.error(err);
      errorDiv.textContent = `Error: ${err.message}`;
    } finally {
      recommendBtn.disabled = false;
      recommendBtn.textContent = "Get Recommendations";
    }
  }

  function displayRecommendations(recommendations) {
    let html = '<div class="recommendations-card">';
    html += "<h3>Recommendations</h3>";
    html += "<ul>";
    recommendations.forEach((rec) => {
      html += `<li>${rec}</li>`;
    });
    html += "</ul></div>";
    recommendDiv.innerHTML = html;
    recommendDiv.style.display = "block";
  }

  async function generatePDF(scanData) {
    try {
      pdfBtn.disabled = true;
      pdfBtn.textContent = "Generating...";

      const response = await fetch(`${BASE_URL}/api/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: currentDomain,
          scanDate: new Date().toISOString(),
          domains: scanData,
        }),
      });

      const result = await response.json();

      if (result.success && result.report) {
        const link = document.createElement("a");
        link.href = `${BASE_URL}/reports/${result.report}`;
        link.download = `${currentDomain}-report.pdf`;
        link.click();

        errorDiv.textContent = "PDF downloaded successfully.";
      } else {
        errorDiv.textContent = "Failed to generate PDF";
      }
    } catch (err) {
      console.error(err);
      errorDiv.textContent = `Error: ${err.message}`;
    } finally {
      pdfBtn.disabled = false;
      pdfBtn.textContent = "Generate PDF Report";
    }
  }

  function loadDemoData() {
    const demoData = [
      {
        domain: "amazn.com",
        similarity: 95.2,
        dns_exists: true,
        registrar: "NameCheap Inc.",
        owner: "Amazon Clone Holdings",
        createdAt: "2024-01-15T00:00:00Z",
        ageInDays: 88,
        ageRisk: "MEDIUM",
        isPrivacyProtected: true,
        risk_level: "HIGH",
        impersonation_score: 78,
      },
      {
        domain: "amazon-secure.com",
        similarity: 87.3,
        dns_exists: true,
        registrar: "GoDaddy.com Inc.",
        owner: "Secure Login Network",
        createdAt: "2024-02-20T00:00:00Z",
        ageInDays: 52,
        ageRisk: "MEDIUM",
        isPrivacyProtected: false,
        risk_level: "HIGH",
        impersonation_score: 74,
      },
      {
        domain: "amaz0n.com",
        similarity: 92.1,
        dns_exists: false,
        registrar: "Google Domains",
        owner: "Unknown",
        createdAt: "2024-03-10T00:00:00Z",
        ageInDays: 34,
        ageRisk: "HIGH",
        isPrivacyProtected: true,
        risk_level: "CRITICAL",
        impersonation_score: 83,
      },
    ];

    currentDomain = "amazon.com";
    currentScanData = demoData;
    errorDiv.textContent = "";
    renderResult(currentDomain, demoData);
  }
});
