const initialState = null;

export default (state = initialState, action) => {
  switch (action.type) {
    case "set-cv":
      return {
        ...state,
        cv: action.payload,
      };

    default:
      return state;
  }
};
