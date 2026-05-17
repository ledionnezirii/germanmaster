/**
 * Albanian UI always — only the target language name changes.
 * de → gjermane/gjerman   en → angleze/anglez   fr → frënge/frëng
 */

const LANG = {
  de: { adj: "gjermane", adv: "gjerman" },
  en: { adj: "angleze",  adv: "anglez"  },
  fr: { adj: "frënge",   adv: "frëng"   },
};

export function getSectionTexts(section, language) {
  const { adj, adv } = LANG[language] ?? LANG.de;

  if (section === "sentences") return {
    label:       "PRAKTIKË GJUHËSORE",
    title:       "Ndërto Fjali",
    subtitle:    "Rregulloni fjalët në rendin e saktë",
    description: `Në këtë seksion do të praktikoni ndërtimin e fjalive të sakta ${adj}. Zgjidhni nivelin tuaj dhe rregulloni fjalët në rendin e duhur gramatikor.`,
  };

  if (section === "createWord") return {
    label:       "PRAKTIKË GJUHËSORE",
    title:       "Formo Fjalën",
    subtitle:    "Ndërto fjalorin tënd hap pas hapi",
    description: `Në çdo mësim do të formoni fjalë ${adj} duke zgjedhur shkronjat në rendin e saktë. Praktika e rregullt ndihmon në memorizimin e fjalorit të ri.`,
  };

  if (section === "quiz") return {
    label:       "PRAKTIKË GJUHËSORE",
    title:       "Kuizet",
    subtitle:    "Testoni njohuritë tuaja",
    description: `Zgjidhni nivelin dhe filloni kuizin. Secili kuiz ka pyetje me shumë zgjedhje nga gjuha ${adj}. Fitoni XP për çdo kuiz të përfunduar.`,
  };

  if (section === "pronunciation") return {
    label:       "PRAKTIKË GJUHËSORE",
    title:       "Shqiptimi",
    subtitle:    "Dëgjo, regjistro zërin tënd dhe arri saktësi",
    description: `Në çdo paketë dëgjo shqiptimin e saktë ${adv} dhe regjistro zërin tënd. Përfundo të paktën 70% të fjalëve për të kaluar secilën paketë.`,
  };

  return {};
}
