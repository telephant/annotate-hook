import {
  IVec,
  DrawOptions,
} from './interface';

export const drawBezierCurve = (canvasCtx: CanvasRenderingContext2D, vec: IVec[], opts: DrawOptions) => {
  if (!canvasCtx) {
    return;
  }
  if (vec.length === 0) {
    return;
  }
  const { lineWidth, color } = opts;

  canvasCtx.save();
  canvasCtx.beginPath();

  if (vec.length < 5) {
    // number of points lt 5, use lineTo().
    canvasCtx.moveTo(vec[0].x, vec[0].y);

    for (let i = 1; i < vec.length; i++) {
      canvasCtx.lineTo(vec[i].x, vec[i].y);
    }
  } else {
    // number of points mte 5, use bezierCurveTo().
    let base = 0;
    canvasCtx.moveTo(vec[base].x, vec[base].y);
    for (let i = 4; i < vec.length; i += 3, base += 3) {
      const end = {
        x: (vec[base + 4].x + vec[base + 2].x) / 2,
        y: (vec[base + 4].y + vec[base + 2].y) / 2,
      };
      canvasCtx.bezierCurveTo(
        vec[base + 1].x,
        vec[base + 1].y,
        vec[base + 2].x,
        vec[base + 2].y,
        end.x,
        end.y,
      );
    }
  }

  const remain = vec.length % 3;
  if (remain) {
    // use lineTo().
    const startIndex = Math.floor(vec.length / 3) * 3;
    for (let i = startIndex; i < vec.length; i++) {
      canvasCtx.lineTo(vec[i].x, vec[i].y);
    }
  }

  canvasCtx.lineWidth = lineWidth;
  canvasCtx.strokeStyle = color;
  // canvasCtx.current.lineWidth = processLineWidth(2, width);
  // canvasCtx.current.strokeStyle = `#${data.color}`;
  canvasCtx.stroke();
  canvasCtx.restore();
};

export const drawLine = (
  canvasCtx: CanvasRenderingContext2D,
  [start, end]: IVec[],
  opts: DrawOptions,
) => {
  if (!start) {
    return;
  }
  const { x: startX, y: startY } = start;
  const { x: endX, y: endY } = end;
  const { lineWidth, color } = opts;

  // const lineWidth = processLineWidth(data.size, width);
  if (startX === endX && startY === endY) {
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.arc(startX, startY, lineWidth / 2, 0, 360, false);
    canvasCtx.strokeStyle = color;
    canvasCtx.fill();
    canvasCtx.restore();
  } else {
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(startX, startY);
    canvasCtx.lineTo(endX, endY);
    canvasCtx.lineWidth = lineWidth;
    canvasCtx.strokeStyle = color;
    canvasCtx.stroke();
    canvasCtx.restore();
  }
};

export const drawRectangle = (canvasCtx: CanvasRenderingContext2D, vec: IVec[], opts: DrawOptions) => {
  if (vec.length !== 2) {
    return;
  }
  const { lineWidth, color } = opts;
  const {
    x: x1,
    y: y1,
  } = vec[0];
  const {
    x: x2,
    y: y2,
  } = vec[1];

  const rectWidth = Math.abs(x1 - x2);
  const rectHeight = Math.abs(y1 - y2);
  canvasCtx.lineWidth = lineWidth;
  canvasCtx.strokeStyle = color;

  const startX = x1 < x2 ? x1 : x2;
  const startY = y1 < y2 ? y1 : y2;
  canvasCtx.strokeRect(startX, startY, rectWidth, rectHeight);
};

export const drawEllipse = (canvasCtx: CanvasRenderingContext2D, vec: IVec[], opts: DrawOptions) => {
  if (vec.length !== 2) {
    return;
  }
  const { x: x1, y: y1 } = vec[0];
  const { x: x2, y: y2 } = vec[1];
  const { lineWidth, color } = opts;

  const xDis = Math.abs(x1 - x2);
  const yDis = Math.abs(y1 - y2);
  const longRadius = xDis > yDis ? xDis / 2 : yDis / 2;
  const shortRadius = xDis < yDis ? xDis / 2 : yDis / 2;

  const centerX = Math.abs(x1 + x2) / 2;
  const centerY = Math.abs(y1 + y2) / 2;

  canvasCtx.beginPath();
  canvasCtx.lineWidth = lineWidth;
  canvasCtx.strokeStyle = color;
  const angel = Math.atan2(xDis, yDis) > 1 ? 0 : 90 * Math.PI / 180;

  canvasCtx.ellipse(
    centerX,
    centerY,
    longRadius,
    shortRadius,
    angel,
    0,
    2 * Math.PI,
  );
  canvasCtx.stroke();
};