function scanDomain() {
  const domain = document.getElementById("domainInput").value;

  if (!domain) {
    alert("Please enter a domain");
    return;
  }

  // API CALL
  fetch(`http://localhost:5000/api/scan?domain=${domain}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      console.log("API Response:", data);

      // Display result nicely
      document.getElementById("result").innerHTML = `
        <h3>Scan Result:</h3>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    })
    .catch(error => {
      console.error("Error:", error);
      document.getElementById("result").innerText = "Error fetching data";
    });
}