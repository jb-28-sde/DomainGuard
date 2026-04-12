import { BASE_URL } from "./config.js";

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

    errorDiv.textContent = "";
    resultDiv.innerHTML = "";

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
    resultDiv.innerHTML = "<p>Scan started... waiting for results ⏳</p>";

    fetch(`${BASE_URL}/api/fullscan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    })
      .then((res) => res.json())
      .then((response) => {
        resultDiv.innerHTML = `
          <div class="result-card info">
            🚀 Scan started for <b>${response.domain}</b><br/>
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
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/scan/${domain}`);
        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(interval);
          renderResult(domain, data.data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  }

  function renderResult(domain, resultArray) {
    const { all: sorted, highSimilarity, risky } =
      processDomainData(resultArray);

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
      statusMessage = "Similar domains found. Be careful.";
    }

    const rows = sorted
      .map((v) => {
        return `
        <tr>
          <td>${v.domain ?? "N/A"}</td>
          <td>${v.similarity ?? "N/A"}%</td>
          <td>${v.dns ? "Active" : "Fail"}</td>
          <td>${v.registrar ?? "N/A"}</td>
          <td>${v.createdAt ?? "N/A"}</td>
          <td>${v.ageInDays ?? "N/A"}</td>
          <td>${v.ageRisk ?? "N/A"}</td>
          <td>${v.isPrivacyProtected ? "Protected" : "Not Protected"}</td>
        </tr>
      `;
      })
      .join("");

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
          <span class="badge success">Top Similarity: ${similarity}%</span>
          <span class="badge ${dnsClass}">DNS: ${dnsStatus}</span>
          <span class="badge">Total Variants: ${sorted.length}</span>
          <span class="badge">High Similarity: ${highSimilarity.length}</span>
          <span class="badge">Risky: ${risky.length}</span>
        </div>

        <div style="overflow-x:auto; margin-top:15px;">
          <table class="scan-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Similarity</th>
                <th>DNS</th>
                <th>Registrar</th>
                <th>Created</th>
                <th>Age</th>
                <th>Risk</th>
                <th>Privacy</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }
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