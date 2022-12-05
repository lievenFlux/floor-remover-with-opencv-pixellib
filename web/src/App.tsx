import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getImageBase64Data } from "./utils";

import Canvas from "./components/Canvas";

import "./App.css";

const maxWidth = 700;

function App() {
  const [image, setImage] = useState<string>("");
  const [canvasImage, setCanvasImage] = useState<string>("");
  const [coordinates, setOnLineUpdate] = useState<Array<Array<number>> | null>(
    null
  );
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 152 });

  const send = useCallback(async () => {
    console.log("send", coordinates);

    if (image === "") return;
    try {
      const res = await axios.post("http://127.0.0.1:5000/upload", {
        img: image,
        file_name: "file_name",
        coordinates,
      });

      if (res.data.error) {
        return alert(res.data.error);
      }
      if (!res.data.image) {
        return false;
      }

      // show the result
      setCanvasImage(res.data.image);
    } catch (err) {
      console.log((err as Error).message);
    }
  }, [image, coordinates]);

  const checkKey = useCallback(
    (e: KeyboardEvent) => {
      e = e || window.event;
      if (e.key === "Enter") {
        send();
      } else if (e.key === "ArrowUp") {
        //onDraw();
      } else if (e.key === "ArrowDown") {
        //
      } else if (e.key === "ArrowLeft") {
        //
      } else if (e.key === "ArrowRight") {
        //onDraw();
      }
    },
    [send]
  );

  useEffect(() => {
    document.addEventListener("keydown", checkKey);

    return () => {
      document.removeEventListener("keydown", checkKey);
    };
  }, [checkKey]);

  const onImageLoaded = (e: any) => {
    console.log("loaded", e.target.width);
    let width = e.target.naturalWidth;
    let height = e.target.naturalHeight;
    if (width >= maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }
    setDimensions({ width, height });
  };

  useEffect(() => {
    let img: HTMLImageElement | null =
      document.querySelector("#backgroundImage");

    img?.addEventListener("load", onImageLoaded);
    return () => {
      img?.removeEventListener("load", onImageLoaded);
    };
  }, []);

  return (
    <div className="App">
      <h1>floor app</h1>

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          height: dimensions?.height + "px",
          width: "100%",
        }}
      >
        <Canvas
          onLineUpdate={setOnLineUpdate}
          style={{
            position: "absolute",
            zIndex: 1,
          }}
          dimensions={dimensions}
        />

        <img id="backgroundImage" src={canvasImage} alt="" />
      </div>

      <div>
        <div>
          imageSrc{" "}
          <input
            type="file"
            id="fileInput"
            name="file"
            onChange={(e) => {
              if (e.target.files![0]) {
                getImageBase64Data(e.target.files![0], setImage);
                setCanvasImage(URL.createObjectURL(e.target.files![0]));
              }
            }}
          />
        </div>
        <div style={{ margin: "30px" }}>
          <button
            onClick={() => {
              send();
            }}
          >
            send
          </button>
          <p>
            click and drag points on canvas to provide a manual transform curve.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
