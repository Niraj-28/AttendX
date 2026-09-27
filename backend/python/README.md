# AttendX Face Recognition Module

Python-based face recognition module using OpenCV and face_recognition library.

## Features

- **Face Detection**: Detect all faces in an image
- **Face Encoding**: Generate 128-dimensional face vectors
- **Face Matching**: Match unknown faces against known faces
- **Batch Processing**: Process multiple faces at once
- **Configurable Tolerance**: Adjust matching strictness

## Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- opencv-python (4.8.1.78)
- face-recognition (1.3.0)
- numpy (1.24.3)
- Pillow (10.1.0)
- dlib (19.24.2)

## Installation

### macOS
```bash
# Install dependencies
brew install cmake

# Install Python packages
cd backend/python
pip3 install -r requirements.txt
```

### Ubuntu/Linux
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential cmake
sudo apt-get install -y libopenblas-dev liblapack-dev
sudo apt-get install -y libx11-dev libgtk-3-dev

# Install Python packages
cd backend/python
pip3 install -r requirements.txt
```

## Usage

The module is called from Node.js via stdin/stdout communication.

### Command: detect

Detect all faces in an image and extract face encodings.

**Input:**
```json
{
  "command": "detect",
  "image_path": "/path/to/image.jpg",
  "model": "hog"
}
```

**Parameters:**
- `image_path` (required): Path to the image file
- `model` (optional): Detection model - "hog" (faster) or "cnn" (more accurate)

**Output:**
```json
{
  "success": true,
  "face_count": 1,
  "face_locations": [[100, 200, 300, 150]],
  "face_encodings": [[0.1, 0.2, ...]], 
  "image_dimensions": {"width": 640, "height": 480}
}
```

### Command: match

Match an unknown face against known faces.

**Input:**
```json
{
  "command": "match",
  "unknown_encoding": [0.1, 0.2, ...],
  "known_encodings": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
  "tolerance": 0.6
}
```

**Parameters:**
- `unknown_encoding` (required): 128-d face encoding to match
- `known_encodings` (required): Array of known face encodings
- `tolerance` (optional): Match threshold (0.0-1.0). Lower = stricter. Default: 0.6

**Output:**
```json
{
  "success": true,
  "matched": true,
  "match_index": 0,
  "confidence": 0.85,
  "all_distances": [0.15, 0.92]
}
```

### Command: batch_match

Match multiple faces at once.

**Input:**
```json
{
  "command": "batch_match",
  "unknown_encodings": [[0.1, ...], [0.2, ...]],
  "known_encodings_with_ids": [
    {"id": 1, "encoding": [0.1, ...]},
    {"id": 2, "encoding": [0.2, ...]}
  ],
  "tolerance": 0.6
}
```

**Output:**
```json
{
  "success": true,
  "matches": [
    {"face_index": 0, "matched": true, "student_id": 1, "confidence": 0.85},
    {"face_index": 1, "matched": false}
  ],
  "total_faces": 2,
  "matched_count": 1
}
```

## Node.js Integration

The module is integrated via `backend/src/utils/faceRecognition.js`:

```javascript
const { detectFaces, matchFaces } = require('./utils/faceRecognition');

// Detect faces
const result = await detectFaces('/path/to/image.jpg');

// Match faces
const match = await matchFaces(unknownEncoding, knownEncodings, 0.6);
```

## Face Encoding Format

Face encodings are 128-dimensional vectors (numpy arrays) that represent unique facial features.

**Properties:**
- Type: Array of 128 floating-point numbers
- Range: Typically -1.0 to 1.0
- Storage: JSON string in database (TEXT field)
- Size: ~1-2 KB per encoding

**Example:**
```json
[
  0.123, -0.456, 0.789, ..., 0.234
]
```

## Tolerance Values

The `tolerance` parameter controls matching strictness:

| Tolerance | Description | Use Case |
|-----------|-------------|----------|
| 0.4 | Very strict | High security, minimize false positives |
| 0.5 | Strict | Balanced security |
| **0.6** | **Default** | **Recommended for most cases** |
| 0.7 | Lenient | Better recall, more false positives |
| 0.8+ | Very lenient | Not recommended |

## Model Selection

### HOG (Histogram of Oriented Gradients)
- **Speed**: Fast (CPU)
- **Accuracy**: Good
- **Use**: Default, real-time processing

### CNN (Convolutional Neural Network)  
- **Speed**: Slower (requires GPU)
- **Accuracy**: Better
- **Use**: Difficult lighting, angles

## Error Handling

All functions return a response with `success` field:

```json
{
  "success": false,
  "error": "Error description"
}
```

**Common Errors:**
- `Image file not found`: Invalid image path
- `No face detected`: Image contains no faces
- `Invalid JSON input`: Malformed input data
- `Missing encoding data`: Empty or null encodings

## Performance

### Face Detection
- HOG model: ~0.1-0.3 seconds per image
- CNN model: ~0.5-1.5 seconds per image

### Face Matching
- Single match: ~0.01 seconds
- Batch (100 faces): ~0.5-1.0 seconds

**Optimization Tips:**
- Use HOG model for real-time processing
- Batch process when possible
- Pre-compute and cache face encodings
- Resize images to max 800x600 before processing

## Testing

### Test Face Detection
```bash
cd backend/python

# Create test input
echo '{"command":"detect","image_path":"test_image.jpg"}' | python3 face_recognition.py
```

### Test Face Matching
```bash
# Create test input with sample encodings
echo '{"command":"match","unknown_encoding":[0.1,0.2,...],"known_encodings":[[0.1,0.2,...]]}' | python3 face_recognition.py
```

## Troubleshooting

### dlib installation fails
```bash
# macOS
brew install cmake
pip3 install dlib

# Ubuntu
sudo apt-get install cmake libopenblas-dev liblapack-dev
pip3 install dlib
```

### face_recognition not found
```bash
# Verify installation
pip3 show face-recognition

# Reinstall
pip3 uninstall face-recognition
pip3 install face-recognition
```

### OpenCV import error
```bash
pip3 uninstall opencv-python
pip3 install opencv-python
```

## Logging

The module logs to stderr with INFO level:

```
2024-01-15 10:00:00 - __main__ - INFO - Executing command: detect
2024-01-15 10:00:00 - __main__ - INFO - Loading image: /path/to/image.jpg
2024-01-15 10:00:01 - __main__ - INFO - Found 3 face(s)
```

## Best Practices

✅ **Do:**
- Validate image paths before processing
- Handle errors gracefully
- Use appropriate tolerance values
- Pre-process images (resize, normalize)
- Store encodings in database, not images
- Batch process when possible

❌ **Don't:**
- Process very large images (>2000px)
- Use tolerance > 0.8
- Store raw images in database
- Process without error handling
- Skip face validation on enrollment

## References

- [face_recognition library](https://github.com/ageitgey/face_recognition)
- [dlib](http://dlib.net/)
- [OpenCV](https://opencv.org/)

## Support

For issues with the face recognition module:
1. Check Python and package versions
2. Verify image quality and format
3. Check logs for detailed error messages
4. Test with sample images first
