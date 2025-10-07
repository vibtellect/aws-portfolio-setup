# <NAME> – Kurz

Zweck
- <1 Zeile: Was liefert das Construct?>

Wann verwenden
- <2–3 Stichpunkte zu typischen Szenarien>

Voraussetzungen
- AWS CDK v2, Node 18+, AWS CLI konfiguriert

Einbindung
1) Ordner in dein CDK-Projekt kopieren (z. B. src/constructs/<name>)
2) In deinem Stack importieren und mit Props instanziieren

Beispiel (TypeScript)
```ts
// In deinem CDK-Stack (vereinfachtes Beispiel)
// import { <ClassName> } from "./constructs/<name>";

// const c = new <ClassName>(this, "<Id>", {
//   // TODO: Props setzen (siehe Abschnitt Props)
// });
```

Props (wichtigste)
- <propA>: <kurz>
- <propB>: <kurz>
- <propC?>: <optional>

Outputs
- <Output1>
- <Output2>

Defaults
- Verschlüsselung/Logs aktiv, minimaler Kosten-Footprint
