import { useState, useEffect } from "react";
import Jimp from "jimp/es";
//import { JimpDemo } from "./components/JimpDemo";
import { useOpenCv } from "opencv-react";
import Canvas from "./components/Canvas";
import { useSelector } from "react-redux";
import { flaskApiConfig } from "./utils/ApiConfig";
import axios from "axios";

import "./App.css";

function App() {
  const app = useSelector((state) => state.app);
  const { loaded } = useOpenCv();

  const [transformedImage, setTransformedImage] = useState(undefined);
  const [jimpImageForOpenCv, setJimpImageForOpenCv] = useState(undefined);

  useEffect(() => {
    const fn = async () => {
      if (!app?.cv || !transformedImage) {
        return;
      }
      const { cv } = app;
      try {
        // // load local image file with jimp. It supports jpg, png, bmp, tiff and gif:
        const jimpSrc = await Jimp.read(transformedImage);
        // `jimpImage.bitmap` property has the decoded ImageData that we can use to create a cv:Mat
        var src = cv.matFromImageData(jimpSrc.bitmap);
        // following lines is copy&paste of opencv.js dilate tutorial:
        let dst = new cv.Mat();
        let M = cv.Mat.ones(5, 5, cv.CV_8U);
        let anchor = new cv.Point(-1, -1);

        cv.dilate(
          src,
          dst,
          M,
          anchor,
          1,
          cv.BORDER_CONSTANT,
          cv.morphologyDefaultBorderValue()
        );
        // Now that we are finish, we want to write `dst` to file `output.png`. For this we create a `Jimp`
        // image which accepts the image data as a [`Buffer`](https://nodejs.org/docs/latest-v10.x/api/buffer.html).
        // `write('output.png')` will write it to disk and Jimp infers the output format from given file name:
        const jimpOut = new Jimp({
          width: dst.cols,
          height: dst.rows,
          data: Buffer.from(dst.data),
        });

        const transformedJimpImage = await jimpOut.getBase64Async(
          Jimp.MIME_JPEG
        );

        const res = await axios.post("http://127.0.0.1:5000/upload", {
          img: transformedJimpImage,
          file_name: "file_name",
        });

        if (res.data.image) {
          // show the result
          setJimpImageForOpenCv(res.data.image);
          // save the rotation data
          // apply to new floor
        }
      } catch (err) {
        console.log(err.message);
      }
    };
    fn();
  }, [loaded, app, transformedImage]);

  return (
    <div className="App">
      <p>OpenCv React test: {window.cv ? "loaded." : "loading..."}</p>
      <Canvas image={jimpImageForOpenCv} />
      {jimpImageForOpenCv && (
        <button
          style={{ margin: "20px 0" }}
          onClick={() => {
            var canvas = document.getElementById("outputCanvas");
            var img = canvas.toDataURL("image/png");
            //document.write('<img src="' + img + '"/>');
            window.open(
              img,
              "Image",
              "width=canvas.width,height=canvas.height,resizable=1"
            );
          }}
        >
          download
        </button>
      )}
      <div className="inputoutput">
        {transformedImage && (
          <img
            id="imageSrc"
            alt=""
            src={transformedImage}
            style={{ maxWidth: 300 }}
            onLoad={() => {
              console.log("loaded image");
            }}
          />
        )}
        <div className="caption">
          imageSrc{" "}
          <input
            type="file"
            id="fileInput"
            name="file"
            onChange={(e) => {
              console.log(URL.createObjectURL(e.target.files[0]));
              setTransformedImage(URL.createObjectURL(e.target.files[0]));
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
