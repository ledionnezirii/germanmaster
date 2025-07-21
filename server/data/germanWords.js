const germanWords = [
  { id: 1, word: "Hallo", translation: "Përshëndetje" },
  { id: 2, word: "Danke", translation: "Faleminderit" },
  { id: 3, word: "Bitte", translation: "Ju lutem" },
  { id: 4, word: "Ja", translation: "Po" },
  { id: 5, word: "Nein", translation: "Jo" },
  { id: 6, word: "Guten Morgen", translation: "Mirëmëngjes" },
  { id: 7, word: "Guten Tag", translation: "Mirëdita" },
  { id: 8, word: "Guten Abend", translation: "Mirëmbrëma" },
  { id: 9, word: "Gute Nacht", translation: "Natën e mirë" },
  { id: 10, word: "Auf Wiedersehen", translation: "Mirupafshim" },
  { id: 11, word: "Wie geht es Ihnen?", translation: "Si jeni?" },
  { id: 12, word: "Mir geht es gut", translation: "Jam mirë" },
  { id: 13, word: "Ich liebe dich", translation: "Të dua" },
  { id: 14, word: "Entschuldigung", translation: "Më falni" },
  { id: 15, word: "Hilfe", translation: "Ndihmë" },
  { id: 16, word: "Wasser", translation: "Ujë" },
  { id: 17, word: "Brot", translation: "Bukë" },
  { id: 18, word: "Milch", translation: "Qumësht" },
  { id: 19, word: "Apfel", translation: "Mollë" },
  { id: 20, word: "Haus", translation: "Shtëpi" },
  { id: 21, word: "Schule", translation: "Shkollë" },
  { id: 22, word: "Lehrer", translation: "Mësues" },
  { id: 23, word: "Student", translation: "Student" },
  { id: 24, word: "Buch", translation: "Libër" },
  { id: 25, word: "Stift", translation: "Laps" },
  { id: 26, word: "Tisch", translation: "Tavolinë" },
  { id: 27, word: "Stuhl", translation: "Karrige" },
  { id: 28, word: "Fenster", translation: "Dritare" },
  { id: 29, word: "Tür", translation: "Derë" },
  { id: 30, word: "Computer", translation: "Kompjuter" },
];

const getRandomGermanWords = (count = 10) => {
  const shuffled = [...germanWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

module.exports = { getRandomGermanWords };
