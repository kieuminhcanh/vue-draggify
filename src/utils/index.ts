export const inRange = (input: number, min: number = 0, max: number = 0) => input >= min && input <= max

export function mergeObjects(objA: any, objB: any) {
  const merged = { ...objA };

  for (const [key, value] of Object.entries(objB)) {
    if (!merged.hasOwnProperty(key)) {
      merged[key] = value;
    } else if (Array.isArray(value)) {
      // if value is an array, replace the existing array with the new one
      merged[key] = value;
    } else if (typeof value === "object" && !Array.isArray(value)) {
      merged[key] = mergeObjects(merged[key], value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}
