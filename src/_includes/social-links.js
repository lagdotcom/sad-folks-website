(function fakeLink(elements) {
  for (const element of elements) {
    element.addEventListener("click", (e) => {
      alert("yo J tell me what this URL is lol");
      e.preventDefault();
    });
  }
})(document.querySelectorAll(".link-goes-where"));
