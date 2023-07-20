import { DraggifyOptions } from "../types";

export const defaultOptions = {
  style: {
    disabled: false,
    marginY: 0,
  },
  resize: {
    disabled: false,
    direction: 'all',
    color: 'rgba(0, 0, 0, 0.5)',
    handle: 'hover',
    minWidth: 50,
    minHeight: 50,
  },
  drag: {
    direction: 'all',
  },
  grid: {
    stickToGrid: true,
    x: 10,
    y: 10,
  },
}
