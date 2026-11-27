  document.getElementById("checkForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const response = await fetch("/check-song", {
        method: "POST",
        body: formData
      });

      const result = document.getElementById("result");
      if (response.ok) {
        const data = await response.json();
        result.textContent = "✅ Song uploaded successfully!";
        console.log(data);
      } else {
        const error = await response.json();
        result.textContent = `❌ Error: ${error.error}`;
      }
    });