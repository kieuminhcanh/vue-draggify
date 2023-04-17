export type DraggifyDirection = 't' | 'r' | 'b' | 'l' | 'x' | 'y' | 'a';


export interface DraggifyOptions {
  resizeDirection: DraggifyDirection;
  resizeColor: string;
  dragDirection: DraggifyDirection;
}


export interface DraggifySize {
  width: number;
  height: number;
  x: number;
  y: number;
}
