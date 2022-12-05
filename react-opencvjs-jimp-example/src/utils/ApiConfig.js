import { baseUrl } from "./Constants";

export const flaskApiConfig = (route) => {
  return baseUrl + "/floorapp/" + route;
};
