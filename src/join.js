(function listSignupForm(form) {
  if (!form) return;

  const report = document.createElement("div");
  report.className = "message";
  form.append(report);

  form.addEventListener("submit", (e) => {
    form.classList.add("busy");
    report.innerText = "";
    report.className = "message";
    e.preventDefault();

    const data = new FormData(form);
    const json = {};
    for (const [name, value] of data) json[name] = value;

    const body = JSON.stringify(json);
    fetch(form.action, { method: form.method, body })
      .then((r) => {
        if (r.ok) {
          report.classList.add("ok");
          report.innerText = "You're on the list!";
        } else
          r.text().then((message) => {
            report.classList.add("error");
            report.innerText = message;
          });
      })
      .catch(() => {
        report.classList.add("error");
        report.innerText = "Server didn't respond, oh no!";
      })
      .finally(() => {
        form.classList.remove("busy");
      });
  });
})(document.getElementById("list-signup"));
