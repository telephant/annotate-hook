import {
  IVec,
} from './interface';
import {
  MOVE_TOLERANCE,
} from './constant';

export const isOnThirdBezierCurve = (vec: IVec[], targetVec: IVec) => {
  if (vec.length === 0) {
    return false;
  }

  if (vec.length === 1) {
    if (canToleranceVec(vec[0], targetVec)) {
      return true;
    }
    return false;
  }

  if (vec.length < 4) {
    for (let i = 0; i + 1 < vec.length; i++) {
      if (isOnLine([vec[i], vec[i + 1]], targetVec)) {
        return true;
      }
    }

    return false;
  }

  let base = 0;
  for (let i = 4; i < vec.length; i += 3, base += 3) {
    const p1 = vec[base];
    const p2 = vec[base + 1];
    const p3 = vec[base + 2];
    const p4 = {
      x: (vec[base + 4].x + vec[base + 2].x) / 2,
      y: (vec[base + 4].y + vec[base + 2].y) / 2,
    };

    for (let t = 0; t <= 1; t += 0.05) {
      const x = (
        ((1 - t) ** 3 * p1.x)
        + (3 * ((1 - t) ** 2) * t * p2.x)
        + (3 * (1 - t) * (t ** 2) * p3.x)
        + (t ** 3 * p4.x)
      );
      const y = (
        ((1 - t) ** 3 * p1.y)
        + (3 * ((1 - t) ** 2) * t * p2.y)
        + (3 * (1 - t) * (t ** 2) * p3.y)
        + (t ** 3 * p4.y)
      );

      if (canToleranceVec({ x, y }, targetVec, 4)) {
        return true;
      }
    }
  }
  return false;
};

export const isOnLine = (vec: IVec[], targetVec: IVec) => {
  if (vec.length < 2) {
    return false;
  }

  const x1 = vec[0].x;
  const x2 = vec[1].x;
  const y1 = vec[0].y;
  const y2 = vec[1].y;

  const k = (y1 - y2) / (x1 - x2);
  const b = y1 - (k * x1);

  const nowX = (targetVec.y - b) / k;
  const nowY = k * targetVec.x + b;

  if (
    canToleranceVec({ x: nowX, y: targetVec.y }, targetVec)
    || canToleranceVec({ x: targetVec.x, y: nowY }, targetVec)
  ) {
    return true;
  }

  return false;
};

export const isOnRectangle = (vec: IVec[], targetVec: IVec) => {
  if (vec.length < 2) {
    return false;
  }

  const x1 = vec[0].x;
  const x2 = vec[1].x;
  const y1 = vec[0].y;
  const y2 = vec[1].y;

  // check horizon lines.
  if (canTolerance(y1, targetVec.y) || canTolerance(y2, targetVec.y)) {
    if (isInRange(x1, x2, targetVec.x)) {
      return true;
    }
  }

  // check vertical lines.
  if (canTolerance(x1, targetVec.x) || canTolerance(x2, targetVec.x)) {
    if (isInRange(y1, y2, targetVec.y)) {
      return true;
    }
  }

  return false;
};

export const isOnEllipse = (vec: IVec[], targetVec: IVec) => {
  if (vec.length < 2) {
    return false;
  }

  const x1 = vec[0].x;
  const x2 = vec[1].x;
  const y1 = vec[0].y;
  const y2 = vec[1].y;

  const center = {
    x: Math.abs(x1 + x2) / 2,
    y: Math.abs(y1 + y2) / 2,
  };

  if (distanceBetween(center, targetVec) <= MOVE_TOLERANCE) {
    return true;
  }

  return false;
};

export const isInRange = (n1: number, n2: number, p: number) => {
  if (n1 < n2) {
    return (p >= n1) && (p <= n2);
  }

  return (p >= n2) && (p <= n1);
};

export const canToleranceVec = (lastVec: IVec, current: IVec, tolerance: number = MOVE_TOLERANCE) => {
  const offsetX = Math.abs(lastVec.x - current.x);
  const offsetY = Math.abs(lastVec.y - current.y);
  if (offsetX < tolerance && offsetY < tolerance) {
    return true;
  }
  return false;
};

export const canTolerance = (p1: number, p2: number, tolerance: number = MOVE_TOLERANCE) => {
  const offset = Math.abs(p1 - p2);
  if (offset < tolerance) {
    return true;
  }
  return false;
};

export const distanceBetween = (vec1: IVec, vec2: IVec) => (
  Math.sqrt((vec2.x - vec1.x) ** 2 + (vec2.y - vec1.y) ** 2)
);
