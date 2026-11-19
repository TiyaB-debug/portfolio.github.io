// Native anchor links work without JavaScript. This only marks page location.
const sectionIndex = document.querySelector('.section-index');
if (sectionIndex) {
  const links = [...sectionIndex.querySelectorAll('.section-tab')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  const shell = document.querySelector('.section-index-shell');
  let active = -1;
  let frame = 0;
  const update = () => {
    const marker = (shell ? shell.getBoundingClientRect().height : 0) + 36;
    let current = 0;
    sections.forEach((section, i) => {
      if (section && section.getBoundingClientRect().top <= marker) current = i;
    });
    if (current === active) return;
    active = current;
    links.forEach((link, i) => {
      link.classList.toggle('is-active', i === current);
      if (i === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  update();
}
