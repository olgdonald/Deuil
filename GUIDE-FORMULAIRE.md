# Guide : activer le formulaire de présence

Le formulaire du site envoie chaque réponse dans **un Google Sheet** (gratuit, privé). Un onglet **« Comptage »** totalise automatiquement le nombre de personnes attendues **par activité**, avec un graphique.

Durée : environ 10 minutes, à faire une seule fois.

---

## 1. Créer le Google Sheet

1. Allez sur <https://sheets.new> (connecté au compte Google de la famille ou du responsable).
2. Nommez le fichier, par exemple : **Présences obsèques Mme BaBo**.

## 2. Installer le script

1. Dans le Sheet : **Extensions → Apps Script**.
2. Supprimez le code d'exemple, puis collez **tout** le contenu du fichier `google-apps-script/Code.gs`.
3. *(Facultatif)* Ligne `NOTIFY_EMAIL: ''` : indiquez une adresse e-mail pour être prévenu à chaque nouvelle réponse.
4. Cliquez sur l'icône **Enregistrer** (disquette).

## 3. Préparer les onglets

1. Dans la barre du haut, choisissez la fonction **`setup`** dans la liste déroulante, puis **Exécuter**.
2. Google demande d'autoriser l'accès. C'est normal (le script est le vôtre) :
   **Examiner les autorisations → votre compte → Paramètres avancés → Accéder à « … » (non sécurisé) → Autoriser**.
3. Retournez au Sheet : deux onglets sont apparus, **Comptage** et **Réponses**.

> `setup` peut être relancée sans risque : les réponses déjà reçues ne sont jamais effacées.

## 4. Publier le script

1. **Déployer → Nouveau déploiement**.
2. Roue dentée → type **Application Web**.
3. Réglages :
   - **Exécuter en tant que** : *Moi*
   - **Qui a accès** : *Tout le monde*
4. **Déployer**, puis copiez l'**URL de l'application Web** (elle se termine par `/exec`).
5. Test : ouvrez cette URL dans le navigateur. Vous devez voir : `{"ok":true,"service":"hommage-presence"}`.

## 5. Relier le site

Ouvrez `js/config.js` et collez l'URL :

```js
window.HOMMAGE_CONFIG = {
  formEndpoint: "https://script.google.com/macros/s/XXXXXXXX/exec"
};
```

## 6. Mettre en ligne (GitHub Pages)

1. Envoyez le dossier du site sur GitHub (`git add . && git commit -m "Formulaire" && git push`).
2. Sur GitHub : **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**.
3. Après une minute, le site est disponible à l'adresse `https://<votre-compte>.github.io/<nom-du-dépôt>/`.

## 7. Tester avant de partager

1. Ouvrez le site publié sur un téléphone et envoyez **une fausse réponse** (par exemple « Test Famille », 2 personnes, quelques activités).
2. Vérifiez qu'elle apparaît dans **Réponses** et que **Comptage** s'est mis à jour.
3. Supprimez la ligne de test dans **Réponses** (clic droit sur le numéro de ligne → *Supprimer la ligne*).

---

## Lire les résultats

**Onglet « Comptage »** : à consulter pour l'organisation.

| Colonne | Signification |
|---|---|
| **Personnes attendues** | Total des personnes (le nombre indiqué par chacun, « vous inclus ») qui ont coché cette activité |
| **Réponses** | Nombre de réponses (foyers ou personnes) ayant coché cette activité |

En haut : nombre de réponses « présent(e) », « absent(e) » et total de personnes attendues. Le graphique en barres montre les écarts d'une activité à l'autre.

**Onglet « Réponses »** : le détail (nom, téléphone, ville, message pour la famille, activités choisies). Utilisez **Données → Créer un filtre** pour trier, par exemple par activité ou par ville.

## Bon à savoir

- **Pas de doublon.** Si une personne répond une seconde fois avec le même numéro de téléphone (ou, sans téléphone, le même nom), sa nouvelle réponse **remplace** l'ancienne. Elle peut donc corriger sa réponse. C'est pourquoi le téléphone est utile.
- **Confidentialité.** Le Sheet reste privé : ne le partagez qu'avec les organisateurs. L'URL `/exec` ne divulgue aucune donnée ; elle ne sert qu'à recevoir les réponses. Les noms et numéros collectés ne doivent pas être rendus publics.
- **Modifier le script plus tard.** Après toute modification de `Code.gs` : **Déployer → Gérer les déploiements → crayon → Version : Nouvelle version → Déployer**. L'URL ne change pas. Sans cette étape, l'ancienne version reste active.
- **Changer les activités ou les horaires.** Il faut les modifier à deux endroits : dans `index.html` (cases du formulaire, attribut `value`) et dans la liste `ACTIVITIES` de `Code.gs` (mêmes identifiants), puis relancer `setup` et redéployer une nouvelle version.
- **Si l'envoi échoue.** Le visiteur voit un message et ses réponses restent dans le formulaire : il peut réessayer. Vérifiez alors l'étape 4 (accès **Tout le monde**) et que l'URL de `config.js` est complète.
