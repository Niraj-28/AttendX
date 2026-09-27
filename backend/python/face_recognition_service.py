#!/usr/bin/env python3
"""
Face Recognition Module for AttendX
Handles face detection, encoding, and matching using face_recognition library

This module provides:
- Face detection in images
- Face encoding generation (128-dimensional vectors)
- Face matching against known faces
- Batch processing capabilities

Author: AttendX Team
Version: 1.0.0
"""

import sys
import json
import cv2
import face_recognition
import numpy as np
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def detect_faces(image_path, model='hog'):
    """
    Detect all faces in an image and return their encodings
    Uses OpenCV for reliable image loading
    
    Args:
        image_path (str): Path to the image file
        model (str): Face detection model ('hog' or 'cnn')
                    'hog' is faster, 'cnn' is more accurate but requires GPU
    
    Returns:
        dict: {
            'success': bool,
            'face_count': int,
            'face_locations': list,
            'face_encodings': list
        }
    """
    try:
        logger.info(f"Loading image: {image_path}")
        
        # Check if file exists
        if not Path(image_path).exists():
            return {
                'success': False,
                'error': f'Image file not found: {image_path}'
            }
        
        # Load image using OpenCV then convert to RGB
        image_bgr = cv2.imread(image_path)
        if image_bgr is None:
            return {
                'success': False,
                'error': f'Failed to load image: {image_path}'
            }
        
        # Convert BGR (OpenCV default) to RGB (face_recognition expects RGB)
        image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        logger.info(f"Image loaded successfully, shape: {image.shape}")
        
        # Try to use face_recognition library
        try:
            # Find all face locations and encodings
            face_locations = face_recognition.face_locations(image, model=model)
            logger.info(f"Found {len(face_locations)} face(s) using face_recognition")
            
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            return {
                'success': True,
                'face_count': len(face_locations),
                'face_locations': face_locations,
                'face_encodings': [encoding.tolist() for encoding in face_encodings],
                'image_dimensions': {'width': image.shape[1], 'height': image.shape[0]}
            }
        except Exception as fr_error:
            logger.warning(f"face_recognition library failed: {fr_error}")
            logger.info("Falling back to OpenCV DNN detector")
            
            # Fallback to OpenCV DNN if face_recognition fails
            # This provides a working alternative
            return {
                'success': False,
                'error': 'face_recognition library not available, please use face_detector_opencv.py instead',
                'fallback_available': True
            }
            
    except Exception as e:
        logger.error(f"Face detection error: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e)
        }

def match_faces(unknown_encoding, known_encodings, tolerance=0.6):
    """
    Match an unknown face encoding against known encodings
    
    Args:
        unknown_encoding (list): Face encoding to match
        known_encodings (list): List of known face encodings
        tolerance (float): How much distance between faces to consider it a match
                          Lower is more strict. Default is 0.6
    
    Returns:
        dict: {
            'success': bool,
            'matched': bool,
            'match_index': int (if matched),
            'confidence': float (if matched),
            'all_distances': list (distances to all known faces)
        }
    """
    try:
        if not unknown_encoding or not known_encodings:
            return {
                'success': False,
                'error': 'Missing encoding data'
            }
        
        logger.info(f"Matching against {len(known_encodings)} known faces")
        
        unknown_encoding = np.array(unknown_encoding)
        known_encodings = [np.array(enc) for enc in known_encodings]
        
        # Compare faces
        matches = face_recognition.compare_faces(
            known_encodings, 
            unknown_encoding, 
            tolerance=tolerance
        )
        face_distances = face_recognition.face_distance(known_encodings, unknown_encoding)
        
        logger.info(f"Matches: {matches}")
        logger.info(f"Distances: {face_distances.tolist()}")
        
        if True in matches:
            best_match_index = np.argmin(face_distances)
            confidence = float(1 - face_distances[best_match_index])
            
            logger.info(f"Best match at index {best_match_index} with confidence {confidence:.4f}")
            
            return {
                'success': True,
                'matched': True,
                'match_index': int(best_match_index),
                'confidence': confidence,
                'all_distances': face_distances.tolist()
            }
        else:
            logger.info("No match found")
            return {
                'success': True,
                'matched': False,
                'all_distances': face_distances.tolist()
            }
    except Exception as e:
        logger.error(f"Face matching error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def batch_match_faces(unknown_encodings, known_encodings_with_ids, tolerance=0.6):
    """
    Match multiple unknown faces against known faces
    
    Args:
        unknown_encodings (list): List of face encodings to match
        known_encodings_with_ids (list): List of dicts with 'id' and 'encoding'
        tolerance (float): Matching tolerance
    
    Returns:
        dict: {
            'success': bool,
            'matches': list of match results
        }
    """
    try:
        results = []
        
        for i, unknown_encoding in enumerate(unknown_encodings):
            known_encodings = [item['encoding'] for item in known_encodings_with_ids]
            match_result = match_faces(unknown_encoding, known_encodings, tolerance)
            
            if match_result['success'] and match_result['matched']:
                matched_id = known_encodings_with_ids[match_result['match_index']]['id']
                results.append({
                    'face_index': i,
                    'matched': True,
                    'student_id': matched_id,
                    'confidence': match_result['confidence']
                })
            else:
                results.append({
                    'face_index': i,
                    'matched': False
                })
        
        return {
            'success': True,
            'matches': results,
            'total_faces': len(unknown_encodings),
            'matched_count': sum(1 for r in results if r['matched'])
        }
    except Exception as e:
        logger.error(f"Batch matching error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """
    Main function - reads JSON input from stdin and processes face recognition
    
    Expected input format:
    {
        "command": "detect" | "match" | "batch_match",
        ... command-specific parameters
    }
    """
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        command = input_data.get('command')
        
        logger.info(f"Executing command: {command}")
        
        if command == 'detect':
            # Detect faces in image
            image_path = input_data.get('image_path')
            model = input_data.get('model', 'hog')
            result = detect_faces(image_path, model)
            print(json.dumps(result))
            
        elif command == 'match':
            # Match face against known encodings
            unknown_encoding = input_data.get('unknown_encoding')
            known_encodings = input_data.get('known_encodings')
            tolerance = input_data.get('tolerance', 0.6)
            result = match_faces(unknown_encoding, known_encodings, tolerance)
            print(json.dumps(result))
            
        elif command == 'batch_match':
            # Batch match multiple faces
            unknown_encodings = input_data.get('unknown_encodings')
            known_encodings_with_ids = input_data.get('known_encodings_with_ids')
            tolerance = input_data.get('tolerance', 0.6)
            result = batch_match_faces(unknown_encodings, known_encodings_with_ids, tolerance)
            print(json.dumps(result))
            
        else:
            logger.error(f"Invalid command: {command}")
            print(json.dumps({
                'success': False,
                'error': f'Invalid command: {command}. Valid commands: detect, match, batch_match'
            }))
            
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON input: {str(e)}'
        }))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))

if __name__ == '__main__':
    main()
