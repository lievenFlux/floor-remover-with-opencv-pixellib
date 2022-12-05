import tensorflow as tf
import struct
print(struct.calcsize("P") * 8)

print(tf.test.is_gpu_available())
print(tf.test.is_gpu_available(cuda_only=True))
print(tf.test.is_gpu_available(True, (3,0)))

# Check for TensorFlow GPU access
print(f"TensorFlow has access to the following devices:\n{tf.config.list_physical_devices()}")
