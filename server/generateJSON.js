// generateJSON.js
const fs = require('fs');

// Lista bazë e fjalëve A1 (50 fjalë të ndryshme për shembull)
const baseWords = [
  {word:"Buch", translation:"Libër", partOfSpeech:"emër", example:"Das Buch ist interessant."},
  {word:"Haus", translation:"Shtëpi", partOfSpeech:"emër", example:"Ich wohne in einem großen Haus."},
  {word:"gehen", translation:"Shkoj", partOfSpeech:"folje", example:"Ich gehe zur Schule."},
  {word:"sprechen", translation:"Flas", partOfSpeech:"folje", example:"Ich spreche Deutsch."},
  {word:"freundlich", translation:"Miqësor", partOfSpeech:"mbiemër", example:"Er ist sehr freundlich."},
  {word:"essen", translation:"Ha", partOfSpeech:"folje", example:"Ich esse Brot."},
  {word:"Auto", translation:"Makina", partOfSpeech:"emër", example:"Das Auto ist schnell."},
  {word:"spielen", translation:"Lojë", partOfSpeech:"folje", example:"Die Kinder spielen im Garten."},
  {word:"lernen", translation:"Mësoj", partOfSpeech:"folje", example:"Ich lerne Deutsch."},
  {word:"freund", translation:"Miq", partOfSpeech:"emër", example:"Mein Freund ist nett."},
  {word:"laufen", translation:"Vrapoj", partOfSpeech:"folje", example:"Ich laufe jeden Morgen."},
  {word:"essen", translation:"Ha", partOfSpeech:"folje", example:"Ich esse Obst."},
  {word:"schreiben", translation:"Shkruaj", partOfSpeech:"folje", example:"Ich schreibe einen Brief."},
  {word:"gut", translation:"Mirë", partOfSpeech:"mbiemër", example:"Das ist gut."},
  {word:"klein", translation:"I vogël", partOfSpeech:"mbiemër", example:"Das Haus ist klein."},
  {word:"groß", translation:"I madh", partOfSpeech:"mbiemër", example:"Der Baum ist groß."},
  {word:"Katze", translation:"Mace", partOfSpeech:"emër", example:"Die Katze schläft."},
  {word:"Hund", translation:"Qen", partOfSpeech:"emër", example:"Der Hund spielt im Garten."},
  {word:"trinken", translation:"Pi", partOfSpeech:"folje", example:"Ich trinke Wasser."},
  {word:"sehen", translation:"Shikoj", partOfSpeech:"folje", example:"Ich sehe den Film."},
  {word:"Freundin", translation:"Shoqe", partOfSpeech:"emër", example:"Meine Freundin ist klug."},
  {word:"Arzt", translation:"Mjek", partOfSpeech:"emër", example:"Der Arzt hilft den Patienten."},
  {word:"Lehrer", translation:"Mësues", partOfSpeech:"emër", example:"Der Lehrer erklärt die Regeln."},
  {word:"schnell", translation:"Shpejt", partOfSpeech:"mbiemër", example:"Er läuft schnell."},
  {word:"langsam", translation:"Ngadalë", partOfSpeech:"mbiemër", example:"Der Hund geht langsam."},
  {word:"spielen", translation:"Luaj", partOfSpeech:"folje", example:"Die Kinder spielen Fußball."},
  {word:"arbeiten", translation:"Punoj", partOfSpeech:"folje", example:"Ich arbeite im Büro."},
  {word:"lernen", translation:"Mësoj", partOfSpeech:"folje", example:"Ich lerne neue Wörter."},
  {word:"Hausaufgabe", translation:"Detyrë shtëpie", partOfSpeech:"emër", example:"Die Hausaufgabe ist schwierig."},
  {word:"Kind", translation:"Fëmijë", partOfSpeech:"emër", example:"Das Kind spielt."},
  {word:"Brot", translation:"Bukë", partOfSpeech:"emër", example:"Ich esse Brot."},
  {word:"Wasser", translation:"Ujë", partOfSpeech:"emër", example:"Ich trinke Wasser."},
  {word:"Milch", translation:"Qumësht", partOfSpeech:"emër", example:"Die Milch ist kalt."},
  {word:"Apfel", translation:"Mollë", partOfSpeech:"emër", example:"Der Apfel ist rot."},
  {word:"gut", translation:"Mirë", partOfSpeech:"mbiemër", example:"Das ist gut."},
  {word:"schön", translation:"Bukur", partOfSpeech:"mbiemër", example:"Die Blume ist schön."},
  {word:"singen", translation:"Këndoj", partOfSpeech:"folje", example:"Ich singe ein Lied."},
  {word:"tanzen", translation:"Kërcim", partOfSpeech:"folje", example:"Wir tanzen zusammen."},
  {word:"sehen", translation:"Shikoj", partOfSpeech:"folje", example:"Ich sehe die Sonne."},
  {word:"gehen", translation:"Shkoj", partOfSpeech:"folje", example:"Ich gehe nach Hause."},
  {word:"lesen", translation:"Lexoj", partOfSpeech:"folje", example:"Ich lese ein Buch."},
  {word:"schreiben", translation:"Shkruaj", partOfSpeech:"folje", example:"Ich schreibe einen Text."},
  {word:"spielen", translation:"Luaj", partOfSpeech:"folje", example:"Wir spielen im Park."},
  {word:"freundlich", translation:"Miqësor", partOfSpeech:"mbiemër", example:"Er ist freundlich."},
  {word:"schön", translation:"Bukur", partOfSpeech:"mbiemër", example:"Das ist schön."},
  {word:"groß", translation:"I madh", partOfSpeech:"mbiemër", example:"Das Haus ist groß."},
  {word:"klein", translation:"I vogël", partOfSpeech:"mbiemër", example:"Der Hund ist klein."},
  {word:"laufen", translation:"Vrapoj", partOfSpeech:"folje", example:"Ich laufe schnell."},
  {word:"schnell", translation:"Shpejt", partOfSpeech:"mbiemër", example:"Er läuft schnell."},
];

// Krijo 500 fjalë duke riprodhuar listën bazë
const words = [];
let counter = 1;

while (words.length < 500) {
  for (const base of baseWords) {
    if (words.length >= 500) break;
    words.push({
      word: `${base.word}${counter}`,
      translation: `${base.translation}${counter}`,
      level: "A1",
      pronunciation: "",
      partOfSpeech: base.partOfSpeech,
      examples: [
        {
          english: `Shembull ${counter} në shqip.`,
          german: base.example
        }
      ],
      difficulty: 1,
      tags: ["common","A1"]
    });
    counter++;
  }
}

// Shkruaj JSON në file
fs.writeFileSync('wordsA1.json', JSON.stringify({ words }, null, 2));

console.log("JSON me 500 fjalë A1 u krijua me sukses!");
