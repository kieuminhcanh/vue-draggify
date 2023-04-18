export type DraggifyDirection = 't' | 'r' | 'b' | 'l' | 'x' | 'y' | 'a';

export * from '../components/Draggify.vue';

export interface DraggifyProps {
  size: DraggifySize;
  position: DraggifyPosition;
  options?: DraggifyOptions;
  onDragMove?: (size: DraggifySize) => void;
  onDragEnd?: (size: DraggifySize) => void;
  onResizeMove?: (size: DraggifySize) => void;
  onResizeEnd?: (size: DraggifySize) => void;
}

export interface DraggifyGridOptions {
  stickToGrid?: boolean;
  x: number;
  y: number;
}

export interface DraggifyOptions {
  style?: DraggifyStyleOptions;
  container?: DraggifySize;
  grid?: DraggifyGridOptions;
  resize?: DraggifyResizeOptions
  drag?: DraggifyDragOptions

}

export interface DraggifyStyleOptions {
  disabled: boolean;
  marginY: number;
}
export interface DraggifyResizeOptions {
  disabled?: boolean;
  direction: DraggifyDirection;
  color?: string;
  handle?: 'click' | 'hover';
}
export interface DraggifyDragOptions {
  disabled?: boolean;
  direction?: DraggifyDirection;
}

export interface DraggifySize {
  width: number;
  height: number;
}
export interface DraggifyPosition {
  x: number;
  y: number;
}

export interface DraggifyState {
  width: number;
  height: number;
  x: number;
  y: number;
  isDragging?: boolean;
  isResizing?: boolean;
}
