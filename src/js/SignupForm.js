import { register } from "./components.js";

/**
 * @param {HTMLFormElement} form
 */
function SignupForm(form) {
  /** @type {NodeListOf<HTMLInputElement|HTMLButtonElement>} */
  const inputs = form.querySelectorAll("input, button");

  const disable = (value) => {
    form.ariaDisabled = value;
    for (const input of inputs) input.disabled = value;
  };

  const report = document.createElement("div");
  report.className = "message";
  form.append(report);

  form.addEventListener("submit", (e) => {
    form.classList.add("busy");
    disable(true);

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
        } else if (r.status === 404) {
          report.classList.add("error");
          report.innerText = "Can't find the server, oh no!";
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
        disable(false);
      });
  });

  disable(false);
}

register("SignupForm", SignupForm);
