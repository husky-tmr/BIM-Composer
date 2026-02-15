# IFC Conversion Troubleshooting

**Quick fixes for common IFC conversion issues**

---

## Error: "500 Internal Server Error" when loading

### Cause

This error occurs when web-ifc WASM files cannot be loaded.

### Solutions

**Option 1: Clear cache and reload (Recommended)**

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try uploading the IFC file again

**Option 2: Check network**

1. Open DevTools (F12) → Network tab
2. Look for failed requests to `web-ifc` or `.wasm` files
3. Ensure you have internet access (WASM files load from CDN)
4. Check if your firewall/proxy is blocking CDN requests

**Option 3: Restart dev server**

```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## Error: "Failed to convert IFC file"

### Possible Causes

1. **Invalid IFC file** - File is corrupted or not a valid IFC format
2. **Unsupported IFC version** - Some IFC4x3 features may not be supported
3. **Memory issues** - Very large IFC files (>100MB) may cause browser memory issues

### Solutions

**Verify IFC file:**

1. Try opening the IFC file in another viewer (e.g., FreeCAD, IfcOpenShell)
2. Check file size - very large files (>100MB) may need splitting
3. Ensure file extension is `.ifc` (not `.ifczip` or other format)

**Check browser console:**

1. Open DevTools (F12) → Console tab
2. Look for detailed error messages
3. Check for "out of memory" errors
4. Share the error message for further debugging

**Try a smaller file:**

1. If the file is very large, try with a smaller test IFC file first
2. This helps determine if the issue is file-specific or system-wide

---

## Error: "web-ifc is not defined"

### Cause

The web-ifc library is not installed or not loading properly.

### Solution

**Reinstall dependencies:**

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart server
npm run dev
```

**Verify installation:**

```bash
# Check if web-ifc is installed
ls node_modules/web-ifc
```

---

## Error: "Cannot read properties of undefined"

### Cause

Converter is trying to access IFC entities that don't exist or have unexpected structure.

### Solution

**Check console logs:**
The converter logs detailed progress information:

- `[IFCParser]` - Parsing progress
- `[IFCToUSDConverter]` - Conversion phases
- `[Category X]` - Processing category X

Look for warnings about:

- Unprocessed entities
- Missing properties
- Geometry extraction failures

**Report the issue:**
If a specific IFC file consistently fails:

1. Note the exact error message
2. Check which IFC entities are failing (shown in console)
3. Report the issue with the IFC file characteristics

---

## Slow Conversion (Taking > 1 minute)

### Cause

Large IFC files with many entities take time to process.

### Expected Performance

| File Size | Entity Count  | Expected Time |
| --------- | ------------- | ------------- |
| < 5 MB    | < 1,000       | 1-5 seconds   |
| 5-20 MB   | 1,000-10,000  | 5-30 seconds  |
| 20-50 MB  | 10,000-50,000 | 30-60 seconds |
| > 50 MB   | > 50,000      | 1-5 minutes   |

### Solutions

**Monitor progress:**
Open browser console to see conversion progress:

```
[IFCToUSDConverter] Starting conversion...
[IFCToUSDConverter] Phase 1: Gathering entity data...
[IFCToUSDConverter] Cached 12,345 entities
[Category 6] Processed 5 global context types
...
```

**Be patient:**
Large files are normal in BIM projects. The conversion will complete.

**Consider splitting:**
If the file is extremely large (>100MB), consider:

1. Splitting by building/floor in your BIM tool
2. Converting parts separately
3. Loading them as separate layers in USDA Composer

---

## Missing Geometry

### Symptoms

- IFC file loads but no 3D geometry appears
- Some elements missing in 3D view
- Console shows "No geometry found" warnings

### Possible Causes

1. **Curve-based geometry** - Only tessellated geometry is supported
2. **Empty entities** - IFC file has placeholder entities without geometry
3. **Geometry extraction failure** - web-ifc couldn't extract the geometry

### Solutions

**Check conversion logs:**
Look for messages like:

```
[IFCToUSDConverter] hasGeometry: false for entity 12345
Failed to extract geometry for entity 12345
```

**Verify in original IFC:**

1. Open IFC file in another viewer
2. Check if the missing elements have 3D geometry
3. Some IFC entities are spatial (containers) without geometry - this is normal

**Check geometry type:**
The converter supports:

- ✅ IfcPolygonalFaceSet (tessellated)
- ✅ IfcIndexedPolygonalFace
- ✅ IfcTriangulatedFaceSet
- ❌ IfcSweptSolid (must be tessellated first)
- ❌ IfcBooleanResult (must be tessellated first)

---

## Properties Not Showing

### Symptoms

- Geometry loads but properties panel is empty
- Missing property sets (Pset_WallCommon, etc.)

### Cause

IFC file may not have property sets attached to elements.

### Solutions

**Check console:**
Look for:

```
[Category 3] Processed 0 property sets
```

**Verify in original IFC:**

1. Open IFC in another viewer with property inspection
2. Check if the element has property sets
3. Some IFC files have minimal properties - this is normal

**Check attribute names:**
Properties are stored as USD attributes with `ifc:pset:` prefix:

```
custom string "ifc:pset:Pset_WallCommon:FireRating" = "2h"
```

View in Code View to see all attributes.

---

## CORS Errors

### Symptoms

```
CORS policy: No 'Access-Control-Allow-Origin' header
```

### Cause

Browser security blocking WASM file loading from CDN.

### Solutions

**Use dev server:**
Always run the app through the dev server:

```bash
npm run dev
```

Never open `index.html` directly in browser (file:// protocol).

**Check network security:**

- Disable VPN temporarily
- Check firewall settings
- Try different network

---

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 15+

### Required Features

- WebAssembly (WASM)
- ES6 Modules
- File API
- ArrayBuffer

### Check Compatibility

Open DevTools console and run:

```javascript
console.log("WASM supported:", typeof WebAssembly !== "undefined");
```

---

## Debug Mode

Enable verbose logging for troubleshooting:

**Option 1: Console Logging**
All conversion steps are logged to console with `[IFCParser]` and `[IFCToUSDConverter]` prefixes.

**Option 2: Inspect Generated USD**
After conversion:

1. Switch to Code View (&lt;&gt; button)
2. Inspect the generated USD content
3. Look for:
   - `ifc:context` dictionary at the root
   - `_Resources` scope with type definitions
   - `Materials` scope with materials
   - `ifc:pset:*` attributes on elements

**Option 3: Check State**
In DevTools console:

```javascript
// Check loaded files
console.log(store.getState().loadedFiles);

// Check layer stack
console.log(store.getState().stage.layerStack);
```

---

## Getting Help

If you're still experiencing issues:

1. **Gather information:**
   - Browser and version
   - File size and IFC version
   - Exact error message from console
   - Steps to reproduce

2. **Check existing issues:**
   https://github.com/anthropics/usda-composer/issues

3. **Create new issue:**
   Include all gathered information plus:
   - Screenshot of error
   - Console logs
   - Minimal test case if possible

---

## Advanced: Local WASM Files (Optional)

If you want to use local WASM files instead of CDN:

**1. Create public folder:**

```bash
mkdir public
mkdir public/wasm
```

**2. Copy WASM files:**

```bash
cp node_modules/web-ifc/*.wasm public/wasm/
```

**3. Update ifcParser.js:**

```javascript
this.ifcAPI.SetWasmPath("/wasm/");
```

**4. Update package.json:**
Add post-install script:

```json
"scripts": {
  "postinstall": "mkdir -p public/wasm && cp node_modules/web-ifc/*.wasm public/wasm/"
}
```

---

**Last Updated:** February 15, 2026
