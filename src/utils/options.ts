import { DraggifyOptions } from "../types";

export const defaultOptions: DraggifyOptions = {
  style: {
    disabled: false,
    marginY: 0,
  },
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
