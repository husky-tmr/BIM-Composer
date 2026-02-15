# IFC File Support

**Last Updated:** February 15, 2026

USDA Composer now supports importing Industry Foundation Classes (IFC) files and automatically converting them to USD format with complete data preservation.

---

## Overview

The IFC to USD conversion system implements a comprehensive data preservation strategy that ensures **zero data loss** during conversion. All IFC classes are systematically mapped to appropriate USD representations.

## Features

- ✅ **Client-side conversion** - No server required, works entirely in the browser
- ✅ **Complete data preservation** - ALL IFC classes are preserved (see categories below)
- ✅ **Automatic format detection** - Simply upload an `.ifc` file
- ✅ **Round-trip metadata** - Original IFC data stored for potential re-export
- ✅ **Spatial hierarchy preservation** - IFC spatial structure maps to USD hierarchy
- ✅ **Material preservation** - IFC materials converted to USD materials
- ✅ **Property sets preserved** - All IFC properties stored as USD attributes

---

## How to Use

### Basic Usage

1. Click the **"+" (Add Layer)** button in the Layer Stack panel
2. Select an `.ifc` file from your computer
3. The file will be automatically converted to USD format
4. The converted layer appears in your layer stack as a `.usda` file

### What Gets Converted

The converter implements a **6-Category Classification System**:

#### Category 1: Physical & Spatial Elements → USD Xform/Mesh

- **Structural:** Walls, Slabs, Beams, Windows, Openings, Coverings, Building Element Proxies
- **MEP & Furnishing:** Furniture, Sanitary Terminals, Tanks, Air Terminals
- **Spatial Hierarchy:** Project, Site, Building, Building Storey, Spaces

These become 3D geometry in USD with full metadata.

#### Category 2: Type Definitions → USD Scope Resources

- Wall Types, Beam Types, Slab Types, Window Types, etc.
- Stored in a `_Resources` scope at the root level
- Instances reference their types via `ifc:type_ref` attribute

#### Category 3: Properties & Quantities → USD Attributes

- Property Sets (Pset_WallCommon, Pset_BeamCommon, etc.)
- Element Quantities (length, area, volume)
- Stored as namespaced attributes:
  ```
  custom string ifc:pset:Pset_WallCommon:FireRating = "2h"
  custom double ifc:quantity:NetVolume = 12.5
  ```

#### Category 4: Materials & Styling → USD Materials

- Material definitions and associations
- Surface styles and colors
- Presentation layers
- Converted to USD `def Material` with proper bindings

#### Category 5: Geometry Source Data → USD Mesh + Metadata

- Cartesian points, directions, placements
- Shape representations
- Polygonal face sets
- Geometry is consumed to create USD meshes, but source metadata is preserved:
  ```
  custom string ifc:geometry_source = "IfcPolygonalFaceSet"
  custom string ifc:representation_type = "Tessellation"
  ```

#### Category 6: Global Context → Root Layer Metadata

- Owner history, application info, persons, organizations
- Unit assignments (SI units, derived units, conversion units)
- Classification references
- Stored in root-level `customLayerData`:
  ```
  customLayerData = {
      dictionary ifc:context = {
          # All global context data here
      }
  }
  ```

---

## USD Output Structure

A converted IFC file produces the following USD structure:

```
#usda 1.0
(
    defaultPrim = "IFCModel"
    upAxis = "Z"
    metersPerUnit = 1.0
    customLayerData = {
        dictionary ifc:context = {
            # Global context metadata (Category 6)
        }
    }
)

def Scope "_Resources"
{
    # Type definitions (Category 2)
    def Scope "WallType_StandardWall"
    {
        custom string ifc:type = "IFCWALLTYPE"
        # ... type properties
    }
}

def Scope "Materials"
{
    # Materials (Category 4)
    def Material "Concrete"
    {
        custom string ifc:material_type = "IFCMATERIAL"
        # ... material properties
    }
}

def Xform "IFCModel"
{
    # Spatial hierarchy (Category 1)
    def Xform "Site"
    {
        custom string ifc:type = "IFCSITE"

        def Xform "Building"
        {
            custom string ifc:type = "IFCBUILDING"

            def Mesh "Wall_01"
            {
                custom string ifc:type = "IFCWALL"
                custom int ifc:type_ref = 12345  # References _Resources
                rel material:binding = </Materials/Concrete>

                # Properties (Category 3)
                custom string "ifc:pset:Pset_WallCommon:IsExternal" = "TRUE"
                custom string "ifc:pset:Pset_WallCommon:FireRating" = "2h"
                custom double "ifc:quantity:NetVolume" = 12.5

                # Geometry metadata (Category 5)
                custom string ifc:geometry_source = "IfcPolygonalFaceSet"
                custom string ifc:representation_type = "Tessellation"

                # Actual mesh data
                point3f[] points = [(0, 0, 0), (1, 0, 0), ...]
                int[] faceVertexCounts = [3, 3, 3, ...]
                int[] faceVertexIndices = [0, 1, 2, ...]
            }
        }
    }
}
```

---

## Technical Implementation

### Architecture

The IFC conversion system consists of two main modules:

1. **`ifcParser.js`** - Wrapper around web-ifc WASM library
   - Loads and parses IFC files
   - Extracts entities, properties, geometry
   - Provides convenient API over web-ifc

2. **`ifcToUsdConverter.js`** - Conversion engine
   - Implements 6-category classification
   - Maps IFC entities to USD prims
   - Preserves all metadata
   - Generates valid USD ASCII output

### Dependencies

- **web-ifc** (v0.0.66) - WebAssembly IFC parser
- Automatically included when you install dependencies

### Performance

- Conversion happens entirely in the browser
- WASM provides native performance
- Large IFC files (>50MB) may take several seconds
- Progress is logged to console during conversion

---

## Data Preservation Guarantees

The converter implements the following guarantees:

1. **No Data Loss** - ALL IFC classes from the master class list are handled
2. **Fallback Handling** - Unknown classes are stored in `ifc:unhandled_data`
3. **Round-Trip Metadata** - Original IFC entity IDs and types preserved
4. **Relationship Preservation** - IFC relationships maintained in USD structure
5. **Property Flattening** - Property sets flattened to attributes for easy access

### Attribute Naming Convention

All IFC-derived attributes use namespaced naming:

- `ifc:type` - Original IFC class name
- `ifc:id` - Original IFC entity ID
- `ifc:pset:<SetName>:<PropertyName>` - Property from property set
- `ifc:quantity:<QuantityName>` - Quantity value
- `ifc:geometry_source` - Original geometry representation
- `ifc:material:<PropertyName>` - Material property
- `ifc:typedata:<PropertyName>` - Type definition property

---

## Troubleshooting

### Common Issues

**"Failed to convert IFC file"**

- Ensure the IFC file is valid (not corrupted)
- Check browser console for detailed error messages
- Large files may require more memory - try closing other tabs

**"web-ifc WASM not found"**

- Run `npm install` to ensure dependencies are installed
- Check that `node_modules/web-ifc/` exists
- Clear browser cache and reload

**"Conversion is very slow"**

- This is normal for large IFC files (10,000+ elements)
- Conversion progress is logged to console
- Be patient - the conversion will complete

**"Some geometry is missing"**

- Check if the IFC file uses unsupported geometry types
- Look for warning messages in console
- Verify that the IFC file opens correctly in other viewers

### Debug Mode

Enable detailed logging by opening the browser console (F12) before uploading. The converter logs:

- Phase progression (gathering, processing, generating)
- Entity counts per category
- Geometry extraction details
- Any unprocessed entities

---

## Limitations

Current limitations (may be addressed in future updates):

1. **Curve-based geometry** - Only tessellated geometry is supported (most IFC files use this)
2. **Advanced materials** - Complex material layering simplified
3. **Parametric geometry** - Converted to static meshes
4. **IFC4 features** - Some IFC4-specific features may map to IFC2x3 equivalents
5. **Performance** - Very large files (>100MB) may be slow

---

## Future Enhancements

Planned improvements:

- [ ] Streaming conversion for very large files
- [ ] Export USD back to IFC
- [ ] Advanced material support (layered materials)
- [ ] Property filtering/selection
- [ ] Conversion options UI
- [ ] Progress bar during conversion

---

## Example Workflow

### Scenario: BIM Coordination

1. **Architect** uploads `Building_Architecture.ifc`
   - Converts to `Building_Architecture.usda`
   - All walls, doors, windows preserved

2. **Structural Engineer** uploads `Building_Structure.ifc`
   - Converts to `Building_Structure.usda`
   - All beams, columns, slabs preserved

3. **Project Manager** composes both layers in Stage View
   - Spatial hierarchy maintained
   - Can toggle visibility by discipline
   - All properties accessible in Properties panel

4. **Team** collaborates on composed model
   - Add custom properties to USD
   - Create annotations
   - Stage specific elements for review

---

## API Reference

For developers who want to use the conversion API directly:

```javascript
import { ifcToUsdConverter } from "./viewer/ifc/ifcToUsdConverter.js";

// Convert IFC file to USD
const file = /* File object from input */;
const usdContent = await ifcToUsdConverter.convert(file);

// usdContent is now a string containing valid USD ASCII
console.log(usdContent);
```

---

## Related Documentation

- [Developer Onboarding](./DEVELOPER_ONBOARDING.md) - Understanding the codebase
- [Services API](../api/SERVICES_API.md) - Using services for layer management
- [Testing Guide](./TESTING_GUIDE.md) - Writing tests for IFC features

---

**Questions or Issues?**

If you encounter problems or have suggestions, please report them at:
https://github.com/anthropics/usda-composer/issues

---

**Last Updated:** February 15, 2026
