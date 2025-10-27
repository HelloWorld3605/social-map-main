document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector(".hamburger");
    const sideMenu = document.querySelector(".side-menu");

    hamburger.addEventListener("click", function () {
        this.classList.toggle("is-active");
        sideMenu.classList.toggle("is-active");
    });
});