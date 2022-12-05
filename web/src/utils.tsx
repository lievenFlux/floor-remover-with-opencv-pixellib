// image to base64
const getImageBase64Data = (
  file: File,
  cb: React.Dispatch<React.SetStateAction<string>>
) => {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    if (typeof reader.result === "string") {
      cb(reader.result);
    }
  };
  reader.onerror = function (error) {
    console.log("Error: ", error);
  };
};

// audio to base64
const getAudioBase64Data = (
  audioFile: File,
  callback: React.Dispatch<React.SetStateAction<string>>
) => {
  var reader = new FileReader();
  reader.readAsDataURL(audioFile);
  reader.onload = function (event) {
    if (typeof reader.result === "string") {
      var data = reader.result.split(",");
      var decodedImageData = window.btoa(data[1]); // the actual conversion of data from binary to base64 format
      callback(decodedImageData);
    }
  };
};

export { getImageBase64Data, getAudioBase64Data };
