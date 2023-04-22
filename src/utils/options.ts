import { DraggifyOptions } from "../types";

export const defaultOptions: DraggifyOptions = {
  style: {
    disabled: false,
    marginY: 0,
  },
  resize: {
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
    stickToGrid: false,
    x: 10,
    y: 10,
  },
}
