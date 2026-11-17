// Makes user text safe to use inside a RegExp: "b.*" searches for the literal characters b, ., *.
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
