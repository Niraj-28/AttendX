const { spawn } = require('child_process');
const path = require('path');

// Use OpenCV-based detector as default (more reliable on Python 3.14)
const PYTHON_SCRIPT = path.join(__dirname, '../../python/face_detector_opencv.py');
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3';

/**
 * Call Python face recognition script
 * @param {Object} inputData - Input for Python script
 * @returns {Promise<Object>} - Python script output
 */
const callPythonScript = (inputData) => {
  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON_EXECUTABLE, [PYTHON_SCRIPT]);
    
    let outputData = '';
    let errorData = '';
    
    python.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${errorData}`));
        return;
      }
      
      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${outputData}`));
      }
    });
    
    // Send input to Python script
    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();
  });
};

/**
 * Detect faces in an image
 * @param {string} imagePath - Path to image file
 * @param {boolean} singleFaceMode - If true, use stricter detection for single-face scenarios (student photos)
 * @returns {Promise<Object>} - Detection result
 */
const detectFaces = async (imagePath, singleFaceMode = false) => {
  const inputData = {
    command: 'detect',
    image_path: imagePath,
    single_face_mode: singleFaceMode
  };
  
  return callPythonScript(inputData);
};

/**
 * Match a face against known faces
 * @param {Array} unknownEncoding - Face encoding to match
 * @param {Array} knownEncodings - Array of known face encodings
 * @param {number} tolerance - Match tolerance (default: 0.6)
 * @returns {Promise<Object>} - Match result
 */
const matchFaces = async (unknownEncoding, knownEncodings, tolerance = 0.6) => {
  const inputData = {
    command: 'match',
    unknown_encoding: unknownEncoding,
    known_encodings: knownEncodings,
    tolerance: tolerance
  };
  
  return callPythonScript(inputData);
};

module.exports = {
  detectFaces,
  matchFaces
};
