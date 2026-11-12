# MG Multimédia • Remote

Télécommande **plein écran pour iPhone** (PWA) des deux tablettes Android. Une seule page (`index.html`), sans dépendance.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | L'application (interface, client WebSocket, mode démonstration) |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil, icône MG |
| `sw.js` | Lancement instantané et hors ligne de l'interface |
| `test/serveur-factice.js` | Faux serveur WebSocket pour essayer ou tester la télécommande |
| `test/remote_test.py` | 95 vérifications automatiques dans un navigateur (viewport iPhone) |

## Essayer tout de suite

Ouvrez `index.html` : au premier lancement, sans serveur configuré, le **mode démonstration** simule deux tablettes (batterie, volume, média, retours d'état). Il se désactive dans ⚙ Réglages.

## Installer sur l'iPhone (plein écran, sans barre Safari)

1. Hébergez le dossier en **https** (GitHub Pages convient) et ouvrez l'adresse dans **Safari**.
2. Touchez **Partager** puis **Sur l'écran d'accueil**.
3. Lancez « MG Remote » depuis l'écran d'accueil : l'application s'ouvre sans barre Safari, avec l'encoche et la barre de l'écran d'accueil prises en compte.

## Se connecter au serveur

Dans ⚙ Réglages : adresse du serveur (celle affichée par `infos-serveur.sh`, par exemple `wss://192.168.43.1:8443/sync`), code de jumelage à 6 chiffres (première connexion seulement), nom de l'iPhone.

- Une page en https exige une adresse **`wss://`** (le navigateur refuse `ws://`).
- Avec le serveur Termux, l'iPhone doit **faire confiance au certificat** : installez `ca.crt` (Réglages > Général > VPN et gestion de l'appareil), puis activez-le dans Réglages > Général > Informations > Réglages de confiance des certificats.
- Si iOS demande l'accès au **réseau local**, acceptez.
- L'iPhone doit être connecté au Wi-Fi du point d'accès de la tablette 1.

## Fonctions

- **En-tête** : voyant de connexion (Connecté / Reconnexion… / Déconnecté, avec la latence) ; touchez-le pour forcer une reconnexion. Deux cartes en direct : batterie, volume, média en cours, lecture/pause, contenu autorisé/bloqué.
- **Contrôle** : cible (*Les 2 tablettes*, *Tablette 1*, *Tablette 2*) ; **Lancer Synchro / Pause** (démarrage simultané à l'heure précise `at`) ; **Autoriser le contenu** ; **Stop / Bloquer** ; curseur de volume (≈ 12 envois par seconde au maximum, valeur finale garantie).
- **Annonces vocales** : *Ceinture de sécurité*, *Ne pas manger*, *Baisser le volume*, et un champ libre.
- **Journal** : tiroir horodaté (envois, accusés de réception avec délai, retours des tablettes, erreurs), filtre « Erreurs seulement », « Effacer ».
- **Reconnexion automatique** : délais croissants de 0,8 s à 15 s, ping toutes les 7 s, serveur muet détecté au bout de 22 s, reprise au retour de l'application au premier plan (iOS suspend les connexions en arrière-plan).

## Protocole Remote v1 (messages JSON)

L'iPhone se présente avec le rôle `remote`. Les tablettes s'appellent `t1` et `t2`.

**iPhone → serveur**

| Message | Contenu |
|---|---|
| Jumelage | `{"t":"pair","role":"remote","v":1,"id":"rm-…","name":"iPhone","code":"123456"}` |
| Reconnexion | `{"t":"hello","role":"remote","v":1,"id":"rm-…","name":"iPhone","token":"…"}` |
| Ping | `{"t":"ping","id":"…","t0":1700000000000}` |
| Commande | `{"t":"cmd","id":"…","cmd":"…","target":"both"\|"t1"\|"t2","ts":<heure serveur estimée>, …}` |

Commandes (`cmd`) : `sync` (`action`: `play` ou `pause`, `at`: heure d'exécution en ms, `lead`: délai laissé), `unlock`, `lock`, `volume` (`value` 0–100), `tts` (`text`, `lang`: `fr-FR`).

**Serveur → iPhone**

| Message | Contenu |
|---|---|
| `paired` | `{"t":"paired","token":"…"}` (à conserver) |
| `ready` | Authentification acceptée |
| `snapshot` | `{"t":"snapshot","devs":{"t1":{…},"t2":{…}}}` |
| `state` | `{"t":"state","dev":"t1","battery":78,"charging":false,"volume":45,"media":"…","playing":false,"locked":false,"online":true}` |
| `ack` | `{"t":"ack","id":"…","dev":"t1","ok":true}` (un par tablette) |
| `log` | `{"t":"log","dev":"t1","level":"info","msg":"annonce lue"}` |
| `pong` | `{"t":"pong","id":"…","t0":…,"ts":<horloge du serveur>}` : sert à estimer latence et décalage d'horloge |
| `error` | `{"t":"error","code":"pair"\|"auth","msg":"…"}` |

**Synchro** : le serveur transmet `sync` aux tablettes ; chaque tablette lance ou met en pause à l'instant `at` (en corrigeant le décalage de sa propre horloge avec le serveur). `lead` vaut au moins 500 ms (2 × latence + 250 ms).

## Ce qui reste à faire côté serveur et tablettes

Cette livraison est **uniquement l'interface**. Le serveur `sync-server.js` et l'application des tablettes ne comprennent pas encore le rôle `remote` : il faut y ajouter le jumelage de ce 3e appareil, le relais des commandes (`sync`, `unlock`, `lock`, `volume`, `tts`), l'envoi de `state`/`ack`, et la lecture des annonces avec `speechSynthesis` (`fr-FR`). Le faux serveur `test/serveur-factice.js` montre un comportement de référence.

## Tests

```
python3 test/remote_test.py
```
Lance l'application et le faux serveur, puis vérifie : jumelage, télémétrie, commandes et horodatage, volume, annonces (textes exacts), journal, coupure et reconnexion, serveur muet, mode démonstration, balises iOS, zones de sécurité, absence de défilement horizontal à 375 / 390 / 430 px et cibles tactiles de 44 px.
Les essais utilisent Chromium avec un viewport et un agent iPhone : le rendu dans Safari iOS lui-même n'a pas pu être vérifié.
