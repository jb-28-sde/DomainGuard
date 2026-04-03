export default function generateVariants(domain) {
  if (!domain || !domain.includes(".")) {
    return [];
  }

  const [name, extension] = domain.split(".");
  const variants = new Set();

  //Character replacement map
  const charMap = {
    o: ["0"],
    l: ["1", "i"],
    e: ["3"],
    a: ["@"],
    s: ["5", "$"],
    i: ["1", "l"],
  };

  // Keyboard adjacency map
  const keyboardMap = {
    a: ["q", "s", "z"],
    b: ["v", "g", "h", "n"],
    c: ["x", "d", "f", "v"],
    d: ["s", "e", "r", "f", "c", "x"],
    e: ["w", "r", "s", "d"],
    f: ["d", "r", "t", "g", "v", "c"],
    g: ["f", "t", "y", "h", "b", "v"],
    h: ["g", "y", "u", "j", "n", "b"],
    i: ["u", "o", "k", "j"],
    j: ["h", "u", "i", "k", "n", "m"],
    k: ["j", "i", "o", "l", "m"],
    l: ["k", "o", "p"],
    m: ["n", "j", "k"],
    n: ["b", "h", "j", "m"],
    o: ["i", "p", "k", "l"],
    p: ["o", "l"],
    q: ["w", "a"],
    r: ["e", "t", "d", "f"],
    s: ["a", "w", "e", "d", "x", "z"],
    t: ["r", "y", "f", "g"],
    u: ["y", "i", "h", "j"],
    v: ["c", "f", "g", "b"],
    w: ["q", "e", "a", "s"],
    x: ["z", "s", "d", "c"],
    y: ["t", "u", "g", "h"],
    z: ["a", "s", "x"],
  };

  // Common phishing words
  const commonWords = ["login", "secure", "support"];

  // 1. Missing character
  for (let i = 0; i < name.length; i++) {
    let newName = name.slice(0, i) + name.slice(i + 1);
    variants.add(newName + "." + extension);
  }

  // 2. Adjacent swap
  for (let i = 0; i < name.length - 1; i++) {
    let newName = name.slice(0, i) + name[i + 1] + name[i] + name.slice(i + 2);

    variants.add(newName + "." + extension);
  }

  // 3. Character duplication
  for (let i = 0; i < name.length; i++) {
    const char = name[i];

    if (!/[a-zA-Z]/.test(char)) continue;

    let newName = name.slice(0, i) + char + char + name.slice(i + 1);

    variants.add(newName + "." + extension);
  }

  //  Single character replacement
  for (let i = 0; i < name.length; i++) {
    const char = name[i].toLowerCase();

    if (charMap[char]) {
      for (let replacement of charMap[char]) {
        let newName = name.slice(0, i) + replacement + name.slice(i + 1);

        variants.add(newName + "." + extension);
      }
    }
  }

  // 5. Double character replacement
  for (let i = 0; i < name.length; i++) {
    for (let j = i + 1; j < name.length; j++) {
      const char1 = name[i].toLowerCase();
      const char2 = name[j].toLowerCase();

      if (charMap[char1] && charMap[char2]) {
        for (let rep1 of charMap[char1]) {
          for (let rep2 of charMap[char2]) {
            let newName =
              name.slice(0, i) +
              rep1 +
              name.slice(i + 1, j) +
              rep2 +
              name.slice(j + 1);

            variants.add(newName + "." + extension);
          }
        }
      }
    }
  }

  // 6. Keyboard adjacency
  for (let i = 0; i < name.length; i++) {
    const char = name[i].toLowerCase();

    if (keyboardMap[char]) {
      for (let adjacent of keyboardMap[char]) {
        let newName = name.slice(0, i) + adjacent + name.slice(i + 1);

        variants.add(newName + "." + extension);
      }
    }
  }

  // 7. Hyphen variations
  // domain + word
  for (let word of commonWords) {
    variants.add(`${name}-${word}.${extension}`);
  }

  // word + domain
  for (let word of commonWords) {
    variants.add(`${word}-${name}.${extension}`);
  }

  // split inside domain
  for (let i = 3; i < name.length - 2; i++) {
    let newName = name.slice(0, i) + "-" + name.slice(i);

    variants.add(newName + "." + extension);
  }

  //  Readability filter
  function isReadable(str) {
    return /^[a-zA-Z0-9@$.-]+$/.test(str);
  }

  return Array.from(variants)
    .filter((v) => isReadable(v))
    .slice(0, 80);
}
const phishingKeywords = ["login", "secure", "support", "verify"];
export const generatePhishingVariants = (domain) => {
  if (!domain || !domain.includes(".")) {
    return [];
  }
  const [name, extension] = domain.split(".");
  const variants = new Set();
  phishingKeywords.forEach((keyword) => {
    variants.add(`${name}${keyword}.${extension}`);
    variants.add(`${keyword}${name}.${extension}`);
    variants.add(`${name}-${keyword}.${extension}`);
    variants.add(`${keyword}_${name}.${extension}`);
  });
  return Array.from(variants);
}
