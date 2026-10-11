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
  var lb = $('#lb'), lbImg = $('#lbImg');
  $$('.shot').forEach(function (s) {
    s.addEventListener('click', function () {
      lbImg.src = s.getAttribute('data-src'); lbImg.alt = $('img', s).alt;
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

  /* ---------- Formulaire de présence ---------- */
  var form = $('#rsvp');
  if (form) {
    var yesOnly = $('#yesOnly'), thanks = $('#thanks'), statusEl = $('#formStatus'), btn = $('#submitBtn');
    var persons = $('#f-persons');
    var checks = $$('input[name=act]', form);

    function presenceValue() { return $('input[name=presence]:checked', form).value; }
    function applyPresence() { yesOnly.hidden = presenceValue() !== 'Oui'; }
    $$('input[name=presence]', form).forEach(function (r) { r.addEventListener('change', applyPresence); });
    applyPresence();

    // « Tout cocher » par journée
    $$('.linkbtn', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var prefix = b.getAttribute('data-all') + '-';
        var group = checks.filter(function (c) { return c.value.indexOf(prefix) === 0; });
        var all = group.every(function (c) { return c.checked; });
        group.forEach(function (c) { c.checked = !all; });
        b.textContent = all ? 'Tout cocher' : 'Tout décocher';
        setErr('acts', '');
      });
    });
    checks.forEach(function (c) { c.addEventListener('change', function () { setErr('acts', ''); }); });

    // Nombre de personnes
    function clampPersons() {
      var n = parseInt(persons.value, 10);
      persons.value = isNaN(n) ? 1 : Math.max(1, Math.min(50, n));
    }
    persons.addEventListener('change', clampPersons);
    $$('[data-step]', form).forEach(function (b) {
      b.addEventListener('click', function () { clampPersons(); persons.value = +persons.value + (+b.getAttribute('data-step')); clampPersons(); });
    });

    function setErr(key, msg) {
      var p = $('[data-err=' + key + ']', form); if (!p) return;
      p.textContent = msg;
      var f = p.closest('.field'); if (f) f.classList.toggle('has-err', !!msg);
    }
    $('#f-name').addEventListener('input', function () { setErr('name', ''); });

    function selectedActivities() {
      return checks.filter(function (c) { return c.checked; }).map(function (c) {
        var lab = c.closest('.act');
        return { id: c.value, time: (c.value.indexOf('ven-') === 0 ? 'Ven. ' : 'Sam. ') + $('.act__time', lab).textContent.replace(/\s/g, ''), label: $('.act__body b', lab).textContent };
      });
    }

    function validate() {
      var ok = true, first = null;
      var name = $('#f-name').value.trim();
      if (name.length < 2) { setErr('name', 'Merci d\'indiquer votre nom.'); ok = false; first = $('#f-name'); }
      if (presenceValue() === 'Oui' && !selectedActivities().length) {
        setErr('acts', 'Cochez au moins un moment, ou choisissez « de cœur avec vous ».'); ok = false;
        first = first || $('.acts', form);
      }
      if (first) { first.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); if (first.focus && first.tagName === 'INPUT') first.focus({ preventScroll: true }); }
      return ok;
    }

    function setStatus(msg, isErr) { statusEl.textContent = msg; statusEl.classList.toggle('is-err', !!isErr); }

    function showThanks(payload, acts) {
      var yes = payload.presence === 'Oui';
      $('#thanksTitle').textContent = 'Merci, ' + payload.name;
      $('#thanksText').textContent = yes
        ? 'Votre présence est bien enregistrée. La famille a hâte de vous accueillir.'
        : 'Votre message a bien été reçu. La famille sera touchée de savoir que vous êtes de cœur avec elle.';
      var ul = $('#thanksList'); ul.textContent = '';
      if (yes) {
        acts.forEach(function (a) {
          var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span');
          b.textContent = a.time; s.textContent = a.label; li.appendChild(b); li.appendChild(s); ul.appendChild(li);
        });
        if (payload.persons > 1) {
          var li2 = document.createElement('li'); li2.textContent = payload.persons + ' personnes au total'; ul.appendChild(li2);
        }
      }
      form.hidden = true; thanks.hidden = false;
      thanks.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }

    $('#editAnswer').addEventListener('click', function () {
      thanks.hidden = true; form.hidden = false; setStatus('');
      form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('');
      if (!validate()) return;
      clampPersons();

      var yes = presenceValue() === 'Oui', acts = yes ? selectedActivities() : [];
      var payload = {
        name: $('#f-name').value.trim(),
        phone: $('#f-phone').value.trim(),
        city: $('#f-city').value.trim(),
        presence: presenceValue(),
        persons: yes ? +persons.value : 0,
        activities: acts.map(function (a) { return a.id; }),
        message: $('#f-msg').value.trim(),
        website: $('input[name=website]', form).value // champ piège : vide chez un vrai visiteur
      };

      var url = (window.HOMMAGE_CONFIG || {}).formEndpoint;
      if (!url) {
        console.warn('formEndpoint manquant dans js/config.js');
        setStatus('Le formulaire n\'est pas encore activé. Merci de réessayer un peu plus tard.', true);
        return;
      }

      btn.disabled = true; btn.classList.add('busy'); setStatus('Envoi en cours');
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // évite la pré-requête CORS (Apps Script)
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || 'refus');
          setStatus('');
          showThanks(payload, acts);
        })
        .catch(function () {
          setStatus('L\'envoi n\'a pas abouti. Vérifiez votre connexion puis réessayez : vos réponses sont conservées.', true);
        })
        .then(function () { clearTimeout(timer); btn.disabled = false; btn.classList.remove('busy'); });
    });
  }
})();
