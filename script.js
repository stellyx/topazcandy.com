document.getElementById("year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".service-card, .step, .statement blockquote").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(12px)";
  el.style.transition = "opacity .5s ease, transform .5s ease";
  observer.observe(el);
});

const style = document.createElement("style");
style.textContent = ".visible{opacity:1!important;transform:translateY(0)!important}";
document.head.appendChild(style);
