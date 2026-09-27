#!/usr/bin/env python3
"""
Face Detection using OpenCV DNN Module
Alternative implementation that doesn't rely on face_recognition library
Uses pre-trained Caffe models for face detection
"""

import sys
import json
import cv2
import numpy as np
from pathlib import Path
import logging
import urllib.request
import ssl
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model URLs
PROTOTXT_URL = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
CAFFEMODEL_URL = "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"

# Local paths for models
MODELS_DIR = Path(__file__).parent / "models"
PROTOTXT_PATH = MODELS_DIR / "deploy.prototxt"
CAFFEMODEL_PATH = MODELS_DIR / "res10_300x300_ssd_iter_140000.caffemodel"

# Create SSL context that doesn't verify certificates (for model download only)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def download_models():
    """Download face detection models if not present"""
    MODELS_DIR.mkdir(exist_ok=True)
    
    if not PROTOTXT_PATH.exists():
        logger.info(f"Downloading prototxt...")
        opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl_context))
        urllib.request.install_opener(opener)
        urllib.request.urlretrieve(PROTOTXT_URL, PROTOTXT_PATH)
        logger.info(f"Downloaded prototxt to {PROTOTXT_PATH}")
    
    if not CAFFEMODEL_PATH.exists():
        logger.info(f"Downloading caffemodel (this may take a minute)...")
        opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl_context))
        urllib.request.install_opener(opener)
        urllib.request.urlretrieve(CAFFEMODEL_URL, CAFFEMODEL_PATH)
        logger.info(f"Downloaded caffemodel to {CAFFEMODEL_PATH}")

def load_face_detector():
    """Load the DNN face detector"""
    try:
        download_models()
        # OpenCV 5.0+ uses readNet which auto-detects format
        net = cv2.dnn.readNet(str(CAFFEMODEL_PATH), str(PROTOTXT_PATH))
        return net
    except Exception as e:
        logger.error(f"Failed to load face detector: {e}")
        import traceback
        traceback.print_exc()
        return None

def detect_faces_opencv(image_path, confidence_threshold=0.3, single_face_mode=False):
    """
    Detect faces using OpenCV DNN with multi-scale detection for small faces
    
    Args:
        image_path: Path to image file
        confidence_threshold: Minimum confidence for detection (0.0-1.0)
                             Lowered to 0.3 to detect smaller faces
        single_face_mode: If True, use stricter NMS (0.3) and larger min_size (20%) for student photos
    
    Returns:
        dict with success status, face_count, and face_locations
    """
    try:
        logger.info(f"Loading image: {image_path}")
        
        # Increase confidence threshold for single-face mode to reduce false positives
        if single_face_mode:
            confidence_threshold = max(confidence_threshold, 0.5)  # At least 0.5 for single-face
            logger.info(f"Single-face mode: Using confidence threshold {confidence_threshold}")
        
        if not Path(image_path).exists():
            return {
                'success': False,
                'error': f'Image file not found: {image_path}'
            }
        
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            return {
                'success': False,
                'error': f'Failed to load image: {image_path}'
            }
        
        (h, w) = image.shape[:2]
        logger.info(f"Image dimensions: {w}x{h}")
        
        # Load detector
        net = load_face_detector()
        if net is None:
            return {
                'success': False,
                'error': 'Failed to load face detector'
            }
        
        face_locations = []
        confidences = []
        all_detections = []
        
        # Multi-scale detection - try different input sizes for better small face detection
        scales = [300, 416, 512]  # Different input sizes
        
        for scale_size in scales:
            # Prepare image for DNN at this scale
            blob = cv2.dnn.blobFromImage(
                cv2.resize(image, (scale_size, scale_size)), 
                1.0,
                (scale_size, scale_size),
                (104.0, 177.0, 123.0)
            )
            
            # Detect faces
            net.setInput(blob)
            detections = net.forward()
            
            # Parse detections at this scale
            for i in range(detections.shape[2]):
                confidence = float(detections[0, 0, i, 2])
                
                if confidence > confidence_threshold:
                    # Get bounding box
                    box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                    (startX, startY, endX, endY) = box.astype("int")
                    
                    # Calculate face dimensions
                    face_width = endX - startX
                    face_height = endY - startY
                    
                    # Reject faces that are too small (likely false positives)
                    # Use very strict thresholds for single-face mode
                    min_size_ratio = 0.20 if single_face_mode else 0.05  # 20% for student photos, 5% for group photos
                    min_size = min(w, h) * min_size_ratio
                    if face_width < min_size or face_height < min_size:
                        logger.info(f"Rejecting small face: {face_width}x{face_height}px (min: {min_size:.0f}px), mode: {'single' if single_face_mode else 'multi'}")
                        continue
                    
                    # Validate bounding box
                    if startX >= 0 and startY >= 0 and endX <= w and endY <= h:
                        detection = {
                            'box': [startX, startY, endX, endY],
                            'confidence': confidence
                        }
                        all_detections.append(detection)
        
        # Remove duplicate detections using Non-Maximum Suppression
        if all_detections:
            boxes = np.array([d['box'] for d in all_detections])
            scores = np.array([d['confidence'] for d in all_detections])
            
            logger.info(f"Total detections before NMS: {len(all_detections)}")
            logger.info(f"Detection confidences: {[f'{s:.3f}' for s in scores]}")
            
            # Apply NMS to remove overlapping boxes
            # Use different NMS thresholds based on context
            # Lower threshold = more aggressive suppression of overlaps
            nms_threshold = 0.3 if single_face_mode else 0.5  # Strict for single-face, lenient for multi-face
            indices = cv2.dnn.NMSBoxes(
                boxes.tolist(), 
                scores.tolist(), 
                score_threshold=confidence_threshold,
                nms_threshold=nms_threshold
            )
            
            logger.info(f"NMS threshold: {nms_threshold} (mode: {'single-face' if single_face_mode else 'multi-face'})")
            
            logger.info(f"Detections after NMS: {len(indices) if len(indices) > 0 else 0}")
            
            # Flatten indices (OpenCV returns nested array)
            if len(indices) > 0:
                indices = indices.flatten()
                
                for idx in indices:
                    startX, startY, endX, endY = all_detections[idx]['box']
                    
                    # Convert to face_recognition format (top, right, bottom, left)
                    face_locations.append([
                        int(max(0, startY)),
                        int(min(w, endX)),
                        int(min(h, endY)),
                        int(max(0, startX))
                    ])
                    confidences.append(float(all_detections[idx]['confidence']))
        
        logger.info(f"Found {len(face_locations)} face(s) with confidences: {[f'{c:.3f}' for c in confidences]}")
        
        return {
            'success': True,
            'face_count': len(face_locations),
            'face_locations': face_locations,
            'confidences': confidences,
            'image_dimensions': {'width': int(w), 'height': int(h)}
        }
        
    except Exception as e:
        logger.error(f"Face detection error: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e)
        }

def extract_face_encoding(image_path, face_location):
    """
    Extract robust feature vector from face region
    Uses multiple feature types for better matching of small faces
    """
    try:
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # Extract face region
        top, right, bottom, left = face_location
        face_image = image[top:bottom, left:right]
        
        # Check if face is too small
        face_height = bottom - top
        face_width = right - left
        if face_height < 20 or face_width < 20:
            logger.warning(f"Face too small: {face_width}x{face_height}")
        
        # Resize to standard size with better interpolation for small faces
        target_size = 128
        if face_height < 64 or face_width < 64:
            # Use better interpolation for small faces
            face_image = cv2.resize(face_image, (target_size, target_size), 
                                   interpolation=cv2.INTER_CUBIC)
        else:
            face_image = cv2.resize(face_image, (target_size, target_size))
        
        # Apply slight blur to reduce noise (helps with small faces)
        face_image = cv2.GaussianBlur(face_image, (3, 3), 0)
        
        # Convert to grayscale
        gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        
        # Normalize lighting using histogram equalization
        gray = cv2.equalizeHist(gray)
        
        # Extract multiple features for robust matching
        features = []
        
        # 1. Histogram features (basic intensity distribution)
        hist = cv2.calcHist([gray], [0], None, [64], [0, 256])  # Reduced bins for robustness
        hist = cv2.normalize(hist, hist).flatten()
        features.extend(hist.tolist())
        
        # 2. HOG (Histogram of Oriented Gradients) features - good for face structure
        hog_win_size = (128, 128)
        hog_block_size = (16, 16)
        hog_block_stride = (8, 8)
        hog_cell_size = (8, 8)
        hog_nbins = 9
        
        hog = cv2.HOGDescriptor(hog_win_size, hog_block_size, hog_block_stride, 
                                hog_cell_size, hog_nbins)
        hog_features = hog.compute(gray)
        if hog_features is not None:
            # Normalize and reduce HOG features
            hog_features = hog_features.flatten()
            hog_features = hog_features / (np.linalg.norm(hog_features) + 1e-6)
            # Sample every 4th feature to reduce dimensionality
            features.extend(hog_features[::4].tolist())
        
        # 3. LBP (Local Binary Patterns) - texture features
        # Divide face into grid and compute LBP histogram for each cell
        grid_size = 4
        cell_h = target_size // grid_size
        cell_w = target_size // grid_size
        
        for i in range(grid_size):
            for j in range(grid_size):
                cell = gray[i*cell_h:(i+1)*cell_h, j*cell_w:(j+1)*cell_w]
                cell_hist = cv2.calcHist([cell], [0], None, [16], [0, 256])
                cell_hist = cv2.normalize(cell_hist, cell_hist).flatten()
                features.extend(cell_hist.tolist())
        
        logger.info(f"Extracted {len(features)} features from face (size: {face_width}x{face_height})")
        
        return features
        
    except Exception as e:
        logger.error(f"Encoding extraction error: {e}")
        return None

def compare_faces(encoding1, encoding2):
    """
    Compare two face encodings using correlation
    Returns similarity score (0-1, higher is better)
    """
    try:
        if encoding1 is None or encoding2 is None:
            return 0.0
        
        # Convert to numpy arrays
        enc1 = np.array(encoding1, dtype=np.float32)
        enc2 = np.array(encoding2, dtype=np.float32)
        
        # Normalize
        enc1 = enc1 / (np.linalg.norm(enc1) + 1e-6)
        enc2 = enc2 / (np.linalg.norm(enc2) + 1e-6)
        
        # Compute correlation
        similarity = np.dot(enc1, enc2)
        
        return float(max(0.0, min(1.0, similarity)))
        
    except Exception as e:
        logger.error(f"Comparison error: {e}")
        return 0.0

def main():
    """Main entry point"""
    try:
        input_data = json.loads(sys.stdin.read())
        command = input_data.get('command')
        
        logger.info(f"Executing command: {command}")
        
        if command == 'detect':
            image_path = input_data.get('image_path')
            # Lower default confidence to detect smaller faces
            confidence = input_data.get('confidence', 0.3)
            # Default to multi-face mode for attendance, single-face for student photo enrollment
            single_face_mode = input_data.get('single_face_mode', False)  # False = multi-face mode
            
            result = detect_faces_opencv(image_path, confidence, single_face_mode=single_face_mode)
            
            # Add face encodings if requested
            if result['success'] and result['face_count'] > 0:
                encodings = []
                for face_loc in result['face_locations']:
                    encoding = extract_face_encoding(image_path, face_loc)
                    encodings.append(encoding)
                result['face_encodings'] = encodings
            else:
                result['face_encodings'] = []
            
            print(json.dumps(result))
            
        elif command == 'match':
            unknown_encoding = input_data.get('unknown_encoding')
            known_encodings = input_data.get('known_encodings', [])
            tolerance = input_data.get('tolerance', 0.6)
            
            logger.info(f"Matching against {len(known_encodings)} known faces")
            
            best_match = False
            best_confidence = 0.0
            best_match_index = -1
            all_similarities = []
            
            for i, known_encoding in enumerate(known_encodings):
                # Parse JSON string if needed
                if isinstance(known_encoding, str):
                    try:
                        known_encoding = json.loads(known_encoding)
                    except:
                        continue
                
                similarity = compare_faces(unknown_encoding, known_encoding)
                all_similarities.append(similarity)
                logger.info(f"Face {i}: similarity = {similarity:.4f}")
                
                if similarity > best_confidence:
                    best_confidence = similarity
                    best_match_index = i
                
                # If similarity is above threshold (1 - tolerance), it's a match
                if similarity >= (1.0 - tolerance):
                    best_match = True
            
            result = {
                'success': True,
                'matched': best_match,
                'confidence': best_confidence,
                'best_match_index': best_match_index,
                'threshold': 1.0 - tolerance,
                'all_similarities': all_similarities  # Return all for debugging
            }
            
            logger.info(f"Match result: matched={best_match}, best_index={best_match_index}, confidence={best_confidence:.4f}")
            print(json.dumps(result))
            
        else:
            print(json.dumps({
                'success': False,
                'error': f'Invalid command: {command}'
            }))
            
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))

if __name__ == '__main__':
    main()
