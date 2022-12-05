import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { OpenCvProvider } from "opencv-react";
import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";
import { Provider, useDispatch } from "react-redux";
import rootReducer from "./reducers/root";
import { setCv } from "./actions/app";

const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(thunk))
);

const Global = () => {
  const dispatch = useDispatch();

  return (
    <OpenCvProvider
      onLoad={(cv) => {
        console.log("opencv loaded");
        dispatch(setCv(cv));
      }}
      //openCvPath="assets/opencv/opencv.js"
    >
      <App cv={undefined} />
    </OpenCvProvider>
  );
};
//const dispatch = useDispatch();
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Global />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
