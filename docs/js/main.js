const form = document.getElementById("requestForm");

if (form) {

  form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const requestData = {

      name: document.getElementById("name").value,

      phone: document.getElementById("phone").value,

      service: document.getElementById("service").value,

      description: document.getElementById("description").value

    };

    try {

      const response = await fetch(
        "http://localhost:3000/submit-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestData)
        }
      );

      const data = await response.json();

      alert(data.message);

      form.reset();

    } catch (error) {

      console.error(error);

      alert("Failed to submit request");

    }

  });

}