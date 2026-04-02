document.addEventListener("DOMContentLoaded", () => {
  const domainInput = document.getElementById("domainInput");
  const scanBtn = document.getElementById("scanBtn");
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");

  scanBtn.addEventListener("click", handleScan);

  async function handleScan() {
    const domain = domainInput.value.trim();

    // Clear previous
    errorDiv.textContent = "";
    resultDiv.innerHTML = "";

    // ✅ Validation
    if (!domain) {
      errorDiv.textContent = "Please enter a domain";
      return;
    }

    if (!domain.includes(".")) {
      errorDiv.textContent = "Enter a valid domain (e.g. google.com)";
      return;
    }

    // ✅ Loading state
    resultDiv.innerHTML = "<p>Scanning...</p>";

    try {
      const response = await fetch("http://localhost:8080/api/fullscan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ domain })
      });

      const data = await response.json();

      console.log("API Response:", data);

      resultDiv.innerHTML = "<h3>Scan Results</h3><hr/>";

      // ✅ Display structured results
      data.forEach((item) => {
        const div = document.createElement("div");

        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #ccc";

        let color = "green";
        if (item.similarity > 85) color = "red";
        else if (item.similarity > 70) color = "orange";

        div.innerHTML = `
          <p><strong>Domain:</strong> ${item.domain}</p>
          <p><strong>Similarity:</strong> <span style="color:${color}">${item.similarity}%</span></p>
          <p><strong>DNS Status:</strong> ${
            item.dns ? "✅ Active" : "❌ Inactive"
          }</p>
        `;

        resultDiv.appendChild(div);
      });

    } catch (err) {
      console.error(err);
      errorDiv.textContent = "Error connecting to server";
      resultDiv.innerHTML = "";
    }
  }
});