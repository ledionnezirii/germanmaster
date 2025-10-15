// generateSubjects.js
const fs = require("fs");
const topics = require("./topics");

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function createSubject(name, index) {
  const level = index < 15 ? "A2" : index < 30 ? "B1" : "B2";
  const difficulty = index < 15 ? 2 : index < 30 ? 3 : 4;

  return {
    name: `${name}`,
    description: `Ky modul trajton përdorimin e temës "${name}" në gjuhën gjermane. Ai shpjegon rregullat gramatikore, shembuj praktikë dhe ushtrime për përdoruesit shqiptarë që mësojnë gjermanishten.`,
    level,
    difficulty,
    tags: [name.toLowerCase(), "grammar", level],
    content: `1. Përshkrimi\nKy seksion shpjegon përdorimin dhe formimin e "${name}" në gjuhën gjermane.\n\n2. Shembuj\n- Der Student lernt ${name.toLowerCase()}.\n- Wir üben ${name.toLowerCase()} im Unterricht.`,
    examples: [
      {
        english: "Shembull i parë për këtë temë.",
        german: `Er verwendet ${name.toLowerCase()} korrekt.`,
        explanation: "Shembull i përdorimit në fjali."
      },
      {
        english: "Shembull i dytë për këtë temë.",
        german: `Wir lernen ${name.toLowerCase()} heute.`,
        explanation: "Shembull praktik për nxënësit."
      }
    ],
    exercises: [
      {
        question: `1. Zgjidh formën e saktë për "${name}":`,
        options: ["Opsioni A", "Opsioni B", "Opsioni C"],
        correctAnswer: "Opsioni A",
        english: "Ushtrim bazik për këtë temë."
      },
      {
        question: `2. Plotëso fjalinë me formën e saktë (${name}):`,
        options: ["A", "B", "C"],
        correctAnswer: "B",
        english: "Ushtrim praktik për këtë temë."
      }
    ]
  };
}

const data = topics.map((topic, i) => createSubject(topic, i));
fs.writeFileSync("grammarSubjects.json", JSON.stringify(data, null, 2), "utf-8");

console.log(`✅ ${data.length} grammar subjects generated and saved to grammarSubjects.json`);
