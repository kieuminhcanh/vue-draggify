export const inRange = (input: number, min: number = 0, max: number = 0, compare: "[]" | "[)" | "(]" | "()" = "[]") => {
  switch (compare) {
    case "[]":
      return input >= min && input <= max
    case "[)":
      return input >= min && input < max
    case "(]":
      return input > min && input <= max
    case "()":
      return input > min && input < max
    default:
      return false
  }
}

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


export const getState = ({ ...args }: any) => {
  const { width, height, x, y } = args;
  return { width, height, x, y, top: y, right: x + width, bottom: y + height, left: x };
}
