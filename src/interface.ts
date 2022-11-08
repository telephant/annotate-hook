export enum ToolType {
  SEGMENT,
  SEGMENT_ARROWS,
  RECTANGLE,
  ROUND,
  CURVE,
}

export interface UseAnnotateProps {
  width: number,
  height: number,
  initDrawOpts: DrawOptions,
}

export interface UseAnnotateResp {
  toolType: ToolType,
  init: (canvasDom: HTMLCanvasElement) => void;
  destory: () => void;
  clearCanvas: () => void;
  doDraw: (tool: ToolType) => void;
  doEraser: () => void;
  doClear: () => void;
  doFormat: (opts: DrawOptions) => void;
  doExport: (filename?: string) => void;
}

export interface DrawOptions {
  lineWidth: number,
  color: string,
}

export interface IVec {
  x: number;
  y: number;
}

export interface IDrawwedGraphItem {
  toolType: ToolType;
  opts: DrawOptions;
  vec: IVec[];
}

export type AnnotateAction = 'draw' | 'eraser' | 'clear' | 'format';
