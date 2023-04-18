import { DraggifyOptions } from "../types";

export const defaultOptions: DraggifyOptions = {
  resize: {
    direction: 'a',
    color: 'rgba(0, 0, 0, 0.5)',
    handle: 'hover',
  },
  drag: {
    direction: 'a',
  },
  grid: {
    stickToGrid: false,
    x: 10,
    y: 10,
  },
}
