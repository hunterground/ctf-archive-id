document.addEventListener("DOMContentLoaded", function () {
  let choiceCount = 1;
  const maxChoices = 10;

  window.openModal = function () {
    document.getElementById("surveyModal").style.display = "flex";
  };

  window.closeModal = function () {
    document.getElementById("surveyModal").style.display = "none";
  };

  window.addChoice = function () {
    if (choiceCount >= maxChoices) {
      alert("Maximum 10 choices allowed");
      return;
    }

    choiceCount++;

    const row = document.createElement("div");
    row.className = "choice-row";
    row.innerHTML = `
      <input type="text" name="choices[]" placeholder="Choice ${choiceCount}" required>
      <button type="button" class="remove-btn" onclick="removeChoice(this)">✕</button>
    `;

    document.getElementById("choices").appendChild(row);
  };

  window.removeChoice = function (btn) {
    btn.parentElement.remove();
    choiceCount--;
  };


  const groupSelector = document.getElementById("group-selector");
  if (groupSelector) {
    groupSelector.addEventListener("change", function () {
      const formData = new FormData();
      formData.append("csrfmiddlewaretoken", document.querySelector("[name=csrfmiddlewaretoken]").value);
      formData.append("profilegroup", this.value);

      fetch(document.URL, {
        method: "POST",
        body: formData,
      }).catch(() => {
        alert("Failed to change user group");
      });
    });
  }
  

});