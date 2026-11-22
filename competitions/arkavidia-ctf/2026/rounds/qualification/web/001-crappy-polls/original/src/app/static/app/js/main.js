document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll("button, .nav-button");
  
    buttons.forEach(btn => {

    btn.addEventListener("mouseenter", () => {
        btn.classList.add("hovered");
    });
  
    btn.addEventListener("mouseleave", () => {
        btn.classList.remove("hovered");
    });

    btn.addEventListener("click", () => {

        btn.classList.add("clicked");
        setTimeout(() => {
            btn.classList.remove("clicked");
        }, 150);
        
        });
    });
});