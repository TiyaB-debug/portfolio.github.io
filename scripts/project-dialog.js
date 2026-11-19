// Native dialog supplies modal focus containment and Escape. Real URLs remain usable without JS.
const projectDialog = document.createElement('dialog');
projectDialog.className = 'book-dialog';
projectDialog.setAttribute('aria-labelledby', 'book-dialog-title');
projectDialog.innerHTML = '<div class="book-dialog-bar"><h2 id="book-dialog-title">Project</h2><button type="button" class="book-dialog-close" aria-label="Close project">Close</button></div><div class="book-dialog-scroll"><div class="dialog-content"></div></div>';
document.body.append(projectDialog);
const dialogContent = projectDialog.querySelector('.dialog-content');
const dialogTitle = projectDialog.querySelector('h2');
const closeBook = projectDialog.querySelector('button');
const projectCache = new Map();
let bookOpener = null;
let requestNumber = 0;
let activeRequest = null;
let loadingTimer = null;
let closingFromHistory = false;

closeBook.addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('close', () => {
  if (!closingFromHistory && history.state?.portfolioBook) history.back();
  closingFromHistory = false;
  requestNumber++;
  activeRequest?.abort();
  clearTimeout(loadingTimer);
  dialogContent.removeAttribute('aria-busy');
  document.body.classList.remove('book-is-open');
  projectDialog.querySelector('.book-opening-cover')?.remove();
  if (bookOpener?.isConnected) bookOpener.focus({ preventScroll: true });
});
// Require the press and release to be on the backdrop: a drag out of the text must not close it.
let pressedBackdrop = false;
const outsideDialog = event => {
  if (event.target !== projectDialog) return false;
  const box = projectDialog.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
};
projectDialog.addEventListener('pointerdown', event => { pressedBackdrop = outsideDialog(event); });
projectDialog.addEventListener('click', event => {
  if (pressedBackdrop && outsideDialog(event)) projectDialog.close();
  pressedBackdrop = false;
});

async function openProject(link, animate = true, fromHistory = false) {
  const token = ++requestNumber;
  activeRequest?.abort();
  clearTimeout(loadingTimer);
  const controller = new AbortController();
  activeRequest = controller;
  const url = new URL(link.href, location.href);
  const title = link.querySelector('.book-title')?.textContent.trim() || link.textContent.trim().replace(/^Next project\s*/, '').replace(/↗/g, '').trim();
  if (!fromHistory) {
    const address = new URL(location.href);
    address.searchParams.set('project', url.pathname.split('/').pop().replace('.html', ''));
    if (projectDialog.open) history.replaceState({ ...history.state, portfolioBook: true }, '', address);
    else history.pushState({ ...history.state, portfolioBook: true }, '', address);
  }
  if (!projectDialog.open) {
    bookOpener = document.querySelector('a.book[href="./projects/' + url.pathname.split('/').pop() + '"]') || link;
    projectDialog.showModal();
    document.body.classList.add('book-is-open');
  }
  dialogTitle.textContent = title;
  closeBook.focus({ preventScroll: true });
  dialogContent.replaceChildren();
  dialogContent.setAttribute('aria-busy', 'true');
  projectDialog.querySelector('.book-dialog-scroll').scrollTop = 0;
  projectDialog.querySelector('.book-opening-cover')?.remove();
  const state = document.createElement('p');
  state.className = 'dialog-state';
  state.setAttribute('role', 'status');
  state.textContent = 'Opening ' + title + '…';
  state.hidden = true;
  dialogContent.append(state);
  // Fast and cached opens never flash a loading message.
  loadingTimer = setTimeout(() => { if (token === requestNumber) state.hidden = false; }, 150);
  if (animate && link.matches('.book') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const style = getComputedStyle(link);
    const cover = document.createElement('div');
    cover.className = 'book-opening-cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.textContent = title;
    cover.style.setProperty('--opening-color', style.getPropertyValue('--cover'));
    cover.style.setProperty('--opening-ink', style.color);
    projectDialog.append(cover);
    cover.addEventListener('animationend', () => cover.remove(), { once: true });
  }
  try {
    let html = projectCache.get(url.href);
    if (!html) {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Project unavailable');
      html = await response.text();
    }
    if (token !== requestNumber || !projectDialog.open) return;
    const page = new DOMParser().parseFromString(html, 'text/html');
    const main = page.querySelector('main.case-study');
    if (!main) throw new Error('Project unavailable');
    projectCache.set(url.href, html);
    main.id = 'book-project-content';
    main.setAttribute('role', 'document');
    main.querySelector('aside')?.remove();
    main.querySelectorAll('[href],[src]').forEach(element => {
      for (const attribute of ['href', 'src']) {
        const value = element.getAttribute(attribute);
        if (value && !value.startsWith('#')) element.setAttribute(attribute, new URL(value, url).href);
      }
    });
    main.querySelectorAll('script').forEach(element => element.remove());
    dialogContent.replaceChildren(document.importNode(main, true));
  } catch (error) {
    if (token !== requestNumber || error.name === 'AbortError') return;
    state.hidden = false;
    state.textContent = 'The project details could not load in this popup. You can still open the full project page. ';
    const fallback = document.createElement('a');
    fallback.href = url.href;
    fallback.textContent = 'Open the project page';
    state.append(fallback);
  } finally {
    if (token === requestNumber) {
      clearTimeout(loadingTimer);
      dialogContent.removeAttribute('aria-busy');
    }
  }
}

document.addEventListener('click', event => {
  const link = event.target.closest('a.book, a.project-preview, .book-dialog a.next-project');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  // Keyboard and assistive-technology activation is immediate; pointer activation keeps the book turn.
  openProject(link, event.detail > 0);
});

// Back closes the book; Forward and a refreshed project URL restore it.
function restoreProjectFromAddress() {
  const slug = new URL(location.href).searchParams.get('project');
  const link = [...document.querySelectorAll('a.book')].find(book =>
    new URL(book.href).pathname.split('/').pop() === slug + '.html');
  if (link) openProject(link, false, true);
  else if (projectDialog.open) {
    closingFromHistory = true;
    projectDialog.close();
  }
}
window.addEventListener('popstate', restoreProjectFromAddress);
if (new URL(location.href).searchParams.has('project')) {
  const selectedAddress = new URL(location.href);
  const baseAddress = new URL(location.href);
  baseAddress.searchParams.delete('project');
  history.replaceState(null, '', baseAddress);
  history.pushState({ portfolioBook: true }, '', selectedAddress);
  restoreProjectFromAddress();
}
