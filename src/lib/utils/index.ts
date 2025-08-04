export function parseStringToObject(str: string) {
  // First, convert unquoted keys to quoted keys
  let jsonStr = str.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');

  // Then, convert single quotes to double quotes for string values
  jsonStr = jsonStr.replace(/'([^']*)'/g, '"$1"');

  return JSON.parse(jsonStr);
}

export function isEmptyObject(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0 || obj === null;
}
