<<<<<<< HEAD
module.exports = function(domain) {
    const variants = [];

    if (!domain) return variants;

    // Remove protocol
    domain = domain.replace(/^https?:\/\//, '');

    // Split domain (name + extension)
    const parts = domain.split('.');
    const name = parts[0];
    const ext = parts.slice(1).join('.');

    // Character replacements (one at a time)
    const replacements = {
        'o': '0',
        'i': '1',
        'e': '3',
        'a': '@'
    };

    for (let i = 0; i < name.length; i++) {
        let char = name[i];
        if (replacements[char]) {
            let newName =
                name.slice(0, i) +
                replacements[char] +
                name.slice(i + 1);
            variants.push(newName + "." + ext);
        }
    }

    // Missing character
    if (name.length > 3) {
        variants.push(name.slice(0, -1) + "." + ext);
    }

    // Swap adjacent characters (limit to first few for performance)
    for (let i = 0; i < Math.min(name.length - 1, 5); i++) {
        let arr = name.split('');
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        variants.push(arr.join('') + "." + ext);
    }

    // Prefix / suffix
    variants.push("secure-" + domain);
    variants.push("login-" + domain);
    variants.push(domain + "-secure");
    variants.push(domain + "-login");

    // Hyphen variation
    variants.push(name + "-" + ext);

    // Remove duplicates
    return [...new Set(variants)];
};
=======
export default function generateVariants(domain) {
  if (!domain || !domain.includes(".")) {
    return [];
  }

  const [name, extension] = domain.split(".");
  const variants = new Set();

  // 1. Missing character
  for (let i = 0; i < name.length; i++) {
    let newName = name.slice(0, i) + name.slice(i + 1);
    variants.add(newName + "." + extension);
  }

  // 2. Extra character (repeat same char)
  for (let i = 0; i < name.length; i++) {
    let newName = name.slice(0, i) + name[i] + name.slice(i);
    variants.add(newName + "." + extension);
  }

  // 3. Adjacent swap
  for (let i = 0; i < name.length - 1; i++) {
    let newName = name.slice(0, i) + name[i + 1] + name[i] + name.slice(i + 2);
    variants.add(newName + "." + extension);
  }

  return Array.from(variants).slice(0, 50);
}
>>>>>>> 3ea892863babac3d62b59a65e5bc3eacf2d8cbbb
