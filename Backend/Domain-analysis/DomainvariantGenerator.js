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
