# Habit Tracker

Una piccola app web, in italiano, per tenere traccia delle abitudini quotidiane. Funziona direttamente nel browser e salva i dati in `localStorage`: non servono account, server o dipendenze.

## Avvio

Apri `index.html` nel browser. In alternativa, avvia un server statico dalla cartella del progetto, ad esempio:

```bash
python3 -m http.server 8000
```

Poi visita <http://localhost:8000>.

## Funzionalità

- Aggiungi e rimuovi abitudini.
- Segna i giorni completati nella settimana.
- Visualizza le serie consecutive e i progressi settimanali.
- Conserva i dati sul dispositivo tramite `localStorage`.
- Layout responsive, utilizzabile anche da mobile.

## Stack

HTML, CSS e JavaScript vanilla; nessuna installazione richiesta.

## Dati

Le abitudini restano nel browser e non vengono inviate a un server. Cancellando i dati del sito nel browser, verranno cancellati anche i progressi salvati.
