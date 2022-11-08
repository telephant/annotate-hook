import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  IVec,
  ToolType,
  DrawOptions,
  AnnotateAction,
  UseAnnotateProps,
  IDrawwedGraphItem,
} from './interface';
import {
  drawLine,
  drawEllipse,
  drawRectangle,
  drawBezierCurve,
} from './draw';
import {
  isOnLine,
  isOnEllipse,
  isOnRectangle,
  isOnThirdBezierCurve,
  canToleranceVec,
} from './check';
// import { exportFile } from 'utils';

export const useAnnotate = (props: UseAnnotateProps) => {
  const {
    width,
    height,
    initDrawOpts,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>();
  const canvasCtx = useRef<CanvasRenderingContext2D | null>(null);

  /* ------------------------------- action ref ------------------------------- */
  const isDrawingRef = useRef<boolean>(false);
  const isErasingRef = useRef<boolean>(false);
  const lastActionRef = useRef<AnnotateAction>();
  const formatOptsRef = useRef<DrawOptions>(initDrawOpts);

  const reqAFIdRef = useRef<number | null>(null);

  const currentVecRef = useRef<IVec[]>([]);
  const eraseVecRef = useRef<IVec[]>([]);

  const drawwedGraphsRef = useRef<IDrawwedGraphItem[]>([]);
  const toolTypeRef = useRef<ToolType>(ToolType.CURVE);
  const [toolType, setToolType] = useState<ToolType>(ToolType.CURVE);
  const [action, setAction] = useState<AnnotateAction>('draw');

  useEffect(() => {
    startDraw(action);
  }, [action]);

  useEffect(() => {
    if (!canvasCtx.current) {
      return;
    }

    if (currentVecRef.current.length > 0) {
      drawwedGraphsRef.current.push({
        toolType: toolTypeRef.current,
        vec: currentVecRef.current,
        opts: formatOptsRef.current,
      });
      currentVecRef.current = [];
    }
    toolTypeRef.current = toolType;
  }, [toolType]);

  const init = (canvasDom: HTMLCanvasElement) => {
    canvasRef.current = canvasDom;
    canvasCtx.current = canvasDom.getContext('2d');

    if (canvasCtx.current) {
      canvasCtx.current.fillStyle = 'white';
      canvasCtx.current.fillRect(0, 0, width, height);
      canvasCtx.current.translate(0, 0);
    }
    startDraw(action);
  };

  const startDraw = (nowAction: AnnotateAction) => {
    switch (nowAction) {
      case 'draw':
        if (lastActionRef.current === 'eraser') {
          removeOnEraser();
          eraseVecRef.current = [];
        }
        listenOnDraw();
        break;
      case 'eraser':
        if (lastActionRef.current === 'draw') {
          removeOnDraw();
          if (currentVecRef.current.length > 0) {
            drawwedGraphsRef.current.push({
              toolType,
              vec: currentVecRef.current,
              opts: formatOptsRef.current,
            });
            currentVecRef.current = [];
          }
        }
        listenOnEraser();
        break;
      case 'clear':
        clearCanvasWithData();
        break;
    }

    // remember the last action.
    lastActionRef.current = action;
  };

  const destory = () => {
    removeOnDraw();
  };

  const doDraw = (tool: ToolType) => {
    setAction('draw');
    setToolType(tool);
  };

  const doEraser = () => {
    setAction('eraser');
    isDrawingRef.current = false;
    isErasingRef.current = true;
  };

  const doClear = () => {
    setAction('clear');
  };

  const doFormat = (opts: DrawOptions) => {
    formatOptsRef.current = opts;
    setAction('format');
  };

  const doExport = (filename?: string) => {
    if (!canvasRef.current) {
      return;
    }

    canvasRef.current.toBlob((blobData) => {
      if (!blobData) {
        return;
      }
      const fName = filename ?? `annotate_${(new Date()).getTime()}`;
      // exportFile(blobData, fName);
    });
  };

  const requestDraw = () => {
    reqAFIdRef.current = requestAnimationFrame(() => {
      draw();
      requestDraw();
    });
  };

  const draw = () => {
    if (!canvasCtx.current) {
      return;
    }

    clearCanvas();

    // drawwed graphs filter with eraser points.
    filterDrawwedGraphsWithEraser();

    drawwedGraphsRef.current.forEach((item) => {
      if (!canvasCtx.current) {
        return;
      }
      drawByType(item.toolType, item.vec, item.opts);
    });

    // draw current.
    if (currentVecRef.current.length > 0) {
      drawByType(toolTypeRef.current, currentVecRef.current, formatOptsRef.current);
    }
  };

  const cancelDraw = () => {
    reqAFIdRef.current && cancelAnimationFrame(reqAFIdRef.current);
    reqAFIdRef.current = null;
  };

  const drawByType = (tool: ToolType, drawVec: IVec[], opts: DrawOptions) => {
    if (!canvasCtx.current) {
      return;
    }

    switch (tool) {
      case ToolType.RECTANGLE:
        drawRectangle(canvasCtx.current, drawVec, opts);
        break;
      case ToolType.ROUND:
        drawEllipse(canvasCtx.current, drawVec, opts);
        break;
      case ToolType.CURVE:
        drawBezierCurve(canvasCtx.current, drawVec, opts);
        break;
      case ToolType.SEGMENT:
      default:
        drawLine(canvasCtx.current, drawVec, opts);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                               ACTION => DRAW                               */
  /* -------------------------------------------------------------------------- */
  const listenOnDraw = () => {
    if (!canvasRef.current) {
      return;
    }
    canvasRef.current.addEventListener('mousedown', onDrawMouseDown);
  };

  const removeOnDraw = () => {
    if (!canvasRef.current) {
      return;
    }
    canvasRef.current.removeEventListener('mousemove', onDrawMouseMove);
    canvasRef.current.removeEventListener('mousedown', onDrawMouseDown);
    canvasRef.current.removeEventListener('mouseup', onDrawMouseUp);
  };

  const onDrawMouseDown = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }
    isErasingRef.current = false;
    isDrawingRef.current = true;
    canvasRef.current.addEventListener('mousemove', onDrawMouseMove);
    canvasRef.current.addEventListener('mouseup', onDrawMouseUp);
    requestDraw();
  }, []);

  const onDrawMouseUp = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }
    isDrawingRef.current = false;
    cancelDraw();

    drawwedGraphsRef.current.push({
      toolType: toolTypeRef.current,
      vec: currentVecRef.current,
      opts: formatOptsRef.current,
    });
    currentVecRef.current = [];
    canvasRef.current.removeEventListener('mousemove', onDrawMouseMove);
    canvasRef.current.removeEventListener('mouseup', onDrawMouseUp);
  }, []);

  const onDrawMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) {
      return;
    }

    const current = { x: e.offsetX, y: e.offsetY };

    switch (toolTypeRef.current) {
      case ToolType.RECTANGLE:
        if (currentVecRef.current.length === 0) {
          currentVecRef.current.push(current);
          currentVecRef.current.push(current);
          break;
        }
        currentVecRef.current[1] = current;
        break;
      case ToolType.ROUND:
        if (currentVecRef.current.length === 0) {
          currentVecRef.current.push(current);
          currentVecRef.current.push(current);
          break;
        }
        currentVecRef.current[1] = current;
        break;
      case ToolType.CURVE:
        if (currentVecRef.current.length > 0) {
          const lastVec = currentVecRef.current[currentVecRef.current.length - 1];
          if (canToleranceVec(lastVec, current)) {
            return;
          }
        }
        currentVecRef.current.push({ x: e.offsetX, y: e.offsetY });
        break;
      case ToolType.SEGMENT:
      default:
        if (currentVecRef.current.length === 0) {
          currentVecRef.current.push(current);
          currentVecRef.current.push(current);
          break;
        }
        currentVecRef.current[1] = current;
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              ACTION => ERASER                              */
  /* -------------------------------------------------------------------------- */
  const listenOnEraser = () => {
    if (!canvasRef.current) {
      return;
    }
    canvasRef.current.addEventListener('mousedown', onEraserMouseDown);
  };

  const removeOnEraser = () => {
    if (!canvasRef.current) {
      return;
    }
    canvasRef.current.removeEventListener('mousemove', onEraserMouseMove);
    canvasRef.current.removeEventListener('mousedown', onEraserMouseDown);
    canvasRef.current.removeEventListener('mouseup', onEraserMouseUp);
  };

  const onEraserMouseDown = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) {
      return;
    }
    isErasingRef.current = true;
    canvasRef.current.addEventListener('mousemove', onEraserMouseMove);
    canvasRef.current.addEventListener('mouseup', onEraserMouseUp);

    const current = { x: e.offsetX, y: e.offsetY };
    eraseVecRef.current[0] = current;

    requestDraw();
  }, []);

  const onEraserMouseMove = useCallback((e: MouseEvent) => {
    if (!isErasingRef.current) {
      return;
    }

    const current = { x: e.offsetX, y: e.offsetY };

    eraseVecRef.current[0] = current;
  }, []);

  const onEraserMouseUp = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }

    cancelDraw();
    canvasRef.current.removeEventListener('mousemove', onEraserMouseMove);
    canvasRef.current.removeEventListener('mouseup', onEraserMouseUp);
    isErasingRef.current = false;
    eraseVecRef.current = [];
  }, []);

  const filterDrawwedGraphsWithEraser = () => {
    if (eraseVecRef.current.length === 0) {
      return;
    }

    let needErase = false;

    drawwedGraphsRef.current = drawwedGraphsRef.current.filter((drawwedItem) => {
      switch (drawwedItem.toolType) {
        case ToolType.CURVE:
          needErase = isOnThirdBezierCurve(drawwedItem.vec, eraseVecRef.current[0]);
          if (needErase) {
            return false;
          }
          break;
        case ToolType.SEGMENT:
          needErase = isOnLine(drawwedItem.vec, eraseVecRef.current[0]);
          if (needErase) {
            return false;
          }
          break;
        case ToolType.RECTANGLE:
          needErase = isOnRectangle(drawwedItem.vec, eraseVecRef.current[0]);
          if (needErase) {
            return false;
          }
          break;
        case ToolType.ROUND:
          needErase = isOnEllipse(drawwedItem.vec, eraseVecRef.current[0]);
          if (needErase) {
            return false;
          }
          break;
      }
      return true;
    });

    eraseVecRef.current = [];
  };

  const processLineWidth = useCallback((originLineWidth: number | string, conWidth: number) => {
    const lineWeight = typeof originLineWidth === 'string' ? Number(originLineWidth) : originLineWidth;
    if (!canvasRef.current) {
      return lineWeight;
    }

    const newLineWeight = Math.round((canvasRef.current.clientWidth / conWidth) * lineWeight);
    return newLineWeight;
  }, [width]);

  const clearCanvasWithData = () => {
    if (!canvasCtx.current) {
      return;
    }

    currentVecRef.current = [];
    drawwedGraphsRef.current = [];
    clearCanvas();
  };

  const clearCanvas = () => {
    if (!canvasCtx.current) {
      return;
    }
    canvasCtx.current.clearRect(0, 0, width, height);
    canvasCtx.current.fillStyle = 'white';
    canvasCtx.current.fillRect(0, 0, width, height);
  };

  return {
    init,
    destory,
    clearCanvas,
    toolType,
    doDraw,
    doEraser,
    doClear,
    doFormat,
    doExport,
  };
};
