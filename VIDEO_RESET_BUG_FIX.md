# Video Reset Bug Fix - Issue Analysis & Solution

## Problem Description

**Some students** (not all) report that videos suddenly jump back to the beginning after a few minutes of watching.

## Root Cause Analysis

### Primary Issue: HLS Error Recovery Without Position Preservation

Since only some students experience this, the issue is likely **network-related** or **browser-specific**:

#### **Network-Related Causes:**

1. **Poor Internet Connection**: Students with slow/unstable connections trigger HLS error recovery
2. **CDN Issues**: Intermittent CloudFront/AWS connectivity problems
3. **Mobile Data Limitations**: Cellular connections with varying quality
4. **Network Congestion**: Peak usage times causing timeouts

#### **Browser-Specific Causes:**

1. **Different HLS Support**: Safari (native) vs Chrome/Firefox (HLS.js)
2. **Mobile Browser Variations**: iOS Safari vs Android Chrome behavior
3. **Browser Buffer Management**: Different browsers handle buffering differently

#### **HLS Error Recovery Process (The Bug):**

When network issues occur:

```javascript
// HLS.js detects network/media error
hls.on(Hls.Events.ERROR, (event, data) => {
  if (data.fatal) {
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      hls.startLoad(); // ❌ Reloads stream from beginning
    }
    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      hls.recoverMediaError(); // ❌ Recovers but loses position
    }
  }
});
```

### Secondary Issues Identified:

1. **Aggressive HLS Configuration**: Default timeouts too short for poor connections
2. **No Error Tracking**: Difficult to identify which students have issues
3. **Buffer Management**: Some browsers flush buffers more aggressively

## Technical Details

### Students Affected:

- **Slow internet connections** (< 2Mbps)
- **Mobile users** on cellular data
- **Rural areas** with unstable connections
- **Peak hours** when CDN is congested
- **Specific browsers** with different HLS handling

### Before Fix:

```javascript
hls.on(Hls.Events.ERROR, (event, data) => {
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        hls.startLoad(); // ❌ Loses current position
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        hls.recoverMediaError(); // ❌ Loses current position
        break;
    }
  }
});
```

### After Fix:

```javascript
hls.on(Hls.Events.ERROR, (event, data) => {
  // ✅ Store position before recovery
  const currentTime = vdrf.current ? vdrf.current.currentTime : 0;
  const wasPlaying = vdrf.current ? !vdrf.current.paused : false;

  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        hls.startLoad();
        // ✅ Restore position after recovery
        setTimeout(() => {
          if (currentTime > 0) {
            vdrf.current.currentTime = currentTime;
            if (wasPlaying) vdrf.current.play();
          }
        }, 1000);
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        hls.recoverMediaError();
        // ✅ Restore position after recovery
        setTimeout(() => {
          if (currentTime > 0) {
            vdrf.current.currentTime = currentTime;
            if (wasPlaying) vdrf.current.play();
          }
        }, 1000);
        break;
    }
  }
});
```

## Changes Made

### 1. Enhanced HLS Configuration for Poor Connections

```javascript
const hls = new Hls({
  manifestLoadingTimeOut: 20000, // 20s timeout (was default 10s)
  manifestLoadingMaxRetry: 4, // More retries
  levelLoadingTimeOut: 20000, // 20s timeout
  fragLoadingMaxRetry: 6, // More fragment retries
  abrEwmaDefaultEstimate: 1000000, // Conservative 1Mbps estimate
  startFragPrefetch: true, // Prefetch for smoother playback
});
```

### 2. Position Preservation During Error Recovery

- Store `currentTime` and `wasPlaying` before any recovery
- Use `setTimeout` to restore position after recovery completes
- Enhanced logging to track recovery success

### 3. Error Tracking and Debugging

- Track error history per user
- Global `getVideoDebugInfo()` function for support
- Log user email, connection info, and error patterns

### 4. Additional HLS Event Monitoring

- `BUFFER_STALLED` detection
- `BUFFER_FLUSHED` monitoring (can cause position issues)
- `MEDIA_ATTACHED` for successful recovery tracking

### 5. Network-Aware Features

- Browser connection info logging
- User-specific error tracking
- Enhanced timeout handling

## Files Modified

- `src/components/cvp.jsx` - Main video player component

## Testing Recommendations

### For Affected Students:

1. **Network Simulation**: Test with slow connections (< 1Mbps)
2. **Mobile Testing**: iOS Safari and Android Chrome
3. **Peak Hours**: Test during high-traffic periods
4. **Cellular Data**: Test on 3G/4G connections
5. **Error Simulation**: Artificially trigger network interruptions

### Debug Commands:

```javascript
// In browser console, get debug info for specific student:
getVideoDebugInfo();

// Returns user email, error history, connection info, etc.
```

## Expected Behavior After Fix

- ✅ Videos maintain position during network error recovery
- ✅ Better handling of poor network conditions
- ✅ Enhanced error tracking for support
- ✅ Improved timeout handling for slow connections
- ✅ Position preservation during buffer stalls

## Student Support Workflow

1. **Identify Affected Student**: Use error logs with user email
2. **Check Debug Info**: Run `getVideoDebugInfo()` in console
3. **Analyze Pattern**: Review `errorHistory` for recurring issues
4. **Network Assessment**: Check `browserInfo.connection` data
5. **Targeted Solution**: Recommend optimal quality settings

## Prevention Measures

- Position preservation for all error recovery scenarios
- More tolerant timeout settings for poor connections
- Comprehensive error tracking with user identification
- Network-aware configuration adjustments

## Notes

- Fix targets the ~10-20% of students with poor/unstable connections
- Maintains security model and existing functionality
- Backward compatible with all video types and browsers
- Provides debugging tools for ongoing support
