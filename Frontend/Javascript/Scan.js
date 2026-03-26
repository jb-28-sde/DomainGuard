document.getElementById("scanBtn").addEventListener("click", async () => {
    const domainInput = document.getElementById("domain");
    const errorEl = document.getElementById("error");
    const resultEl = document.getElementById("result");

    const domain = domainInput.value.trim();

    errorEl.textContent = "";
    resultEl.innerHTML = "";

    if (!domain) {
        errorEl.textContent = "Please enter a domain";
        return;
    }

    try {
        
        const response = await fetch("http://localhost:5000/api/scan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ domain })
        });

        const data = await response.json();

        console.log("API Response:", data);

        const original = data.original;
        const variants = data.scanned;

        resultEl.innerHTML = `
            <p><strong>Domain:</strong> ${original}</p>
            <p><strong>Variants Found:</strong> ${variants.length}</p>
            <hr/>
        `;

        variants.forEach(item => {
            const div = document.createElement("div");

            div.innerHTML = `
                <p>
                    <strong>${item.domain}</strong> |
                    Exists: ${item.exists ? "✅ Yes" : "❌ No"} |
                    Similarity: ${item.similarity}%
                </p>
            `;

            resultEl.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        errorEl.textContent = "Error connecting to server";
    }
});