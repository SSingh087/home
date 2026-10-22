// Press / or Ctrl+K to jump to any section by typing.
(function () {
  var links = [].slice.call(document.querySelectorAll('#orbs a, footer.links a'));
  if (!links.length) return;

  var box = document.createElement('div');
  box.id = 'palette';
  box.hidden = true;
  box.innerHTML = '<div class="pal-card" role="dialog" aria-label="Jump to"><input type="text" placeholder="Jump to…" aria-label="Jump to"><ul></ul></div>';
  document.body.appendChild(box);
  var input = box.querySelector('input'), list = box.querySelector('ul'), shown = [], sel = 0;

  function render() {
    var q = input.value.trim().toLowerCase();
    shown = links.filter(function (a) { return a.textContent.toLowerCase().indexOf(q) !== -1; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = '';
    shown.forEach(function (a, i) {
      var li = document.createElement('li');
      li.textContent = a.textContent;
      if (i === sel) li.className = 'on';
      li.onclick = function () { go(a); };
      list.appendChild(li);
    });
  }
  function go(a) { if (a.target === '_blank') window.open(a.href, '_blank', 'noopener'); else location.href = a.href; }
  function open() { box.hidden = false; input.value = ''; sel = 0; render(); input.focus(); }
  function close() { box.hidden = true; }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName);
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); open(); }
    else if (!box.hidden && e.key === 'Escape') close();
    else if (!box.hidden && e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); render(); }
    else if (!box.hidden && e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
    else if (!box.hidden && e.key === 'Enter' && shown[sel]) go(shown[sel]);
  });
  input.addEventListener('input', function () { sel = 0; render(); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
})();
