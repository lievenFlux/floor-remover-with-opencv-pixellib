from flask import Flask, request, render_template
from flask_restful import Resource, Api
from flask_cors import CORS

import os
import base64
import pixellib
import cv2
import numpy as np

import imutils 
from imutils import contours 

from pixellib.semantic import semantic_segmentation
from pixellib.torchbackend.instance import instanceSegmentation

os.environ['TF_XLA_FLAGS'] = '--tf_xla_enable_xla_devices'

app = Flask(__name__)
api = Api(app)
CORS(app)

# @app.route('/')
# def index():
#   #return render_template('index.html')
#   return

def extend_line(p1, p2, distance=10000):
  diff = np.arctan2(p1[1] - p2[1], p1[0] - p2[0])
  p3_x = int(p1[0] + distance*np.cos(diff))
  p3_y = int(p1[1] + distance*np.sin(diff))
  p4_x = int(p1[0] - distance*np.cos(diff))
  p4_y = int(p1[1] - distance*np.sin(diff))
  return ((p3_x, p3_y), (p4_x, p4_y))

def subimage(image, center, theta, width, height):
  ''' 
  Rotates OpenCV image around center with angle theta (in deg)
  then crops the image according to width and height.
  '''
  # Uncomment for theta in radians
  theta *= 180/np.pi

  shape = ( image.shape[1], image.shape[0] ) # cv2.warpAffine expects shape in (length, height)

  matrix = cv2.getRotationMatrix2D( center=center, angle=theta, scale=1 )
  image = cv2.warpAffine( src=image, M=matrix, dsize=shape )

  x = int( center[0] - width/2  )
  y = int( center[1] - height/2 )

  image = image[ y:y+height, x:x+width ]

  return image

# Automatic brightness and contrast optimization with optional histogram clipping
def automatic_brightness_and_contrast(image, clip_hist_percent=1):
  
  gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
  
  # Calculate grayscale histogram
  hist = cv2.calcHist([gray],[0],None,[256],[0,256])
  hist_size = len(hist)
  
  # Calculate cumulative distribution from the histogram
  accumulator = []
  accumulator.append(float(hist[0]))
  for index in range(1, hist_size):
      accumulator.append(accumulator[index -1] + float(hist[index]))
  
  # Locate points to clip
  maximum = accumulator[-1]
  clip_hist_percent *= (maximum/100.0)
  clip_hist_percent /= 2.0
  
  # Locate left cut
  minimum_gray = 0
  while accumulator[minimum_gray] < clip_hist_percent:
      minimum_gray += 1
  
  # Locate right cut
  maximum_gray = hist_size -1
  while accumulator[maximum_gray] >= (maximum - clip_hist_percent):
      maximum_gray -= 1
  
  # Calculate alpha and beta values
  alpha = 255 / (maximum_gray - minimum_gray)
  beta = -minimum_gray * alpha
  
  '''
  # Calculate new histogram with desired range and show histogram 
  new_hist = cv2.calcHist([gray],[0],None,[256],[minimum_gray,maximum_gray])
  plt.plot(hist)
  plt.plot(new_hist)
  plt.xlim([0,256])
  plt.show()
  '''

  auto_result = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
  return (auto_result, alpha, beta)

class Upload(Resource):
  def post(self):
    ### save incoming base64 to uploads folder 

    json_data = request.get_json(force=True)
    encoded_data = json_data['img'].split(',')[1]
    file_name = json_data['file_name']
    coordinates = json_data['coordinates']
    print("coordinates", coordinates)
    file_path_uploads = "assets/uploads/"
    with open(file_path_uploads + file_name + ".png", "wb") as fh:
      fh.write(base64.b64decode(encoded_data))
      fh.close()

    ### import uploaded file and get dimensions

    img = cv2.imread(file_path_uploads + file_name + ".png", cv2.IMREAD_COLOR)

    dimensions = img.shape
    height = dimensions[0]
    width = dimensions[1]

    ### scale and set max width 700

    maxWidth = 700
    maxHeight = 700
    f1 = maxWidth / img.shape[1]
    f2 = maxHeight / img.shape[0]
    f = min(f1, f2)  # resizing factor
    dim = (int(img.shape[1] * f), int(img.shape[0] * f))
    resized = cv2.resize(img, dim)

    #resized = cv2.convertScaleAbs(resized, alpha=1.95, beta=1)
    #auto_result, alpha, beta = automatic_brightness_and_contrast(resized, 50)
    #resized = cv2.GaussianBlur(resized, (7,7), cv2.BORDER_DEFAULT)

    cv2.imwrite(file_path_uploads + file_name + "-scaled.png", resized)

    ### do the segmentation
    
    segment_image = semantic_segmentation()
    segment_image.load_ade20k_model("models/deeplabv3_xception65_ade20k.h5")
    segment_image.segmentAsAde20k(file_path_uploads + file_name + "-scaled.png", output_image_name = "assets/segmented/" + file_name + ".png")

    # ins = instanceSegmentation()
    # ins.load_model("models/pointrend_resnet50.pkl", detection_speed = "fast")
    # ins.segmentImage(file_path_uploads + file_name + ".png", show_bboxes=True, output_image_name= "assets/segmented/" + file_name + ".png")

    ### read file with opencv

    img = cv2.imread("assets/segmented/" + file_name + ".png", cv2.IMREAD_COLOR)
    #img = cv2.imread(file_path_uploads + "segment-example.png", cv2.IMREAD_COLOR)

    ### get dimensions of segmented image

    dimensions = img.shape
    height = dimensions[0]
    width = dimensions[1]

    ### remove floor color from segemented image and create mask

    # Define lower and upper limits of our brown floor color
    RedMin = np.array([0, 37, 30],np.uint8)
    RedMax = np.array([30, 100, 100],np.uint8)
    # Go to HSV colourspace and get mask of floor pixels
    HSV  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask0 = cv2.inRange(HSV, RedMin, RedMax)
    # Make all pixels in mask white
    img[mask0 > 0] = [255, 255, 255]
    mask0 = 255 - mask0
    # apply gaussian blur
    mask0 = cv2.GaussianBlur(mask0, (5,5), cv2.BORDER_DEFAULT)
    # invert mask
    thresh = cv2.threshold(mask0, 200, 255, cv2.THRESH_BINARY_INV)[1]
    cv2.imwrite(file_path_uploads + '/DEBUG-plainMask.png', thresh)
    # apply close and open morphology
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    kernel = np.ones((7,7), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    cv2.imwrite(file_path_uploads + '/DEBUG-plainMask-morphology.png', mask)
    # thresh = mask

    ### take floor mask and find contours

    edged = cv2.Canny(thresh, 100, 200, apertureSize=7, L2gradient=True)
    cv2.imwrite(file_path_uploads + '/DEBUG-edge.png', edged)
    # # apply dillitation
    # kernel = np.ones((2,2), np.uint8)
    # edged = cv2.dilate(edged, kernel, iterations = 1)
    #cv2.imwrite(file_path_uploads + '/DEBUG-edge-dilitated.png', edged)

    ### apply douglas algorithm to keep only the 4 most important angle points
    result = []

    if coordinates is None or len(coordinates) == 0:
      # do automatic rotation
      blank_image = np.zeros((height,width,3), np.uint8)

      # edged is the edge detected image
      c, hierarchy = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
      #cnts = imutils.grab_contours(cnts)
      if len(c) == 0:
        return {'error': 'no contour found'}

      # find largest detected line
      #c = sorted(cnts, key = cv2.contourArea, reverse = False)[:5]
      #c = max(cnts, key = cv2.contourArea)
      longestLineIndex = 0
      prevArrayLength = 0
      i = 0
      for l in c:
        arrayLength = len(l)
        if arrayLength > prevArrayLength:
          prevArrayLength = arrayLength
          longestLineIndex = i
        i+=1
      
      cv2.drawContours(blank_image, [c[longestLineIndex]], -1, (0, 255, 0), 1)
      cv2.imwrite(file_path_uploads + '/DEBUG-contour.png', blank_image)
      
      blank_image = np.zeros((height,width,3), np.uint8)
      print("version", cv2.__version__[0])
    
      for eps in np.linspace(0.001, 0.05, 50):
        # approximate the contour
        peri = cv2.arcLength(c[longestLineIndex], True)
        approx = cv2.approxPolyDP(c[longestLineIndex], eps * peri, True)
        # remove duplicates
        approx_without_duplicates = np.unique(approx, axis=0)
        # check for an equal x or y and check if corresponding x or y are in a range of 2 and remove if true
        # there are probably better ways of doing this, also i think this step should be eliminated by the pd algoritm itself 
        if len(approx_without_duplicates) < 8:
          for item in approx_without_duplicates:
            i = 0
            if len(item) == 0:
              continue
            while i < 2:
              x = item[0][i]
              duplicates = list(zip(*np.where(approx_without_duplicates == x)))
              if len(duplicates) > 1:
                nextIndex = duplicates[1][0]
                valueToCheck = approx_without_duplicates[nextIndex][0][i ^ 1]
                if abs(item[0][i ^ 1] - valueToCheck) < 2:
                  approx_without_duplicates = np.delete(approx_without_duplicates, nextIndex, axis=0)
              i += 1
        # if 4 points remain store result and break
        if len(approx_without_duplicates) == 4:
          result = approx_without_duplicates
          cv2.drawContours(blank_image, [result], -1, (0, 255, 0), 1)
          cv2.imwrite(file_path_uploads + '/DEBUG-peucker-douglas.png', blank_image)
          theta = cv2.minAreaRect(result)[2]
          #p3, p4 = extend_line(result[0][0], result[1][0])
          #cv2.line(blank_image, p3, p4, [255,255,255], 2)
          blank_image = subimage(blank_image, center=(width/2, height/2), theta=-theta, width=width, height=height)
          cv2.imwrite(file_path_uploads + '/DEBUG-peucker-douglas-extended.png', blank_image)
          break

      if len(result) != 4:
        return {'error': 'no transform curve found'}, 200

    else:
      # apply coordinates from web
      result = []
      print(type(coordinates), coordinates)
      for point in coordinates:
        result.append([
          point[0] * width,
          point[1] * height,
        ])
      print('result',result)
      result = [result]
      

    ### apply transform on new floor

    src_img = cv2.imread("assets/floors/beuk.jpg")
    # assuming the result yields bottomLeft, topLeft, topRight, topBottom
    dst_pts = np.float32(np.squeeze(result))
    src_pts = np.float32([[0,height], [0,0], [width,0], [width,height]])
    # Draw points
    # for pt in src_pts:
    #   pt = pt.astype(np.int32)
    #   cv2.circle(src_img, (pt[0], pt[1]), radius=5, color=(0, 255, 0), thickness=-1)

    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    dst_img = cv2.warpPerspective(src_img, M, (width, height))
    #plt.imshow(dst_img)
    cv2.imwrite(file_path_uploads + "beuk_output_points.jpg", src_img)
    #cropped_img = dst_img[0: height, 0: width]
    cv2.imwrite(file_path_uploads + "beuk_output_warped.jpg", dst_img)

    ### cut the original floor and make transparent

    room = cv2.imread(file_path_uploads + file_name + "-scaled.png", cv2.IMREAD_COLOR)
    room = room[0: height, 0: width]
    new_img = cv2.cvtColor(room, cv2.COLOR_BGR2BGRA)
    new_img[:, :, 3] = mask0 

    cv2.imwrite(file_path_uploads + 'DEBUG-cut.png', new_img)

    ### merge new floor with the room

    background = cv2.imread(file_path_uploads + "beuk_output_warped.jpg", cv2.IMREAD_COLOR)
    overlay = cv2.imread(file_path_uploads + "DEBUG-cut.png", cv2.IMREAD_UNCHANGED)
    # separate the alpha channel from the color channels
    alpha_channel = overlay[:, :, 3] / 255 # convert from 0-255 to 0.0-1.0
    overlay_colors = overlay[:, :, :3]
    alpha_mask = np.dstack((alpha_channel, alpha_channel, alpha_channel))
    h, w = overlay.shape[:2]
    background_subsection = background[0:h, 0:w]
    # combine the background with the overlay image weighted by alpha
    composite = background_subsection * (1 - alpha_mask) + overlay_colors * alpha_mask
    # overwrite the section of the background image that has been updated
    background[0:h, 0:w] = composite

    cv2.imwrite(file_path_uploads + 'DEBUG-merged.png', background)

    ### return new image ! 🎉

    retval, buffer = cv2.imencode('.jpg', background)
    jpg_as_text = base64.b64encode(buffer)
    return {
      'image': "data:image/png;base64," + jpg_as_text.decode('utf-8'),
      #'rotation': result.tolist()
      }, 200

api.add_resource(Upload, '/upload')

if __name__ == "__main__":
  app.run(debug = True)
