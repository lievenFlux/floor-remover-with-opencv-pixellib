import React, { useRef, useEffect, useState, useCallback } from "react";

import { Point } from "../types";

type Props = {
  onLineUpdate?: (coordinates: Array<Array<number>>) => void;
  dimensions?: {
    width: number;
    height: number;
  };
  style?: React.CSSProperties;
};

const maxPolygonPoints = 4;
const polygonPointSize = 10;

const Canvas = ({ onLineUpdate, style = {}, dimensions }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [polygonPoints, setPolygonPoints] = useState<Array<Point>>([]);
  const [selectedPoint, setSelectedPoint] = useState<number>(-1);

  const canvas: HTMLCanvasElement = canvasRef.current!; // ! force unwrap variable
  const context: CanvasRenderingContext2D = canvas?.getContext("2d")!;

  useEffect(() => {
    if (!onLineUpdate || !dimensions) return;
    onLineUpdate(
      polygonPoints.map((item) => [
        item.x / dimensions.width,
        item.y / dimensions.height,
      ])
    );
  }, [polygonPoints, dimensions, onLineUpdate]);

  const getPosition = useCallback(
    (e: MouseEvent): Point | undefined => {
      if (!canvas) return;
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      return { x, y };
    },
    [canvas]
  );

  const drawPoint = useCallback(
    (
      x: number,
      y: number,
      label: string,
      color: string = "#000",
      size: number = 5
    ) => {
      if (!context) return;
      const radius = 0.5 * size;

      // to increase smoothing for numbers with decimal part
      const pointX = Math.round(x - radius);
      const pointY = Math.round(y - radius);

      context.beginPath();
      context.fillStyle = color;
      context.fillRect(pointX, pointY, size, size);
      context.fill();

      if (label) {
        const textX = Math.round(x);
        const textY = Math.round(pointY - 5);

        context.font = "Italic 14px Arial";
        context.fillStyle = color;
        context.textAlign = "center";
        context.fillText(label, textX, textY);
      }
    },
    [context]
  );

  const drawLines = useCallback(() => {
    if (!context) return;
    context.beginPath();
    context.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    context.strokeStyle = "blue";
    context.lineWidth = 2;
    polygonPoints.forEach((p) => {
      context.lineTo(p.x, p.y);
    });
    context.stroke();
  }, [polygonPoints, context]);

  const draw = useCallback(() => {
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!polygonPoints || polygonPoints.length === 0) return;
    for (const point in polygonPoints) {
      const item = polygonPoints[point];
      drawPoint(item.x, item.y, point);
    }

    drawLines();
  }, [polygonPoints, drawLines, context, canvas, drawPoint]);

  useEffect(() => {
    draw();
  }, [polygonPoints, draw]);

  useEffect(() => {
    if (!dimensions || !canvas) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    draw();
  }, [dimensions, canvas, draw]);

  const getPointAt = useCallback(
    (point: Point): number => {
      let foundPoint = -1;
      for (var i = 0; i < polygonPoints.length; i++) {
        if (
          Math.abs(polygonPoints[i].x - point.x) < polygonPointSize &&
          Math.abs(polygonPoints[i].y - point.y) < polygonPointSize
        ) {
          foundPoint = i;
          break;
        }
      }
      return foundPoint;
    },
    [polygonPoints]
  );

  const mousedown = useCallback(
    (e: MouseEvent) => {
      const result = getPosition(e);
      if (!result) return;
      const { x, y } = result;

      const isSelected = getPointAt({ x, y });
      setSelectedPoint(isSelected);

      if (isSelected !== -1) return;

      // check if allowed to add point
      const isAllowedToAddPoint: boolean =
        polygonPoints.length < maxPolygonPoints;

      if (isAllowedToAddPoint) {
        setPolygonPoints([...polygonPoints, { x, y }]);
      }
    },
    [polygonPoints, getPointAt, getPosition]
  );

  const mouseup = useCallback((e: MouseEvent) => {
    setSelectedPoint(-1);
  }, []);

  const mousemove = useCallback(
    (e: MouseEvent) => {
      if (selectedPoint !== -1) {
        const position = getPosition(e);
        if (!position) return;

        const nextPoints = polygonPoints.map((c, i) => {
          if (i === selectedPoint) {
            return {
              x: position.x,
              y: position.y,
            };
          } else {
            return c;
          }
        });
        setPolygonPoints(nextPoints);
        draw();
      }
    },
    [draw, polygonPoints, selectedPoint, getPosition]
  );

  useEffect(() => {
    if (!canvas) return;
    canvas.addEventListener("mousedown", mousedown);
    canvas.addEventListener("mouseup", mouseup);
    canvas.addEventListener("mousemove", mousemove);
    return () => {
      canvas.removeEventListener("mousedown", mousedown);
      canvas.removeEventListener("mouseup", mouseup);
      canvas.removeEventListener("mousemove", mousemove);
    };
  }, [mousedown, mousemove, mouseup, canvas]);

  return (
    <canvas
      style={{
        ...style,
      }}
      id="outputCanvas"
      onLoad={() => console.log("loaded canvas")}
      ref={canvasRef}
    />
  );
};

export default Canvas;
