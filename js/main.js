/* Hommage à Mme BaBo — interactions */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Apparition au défilement ---------- */
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- Navigation : onglet actif selon la section visible ---------- */
  var links = $$('[data-spy]');
  function setActive(id) {
    links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-spy') === id); });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.getAttribute('data-section')); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('[data-section]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Compte à rebours (levée de corps, 30 oct. 2026, 10h00 heure du Cameroun) ---------- */
  var target = Date.parse('2026-10-30T10:00:00+01:00');
  var cd = $('#countdown');
  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      cd.classList.add('is-done');
      $('.countdown__label', cd).textContent = 'Les cérémonies ont commencé · que sa mémoire soit bénie';
      return false;
    }
    var d = Math.floor(diff / 864e5), h = Math.floor(diff % 864e5 / 36e5), m = Math.floor(diff % 36e5 / 6e4);
    $('[data-u=d]', cd).textContent = d;
    $('[data-u=h]', cd).textContent = String(h).padStart(2, '0');
    $('[data-u=m]', cd).textContent = String(m).padStart(2, '0');
    return true;
  }
  if (cd && tick()) { setInterval(tick, 30000); }

  /* ---------- Onglets du programme ---------- */
  var tabs = $$('.tab'), thumb = $('.tabs__thumb');
  function selectTab(i, focus) {
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      p.hidden = !on; p.classList.toggle('is-on', on);
    });
    thumb.style.transform = 'translateX(' + (i * 100) + '%)';
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); selectTab((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); selectTab((i - 1 + tabs.length) % tabs.length, true); }
    });
  });
  // Ouvre automatiquement le bon jour selon la date du jour
  (function () {
    var now = Date.now(), ven = Date.parse('2026-10-30T00:00:00+01:00'), sam = Date.parse('2026-10-31T00:00:00+01:00'), dim = Date.parse('2026-11-01T00:00:00+01:00');
    if (now >= ven && now < sam) selectTab(1); else if (now >= sam && now < dim) selectTab(2); else selectTab(0);
  })();
  if (location.hash === '#vendredi') selectTab(1);
  if (location.hash === '#samedi') selectTab(2);

  /* ---------- Ajout au calendrier (.ics) ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function icsDate(day, hhmm) {
    var p = day.split('-'), t = hhmm.split(':');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], +t[0] - 1, +t[1])); // heure du Cameroun = UTC+1
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
  }
  function esc(s) { return s.replace(/([,;])/g, '\\$1'); }
  $$('.js-ics').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('data-for'));
      var tl = $('.timeline', panel), day = tl.getAttribute('data-day');
      var lis = $$('li', tl), out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hommage Mme BaBo//FR', 'CALSCALE:GREGORIAN'];
      lis.forEach(function (li, i) {
        var start = li.getAttribute('data-t'), next = lis[i + 1] ? lis[i + 1].getAttribute('data-t') : null;
        var endT = next || (function () { var t = start.split(':'); return pad(+t[0] + 1) + ':' + t[1]; })();
        if (i === lis.length - 1 && day === '2026-10-30') endT = '23:59';
        out.push('BEGIN:VEVENT', 'UID:babo-' + day + '-' + start.replace(':', '') + '@hommage',
          'DTSTAMP:' + icsDate('2026-10-11', '12:00'),
          'DTSTART:' + icsDate(day, start), 'DTEND:' + icsDate(day, endT),
          'SUMMARY:' + esc('Obsèques Mme BaBo · ' + li.getAttribute('data-title')),
          'LOCATION:' + esc(li.getAttribute('data-loc')), 'END:VEVENT');
      });
      out.push('END:VCALENDAR');
      var blob = new Blob([out.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'obseques-mme-babo-' + day + '.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      toast('Fichier calendrier téléchargé');
    });
  });

  /* ---------- Visionneuse photos ---------- */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  $$('.shot').forEach(function (s) {
    s.addEventListener('click', function () {
      lbImg.src = s.getAttribute('data-src'); lbImg.alt = $('img', s).alt; lbCap.textContent = s.getAttribute('data-cap');
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    });
  });
  $('.lightbox__x').addEventListener('click', function () { lb.close ? lb.close() : lb.removeAttribute('open'); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });

  /* ---------- Partage ---------- */
  var tt;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  $$('.js-share').forEach(function (b) {
    b.addEventListener('click', function () {
      var data = { title: document.title, text: 'Hommage et programme des obsèques de Mme BaBo (Thérèse BABOGA, épouse YITTE)', url: location.href.split('#')[0] };
      if (navigator.share) { navigator.share(data).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(data.url).then(function () { toast('Lien copié'); }); }
      else { toast(data.url); }
    });
  });
})();
