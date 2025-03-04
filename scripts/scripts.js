
const nav = document.querySelector('.nav-menu');

navOpen.addEventListener('click', () => {
    nav.style.right = "0";
})

navClose.addEventListener('click', () => {
    nav.style.right = "-20rem";
})