export function checkPrivacy(owner) {
  //  if owner not found treat as suspicious
  if (!owner) {
    return true;
  }

  const value = owner.toLowerCase();

  const keywords = ["privacy", "protected", "whoisguard", "redacted"];

  // Check keyword match
  const isProtected = keywords.some((key) => value.includes(key));

  return isProtected;
}
