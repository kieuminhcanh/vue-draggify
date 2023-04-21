import { exportDefaultDeclaration } from '@babel/types';

export type DraggifyDirection = 't' | 'r' | 'b' | 'l' | 'x' | 'y' | 'a';

export * from '../components/Draggify.vue';

export interface DraggifyProps {
  modelValue: DraggifyInput;
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
export interface DraggifyAxis {
  x: number;
  y: number;
}
export interface DraggifyPosition {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface DraggifyInput {
  width: number;
  height: number;
  x?: number;
  y?: number;
};

export interface DraggifyState extends DraggifyInput, DraggifyPosition {
  isDragging?: boolean;
  isResizing?: boolean;
}
