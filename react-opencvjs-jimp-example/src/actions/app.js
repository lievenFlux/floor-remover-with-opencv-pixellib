//import axios from "axios";
//import { AnyAction } from "redux";
//import { wpEndpoint } from "constants/index";
//import { RootState } from "reducers/root";
//import { ThunkAction } from "redux-thunk";
//import { UserData } from "types";
//import { SetCvAction } from "reducers/app";

export const setCv = (cv) => {
  return async (dispatch, getState) => {
    const state = getState();
    //const app = state.app;

    dispatch({
      type: "set-cv",
      payload: cv,
    });
  };
};
