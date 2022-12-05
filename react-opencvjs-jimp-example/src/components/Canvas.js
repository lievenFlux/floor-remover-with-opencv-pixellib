import React, { useRef, useEffect } from "react";
import { useSelector } from "react-redux";

const Canvas = (props) => {
  const app = useSelector((state) => state.app);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!props.image || !canvasRef.current || !app.cv) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const image = new Image();

    image.src = "data:image/png;base64," + props.image;
    image.onload = () => {
      //context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let mat = app?.cv.imread(image);

      // // black and white
      // let gray = new app.cv.Mat();
      // app.cv.cvtColor(mat, gray, app.cv.COLOR_RGBA2GRAY, 0);
      // app.cv.threshold(
      //   gray,
      //   gray,
      //   0,
      //   255,
      //   app.cv.THRESH_BINARY_INV + app.cv.THRESH_OTSU
      // );

      // // draw line
      // let y_1 = 10;
      // let x_1 = 100;
      // let y_2 = 200;
      // let x_2 = 300;
      // let p1 = new app.cv.Point(x_1, y_1);
      // let p2 = new app.cv.Point(x_2, y_2);
      // app.cv.line(mat, p1, p2, [0, 255, 0, 255], 1);

      app?.cv.imshow("outputCanvas", mat);
    };
  }, [props.image, app?.cv]);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <canvas
        //height={300}
        style={{ backgroundColor: "red" }}
        id="outputCanvas"
        onLoad={() => console.log("loaded canvas")}
        ref={canvasRef}
        {...props}
      />
    </div>
  );
};

export default Canvas;

// remove floor color
// let dst = new app.cv.Mat();
// let low = new app.cv.Mat(
//   src.rows,
//   src.cols,
//   src.type(),
//   [79, 49, 49, 255]
// );
// let high = new app.cv.Mat(
//   src.rows,
//   src.cols,
//   src.type(),
//   [81, 51, 51, 255]
// );
// // You can try more different parameters
// app.cv.inRange(src, low, high, dst);

// loop over every pixel
// for (let i = 0; i < gray.data.byteLength; i++) {
//   if (gray.data[i] === 255 || gray.data[i] === -1) {
//     gray.data[i] = 0;
//     gray.data8S[i] = 0;
//     gray.data16S[i] = 0;
//     gray.data16U[i] = 0;
//     gray.data32F[i] = 0;
//     gray.data32S[i] = 0;
//     gray.data64F[i] = 0;
//   }
// }

// black and white
// let dst = new app.cv.Mat();
// let gray = new app.cv.Mat();
// app.cv.cvtColor(src, gray, app.cv.COLOR_RGBA2GRAY, 0);
// app.cv.threshold(
//   gray,
//   gray,
//   0,
//   255,
//   app.cv.THRESH_BINARY_INV + app.cv.THRESH_OTSU
// );
// end black and white

// let paper = src;
// let points = new app.cv.Mat();
// // // # Coordinates that you want to Perspective Transform
// // let pts1 = new Float32Array([219, 209, 612, 8, 380, 493, 785, 271]);
// // console.log(pts1);
// // //# Size of the Transformed Image
// // let pts2 = new Float32Array([0, 0, 500, 0, 0, 400, 500, 400]);
// // for (let i = 0; i < pts1.length; i += 2) {
// //   const x = pts1[i];
// //   const y = pts1[i + 1];
// //   let circle = new app.cv.Rect(x, y, 10, 10);
// //   //let c = new app.cv.circle(paper, x, y, 5, (0, 255, 0), -1);
// //   app.cv.addWeighted(paper, 0.5, circle, 0.5);
// // }
// // let M = app.cv.getPerspectiveTransform(pts1, pts2);
// // let dst = app.cv.warpPerspective(paper, M, (500, 400));

// // line = [y_1, x_1, y2, x_2]
// let y_1 = 10;
// let x_1 = 100;
// let y_2 = 200;
// let x_2 = 300;
// let p1 = new app.cv.Point(x_1, y_1);
// let p2 = new app.cv.Point(x_2, y_2);
// app.cv.line(points, p1, p2, [0, 255, 0, 255], 1);

// await app.cv.imshow("outputCanvas", points);
