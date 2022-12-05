# POC floor-remover-app-with-opencv-pixellib

The goal of this project is to create a web app where you can upload a photo. this is done via a rest api to a flask app where the photo is manipulated and send back to the web app. There is also an example of an implementation of opencv in react if you prefer manipulating images in javascript. This is for the experimenter's delight.

![example](/example.png "example")

**Note**

If you like to try this on a mac you should substitute `tensorflow` and `tensorflow-gpu` with `tensorflow-macos` and `tensorflow-metal` in requirements.txt located in the flask folder. Also, you have to substitute all imports `tensorflow.python.keras` with `tensorflow.keras` exept for `from tensorflow.python.keras.utils.layer_utils import get_source_inputs` in flask/lib/python3.8/site-packages/pixellib/semantic/deeplab.py.

## Installation Web

cd into web directory and run:

### `yarn && yarn start`

## Installation Flask

cd into flask directory and create a virtual environment with:

### `conda create --prefix ./env python=3.8`

Activate the environment:

### `conda activate ./env`

Install dependencies:

### `python3 -m pip install -r requirements.txt`

If your installation of pyqt5 hangs, go [here](https://stackoverflow.com/questions/73714829/pip-install-pyqt5-it-cannot-go-on/74071222#74071222)

Launch dev server:

### `python3 app.py`

## Tests

To check and see if tensorflow is correctly installed and to check and see the bitrate of your computer you can run the script below inside the flask folder:

### `python3 test.py`

## Download model

You can download the xception model [here](https://github.com/ayoolaolafenwa/PixelLib/releases/download/1.3/deeplabv3_xception65_ade20k.h5). It should have the name `deeplabv3_xception65_ade20k.h5` and belongs in the flask/models folder.

## Inspiration

This project is heavily inspired by this medium post: [https://wt-blog.medium.com/room-flooring-designer-with-ai-technology-282403ec9cd](https://wt-blog.medium.com/room-flooring-designer-with-ai-technology-282403ec9cd)

## Info

[Opencv](https://docs.opencv.org/4.x/index.html)
[Pixellib](https://pixellib.readthedocs.io/en/latest/)

## Todo

- Error checking
- Improve auto rotate algorithm
- Improve scaling of new texture to \*context
- Match horizontal axis of the new texture to \*context
- Get a better result (sharper edges, more precise cutout of the floor) from the segmentation
- Add depth of field to new texture
- Add shadow effects to \*context

\*context = the photo that has been uploaded, preferably a photo of a room with a floor

Made with ❤️
