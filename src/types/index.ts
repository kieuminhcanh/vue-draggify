import { exportDefaultDeclaration } from '@babel/types';
import { Ref } from 'vue';

export type DraggifyDirection = 'top' | 'right' | 'bottom' | 'left' | 'x' | 'y' | 'all';

export * from '../components/Draggify.vue';

export interface DraggifyProps {
  modelValue: DraggifyInput;
  color: String;
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
  container: DraggifySize;
  style: DraggifyStyleOptions;
  grid: DraggifyGridOptions;
  resize: DraggifyResizeOptions
  drag: DraggifyDragOptions

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
  minWidth: number;
  minHeight: number;
}
export interface DraggifyDragOptions {
  disabled?: boolean;
  direction?: DraggifyDirection;
}

export interface DraggifySize {
  width: number;
  height: number;
  nWidth?: number;
  nHeight?: number;
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
  width: number;
  height: number;
  x: number;
  y: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}
