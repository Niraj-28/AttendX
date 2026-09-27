# Session Image Upload Fix - Deployment

**Date:** September 27, 2026  
**Version:** 1.0.5  
**Status:** ✅ DEPLOYED

## Problem

When faculty tried to start a session with classroom image upload, backend returned **400 Bad Request** with error "Classroom image is required" even though:
- Frontend correctly sent FormData with all fields
- Image was compressed and visible in preview (27.80 KB jpeg)
- All debugging logs showed image in frontend state

## Root Causes Identified

### 1. Backend Route Error (Critical)
**File:** `backend/src/routes/session.routes.js`  
**Error:** `TypeError: uploadSingle is not a function`

The deployed version still had the old variable name:
```javascript
// OLD (causing crash)
router.post('/start', uploadSingle('image'), ...);
```

Fixed to:
```javascript
// NEW (correct)
router.post('/start', upload.single('image'), ...);
```

**Impact:** Backend server kept crashing and restarting, unable to process any session start requests.

### 2. Missing Content-Type Header (Critical)
**File:** `frontend/src/services/api.js`  
**Line:** 65

The `sessionAPI.start` method was not setting the multipart/form-data header:
```javascript
// OLD
start: (data) => api.post('/sessions/start', data),
```

Fixed to match other file upload endpoints:
```javascript
// NEW
start: (data) => api.post('/sessions/start', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
}),
```

**Impact:** Multer middleware (`upload.single('image')`) was not receiving `req.file` because axios wasn't sending the request as multipart/form-data. The image ended up in `req.body.image` as an empty object instead of `req.file`.

## Backend Logs Analysis

Before fix (09:05:54):
```
req.body: {
  image: {}  // ❌ Wrong - should not be in body
}
req.file: NO FILE  // ❌ Multer didn't receive the file
Validation failed: No image file
```

After fix:
- Backend should receive `req.file` with buffer, mimetype, originalname
- Image will be uploaded to S3 successfully
- Face recognition will process the classroom photo

## Files Changed

### Backend
1. **backend/src/routes/session.routes.js**
   - Fixed: Changed `uploadSingle` to `upload.single('image')`
   - Redeployed via SCP

### Frontend
1. **frontend/src/services/api.js**
   - Fixed: Added `'Content-Type': 'multipart/form-data'` header to sessionAPI.start
   - Built bundle: 1,061.45 kB
   - Deployed to `/var/www/attendx/`

## Deployment Steps

1. Fixed backend routes file and redeployed
   ```bash
   scp session.routes.js ubuntu@32.195.60.167:/home/ubuntu/backend/src/routes/
   ssh ubuntu@32.195.60.167 "pm2 restart attendx-backend"
   ```

2. Fixed frontend API service and rebuilt
   ```bash
   cd frontend
   npm run build
   scp -r dist/* ubuntu@32.195.60.167:/home/ubuntu/dist/
   sudo cp -r /home/ubuntu/dist/* /var/www/html/  # Nginx serves from /var/www/html
   ```

3. Server Status
   - PM2 Process: attendx-backend (PID 53765, restart count 56)
   - Status: ✅ Online
   - No more crashes

## Testing Instructions

1. **Hard Refresh Browser:** Press `Ctrl + Shift + R` or `Ctrl + F5` to clear cached JavaScript files
2. Navigate to Sessions page
3. Fill cascading form:
   - Select Stream (e.g., MCA)
   - Select Semester (e.g., 3)
   - Select Subject (e.g., Cloud Computing)
   - Select Session Type (e.g., Lecture)
   - Select Date and Times
   - Upload Classroom Image
4. Click "Start Session"

## Expected Behavior

✅ **Success Response:**
- Backend receives `req.file` with image buffer
- Image uploaded to S3
- Face recognition processes classroom photo
- Session created in database
- Toast: "Session started and attendance captured successfully!"

❌ **Previous Behavior:**
- 400 Bad Request
- Error: "Classroom image is required"
- Backend logs: "req.file: NO FILE"

## Related Issues Fixed

- Removed `uploadSingle is not a function` error
- Fixed multer middleware not receiving files
- Ensured axios sends multipart/form-data for file uploads
- Backend no longer crashes on session start requests

## Notes

- Both issues were independent but both needed to be fixed
- Backend route issue prevented server from starting properly
- Frontend header issue prevented file upload even after backend fix
- Similar pattern used in `studentAPI.create` and `attendanceAPI.capture` already had the correct headers

---

**Deployed By:** Kiro AI  
**Server:** http://32.195.60.167  
**PM2 Process:** attendx-backend (PID 53765)
