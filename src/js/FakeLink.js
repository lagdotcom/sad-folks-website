import { register } from "./components";

function FakeLink(element) {
  element.addEventListener("click", (e) => {
    alert("yo J tell me what this URL is lol");
    e.preventDefault();
  });
}

register("FakeLink", FakeLink);
