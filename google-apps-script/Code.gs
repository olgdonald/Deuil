/**
 * Hommage à Mme BaBo — réception des confirmations de présence
 * ------------------------------------------------------------
 * Ce script reçoit les réponses du formulaire du site et les range dans un
 * Google Sheet (gratuit). Il crée aussi un onglet « Comptage » qui totalise
 * automatiquement le nombre de personnes attendues PAR ACTIVITÉ.
 *
 * Mode d'emploi complet : voir GUIDE-FORMULAIRE.md
 *   1. Ouvrir un Google Sheet vide  >  Extensions  >  Apps Script
 *   2. Coller tout ce fichier, enregistrer
 *   3. Exécuter une fois la fonction « setup » (autoriser l'accès)
 *   4. Déployer  >  Nouveau déploiement  >  Application Web
 *        Exécuter en tant que : Moi      Qui a accès : Tout le monde
 *   5. Copier l'URL « …/exec » dans js/config.js du site
 */

var CONFIG = {
  SHEET_RESPONSES: 'Réponses',
  SHEET_COUNT: 'Comptage',
  NOTIFY_EMAIL: '' // facultatif : une adresse e-mail prévenue à chaque nouvelle réponse
};

// Les identifiants (id) doivent rester identiques à ceux du site (index.html).
var ACTIVITIES = [
  { id: 'ven-levee',     day: 'Vendredi 30 oct.', time: '10h00', label: 'Levée de corps (Hôpital de la Caisse, Essos)' },
  { id: 'ven-messe',     day: 'Vendredi 30 oct.', time: '12h00', label: "Messe d'action de grâce (Chapelle Essos)" },
  { id: 'ven-cortege',   day: 'Vendredi 30 oct.', time: '14h00', label: 'Départ du cortège funèbre pour Balamba' },
  { id: 'ven-arrivee',   day: 'Vendredi 30 oct.', time: '16h00', label: 'Arrivée et installation de la dépouille (Balamba)' },
  { id: 'ven-veillee',   day: 'Vendredi 30 oct.', time: '20h00', label: 'Messe, veillée funèbre et recueillement (Balamba)' },
  { id: 'sam-accueil',   day: 'Samedi 31 oct.',   time: '09h00', label: 'Accueil et installation' },
  { id: 'sam-trad',      day: 'Samedi 31 oct.',   time: '10h00', label: 'Ouverture des cérémonies traditionnelles' },
  { id: 'sam-messe',     day: 'Samedi 31 oct.',   time: '12h00', label: "Messe d'action de grâce, témoignages et hommages" },
  { id: 'sam-inhum',     day: 'Samedi 31 oct.',   time: '14h00', label: 'Inhumation (intimité familiale)' },
  { id: 'sam-collation', day: 'Samedi 31 oct.',   time: '14h30', label: 'Collation offerte aux invités' }
];

// Colonnes de l'onglet « Réponses »
var COL = { TIME: 1, NAME: 2, PHONE: 3, CITY: 4, PRESENCE: 5, PERSONS: 6, MESSAGE: 7, FIRST_ACT: 8 };
function keyCol_() { return COL.FIRST_ACT + ACTIVITIES.length; }
function colLetter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** À exécuter UNE fois : prépare les onglets, les titres, les formules et le graphique.
 *  Peut être relancée sans risque : les réponses déjà reçues ne sont pas effacées. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Onglet Réponses
  var r = ss.getSheetByName(CONFIG.SHEET_RESPONSES) || ss.insertSheet(CONFIG.SHEET_RESPONSES);
  var headers = ['Date et heure', 'Nom', 'Téléphone', 'Ville / pays', 'Présence', 'Personnes', 'Message'];
  ACTIVITIES.forEach(function (a) { headers.push(a.day + ' · ' + a.time + ' · ' + a.label); });
  headers.push('Clé (ne pas modifier)');
  // Sécurité : si des réponses existent déjà, on ne les efface JAMAIS (on remet seulement les titres).
  if (r.getLastRow() <= 1) r.clear();
  r.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#15241a').setFontColor('#fbf6e8').setWrap(true).setVerticalAlignment('middle');
  r.setRowHeight(1, 92);
  r.setFrozenRows(1);
  r.setColumnWidth(COL.NAME, 200); r.setColumnWidth(COL.PHONE, 130); r.setColumnWidth(COL.CITY, 140);
  r.setColumnWidth(COL.MESSAGE, 260);
  for (var c = COL.FIRST_ACT; c < keyCol_(); c++) r.setColumnWidth(c, 96);
  r.getRange(2, COL.PHONE, 2000, 1).setNumberFormat('@');          // téléphone en texte
  r.getRange(2, COL.TIME, 2000, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  r.hideColumns(keyCol_());

  // --- Onglet Comptage
  var s = ss.getSheetByName(CONFIG.SHEET_COUNT) || ss.insertSheet(CONFIG.SHEET_COUNT, 0);
  s.clear();
  s.getCharts().forEach(function (ch) { s.removeChart(ch); });
  var R = "'" + CONFIG.SHEET_RESPONSES + "'!";
  var pc = colLetter_(COL.PERSONS), pr = colLetter_(COL.PRESENCE);

  s.getRange('A1').setValue('Hommage à Mme BaBo · Confirmations de présence')
    .setFontSize(18).setFontWeight('bold').setFontColor('#15241a');
  s.getRange('A2').setValue('Ce tableau se met à jour tout seul à chaque nouvelle réponse.').setFontColor('#6b6b5a');

  s.getRange('A4:C4').setValues([['Réponses « présent(e) »', 'Réponses « absent(e) »', 'Personnes attendues (au total)']])
    .setFontWeight('bold').setBackground('#efe4cb').setWrap(true);
  s.getRange('A5').setFormula('=COUNTIF(' + R + pr + '2:' + pr + ',"Oui")');
  s.getRange('B5').setFormula('=COUNTIF(' + R + pr + '2:' + pr + ',"Non")');
  s.getRange('C5').setFormula('=SUMIF(' + R + pr + '2:' + pr + ',"Oui",' + R + pc + '2:' + pc + ')');
  s.getRange('A5:C5').setFontSize(22).setFontWeight('bold').setHorizontalAlignment('center').setFontColor('#b07d1f');

  var top = 8;
  s.getRange(top, 1, 1, 5).setValues([['Jour', 'Heure', 'Activité', 'Personnes attendues', 'Réponses']])
    .setFontWeight('bold').setBackground('#15241a').setFontColor('#fbf6e8');
  ACTIVITIES.forEach(function (a, i) {
    var row = top + 1 + i, L = colLetter_(COL.FIRST_ACT + i);
    s.getRange(row, 1, 1, 3).setValues([[a.day, a.time, a.label]]);
    s.getRange(row, 4).setFormula('=SUM(' + R + L + '2:' + L + ')');
    s.getRange(row, 5).setFormula('=COUNTIF(' + R + L + '2:' + L + ',">0")');
  });
  var last = top + ACTIVITIES.length;
  s.getRange(top + 1, 4, ACTIVITIES.length, 1).setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center').setBackground('#fbf6e8');
  s.getRange(top + 1, 5, ACTIVITIES.length, 1).setHorizontalAlignment('center');
  s.getRange(top, 1, ACTIVITIES.length + 1, 5).setBorder(true, true, true, true, true, true, '#d9c79a', SpreadsheetApp.BorderStyle.SOLID);
  s.setColumnWidth(1, 150); s.setColumnWidth(2, 80); s.setColumnWidth(3, 380); s.setColumnWidth(4, 150); s.setColumnWidth(5, 110);

  var chart = s.newChart().setChartType(Charts.ChartType.BAR)
    .addRange(s.getRange(top, 3, ACTIVITIES.length + 1, 1))
    .addRange(s.getRange(top, 4, ACTIVITIES.length + 1, 1))
    .setNumHeaders(1)
    .setOption('title', 'Personnes attendues par activité')
    .setOption('legend', { position: 'none' })
    .setOption('colors', ['#b07d1f'])
    .setOption('width', 760).setOption('height', 420)
    .setPosition(last + 3, 1, 0, 0)
    .build();
  s.insertChart(chart);
  s.setHiddenGridlines(true);
  ss.setActiveSheet(s);
}

/** Réception d'une réponse envoyée par le site. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);

    if (d.website) return out_({ ok: true });                       // champ piège anti-robot

    var name = clean_(d.name, 120);
    if (name.length < 2) return out_({ ok: false, error: 'nom' });
    var presence = d.presence === 'Oui' ? 'Oui' : (d.presence === 'Non' ? 'Non' : '');
    if (!presence) return out_({ ok: false, error: 'presence' });

    var phone = String(d.phone || '').replace(/[^0-9+()\-. ]/g, '').slice(0, 30);
    var city = clean_(d.city, 80);
    var message = clean_(d.message, 600);
    var persons = presence === 'Oui' ? Math.max(1, Math.min(50, parseInt(d.persons, 10) || 1)) : 0;

    var chosen = {};
    if (presence === 'Oui' && Array.isArray(d.activities)) d.activities.forEach(function (id) { chosen[id] = true; });

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_RESPONSES);
    if (!sheet) throw new Error('Exécutez d\'abord la fonction setup().');

    var row = [new Date(), name, phone, city, presence, persons, message];
    ACTIVITIES.forEach(function (a) { row.push(chosen[a.id] ? persons : ''); });
    var digits = phone.replace(/\D/g, '');
    var key = digits.length >= 6 ? 'tel:' + digits : 'nom:' + name.toLowerCase().replace(/\s+/g, ' ');
    row.push(key);

    // Si la même personne répond de nouveau, sa réponse précédente est remplacée (pas de doublon).
    var kc = keyCol_(), n = sheet.getLastRow() - 1, target = 0;
    if (n > 0) {
      var keys = sheet.getRange(2, kc, n, 1).getValues();
      for (var i = keys.length - 1; i >= 0; i--) { if (keys[i][0] === key) { target = i + 2; break; } }
    }
    if (!target) target = sheet.getLastRow() + 1;
    sheet.getRange(target, 1, 1, row.length).setValues([row]);

    if (CONFIG.NOTIFY_EMAIL) {
      MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, 'Nouvelle confirmation : ' + name,
        name + ' · ' + presence + (persons ? ' · ' + persons + ' personne(s)' : ''));
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/** Test rapide dans le navigateur : l'URL doit afficher {"ok":true}. Aucune donnée n'est exposée. */
function doGet() { return out_({ ok: true, service: 'hommage-presence' }); }

function clean_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;                            // neutralise les formules injectées
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
