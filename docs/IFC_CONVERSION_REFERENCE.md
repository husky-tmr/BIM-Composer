# IFC to USD Conversion Reference

**Quick Reference for IFC Class Mapping**

This document provides a comprehensive mapping of all supported IFC classes to their USD representations.

---

## Category 1: Physical & Spatial Elements

Maps to: `def Xform` or `def Mesh` with geometry

| IFC Class               | USD Type | Description                  |
| ----------------------- | -------- | ---------------------------- |
| IFCWALL                 | Mesh     | Wall element                 |
| IFCSLAB                 | Mesh     | Slab/floor element           |
| IFCBEAM                 | Mesh     | Beam element                 |
| IFCWINDOW               | Mesh     | Window element               |
| IFCOPENINGELEMENT       | Mesh     | Opening in wall              |
| IFCCOVERING             | Mesh     | Covering (ceiling, flooring) |
| IFCBUILDINGELEMENTPROXY | Mesh     | Generic building element     |
| IFCFURNITURE            | Mesh     | Furniture item               |
| IFCSANITARYTERMINAL     | Mesh     | Sanitary terminal            |
| IFCTANK                 | Mesh     | Tank                         |
| IFCAIRTERMINAL          | Mesh     | Air terminal                 |
| IFCPROJECT              | Xform    | Root project container       |
| IFCSITE                 | Xform    | Site container               |
| IFCBUILDING             | Xform    | Building container           |
| IFCBUILDINGSTOREY       | Xform    | Building storey/floor        |
| IFCSPACE                | Xform    | Space/room                   |

**Custom Attributes:**

- `custom string ifc:type` - Original IFC class name
- `custom int ifc:id` - IFC entity ID
- `custom int ifc:type_ref` - Reference to type definition

---

## Category 2: Type Definitions

Maps to: `def Scope` in `_Resources` folder

| IFC Class                   | USD Location               | Description            |
| --------------------------- | -------------------------- | ---------------------- |
| IFCWALLTYPE                 | `/_Resources/WallType_*`   | Wall type definition   |
| IFCBEAMTYPE                 | `/_Resources/BeamType_*`   | Beam type definition   |
| IFCSLABTYPE                 | `/_Resources/SlabType_*`   | Slab type definition   |
| IFCWINDOWTYPE               | `/_Resources/WindowType_*` | Window type definition |
| IFCDOORTYPE                 | `/_Resources/DoorType_*`   | Door type definition   |
| IFCBUILDINGELEMENTPROXYTYPE | `/_Resources/ProxyType_*`  | Proxy type definition  |

**Custom Attributes:**

- `custom string ifc:type` - Original IFC class name
- `custom int ifc:id` - IFC entity ID
- `custom string ifc:typedata:*` - Type properties

**Instance Reference:**
Instances reference their types via:

```
custom int ifc:type_ref = <entity_id>
```

---

## Category 3: Properties & Quantities

Maps to: Namespaced USD attributes on owning prims

| IFC Class                  | USD Representation      | Example                                                    |
| -------------------------- | ----------------------- | ---------------------------------------------------------- |
| IFCPROPERTYSET             | Attribute namespace     | `ifc:pset:<SetName>:*`                                     |
| IFCPROPERTYSINGLEVALUE     | String/number attribute | `custom string ifc:pset:Pset_WallCommon:FireRating = "2h"` |
| IFCPROPERTYENUMERATEDVALUE | String attribute        | `custom string ifc:pset:Pset_DoorCommon:FireExit = "TRUE"` |
| IFCCOMPLEXPROPERTY         | Nested dictionary       | Flattened to multiple attributes                           |
| IFCELEMENTQUANTITY         | Attribute namespace     | `ifc:quantity:*`                                           |
| IFCQUANTITYLENGTH          | Double attribute        | `custom double ifc:quantity:Length = 5.0`                  |
| IFCQUANTITYAREA            | Double attribute        | `custom double ifc:quantity:Area = 25.0`                   |
| IFCQUANTITYVOLUME          | Double attribute        | `custom double ifc:quantity:Volume = 12.5`                 |
| IFCPHYSICALCOMPLEXQUANTITY | Nested dictionary       | Flattened to multiple attributes                           |
| IFCRELDEFINESBYPROPERTIES  | Relationship            | Property ownership maintained                              |
| IFCRELDEFINESBYTYPE        | Relationship            | Stored as `ifc:type_ref`                                   |

**Attribute Naming:**

- Property Sets: `custom <type> "ifc:pset:<SetName>:<PropName>" = <value>`
- Quantities: `custom double "ifc:quantity:<QuantityName>" = <value>`

**Common Property Sets:**

- `Pset_WallCommon` - Wall properties (IsExternal, FireRating, etc.)
- `Pset_BeamCommon` - Beam properties
- `Pset_SlabCommon` - Slab properties
- `Pset_DoorCommon` - Door properties
- `Pset_WindowCommon` - Window properties

---

## Category 4: Materials & Styling

Maps to: `def Material` in `/Materials` scope

| IFC Class                      | USD Representation     | Description              |
| ------------------------------ | ---------------------- | ------------------------ |
| IFCMATERIAL                    | `def Material`         | Material definition      |
| IFCMATERIALCONSTITUENT         | Material property      | Material constituent     |
| IFCMATERIALCONSTITUENTSET      | Material property      | Material constituent set |
| IFCRELASSOCIATESMATERIAL       | `rel material:binding` | Material association     |
| IFCSTYLEDITEM                  | Material property      | Styled item              |
| IFCSURFACESTYLERENDERING       | Material property      | Surface rendering style  |
| IFCCOLOURRGBLIST               | Material property      | Color list               |
| IFCINDEXEDCOLOURMAP            | Material property      | Indexed color map        |
| IFCPRESENTATIONLAYERASSIGNMENT | String attribute       | `custom string layer`    |
| IFCSURFACESTYLE                | Material property      | Surface style            |

**Material Binding:**

```
def Material "Concrete"
{
    custom string ifc:material_type = "IFCMATERIAL"
    custom int ifc:id = 12345
    custom string ifc:material:Name = "Concrete"
}

def Mesh "Wall_01"
{
    rel material:binding = </Materials/Concrete>
}
```

---

## Category 5: Geometry Source Data

Maps to: USD Mesh points/indices + metadata attributes

| IFC Class                        | USD Representation        | Description                |
| -------------------------------- | ------------------------- | -------------------------- |
| IFCCARTESIANPOINT                | `point3f[] points`        | Consumed for mesh vertices |
| IFCCARTESIANPOINTLIST3D          | `point3f[] points`        | Consumed for mesh vertices |
| IFCDIRECTION                     | Metadata                  | Direction vector           |
| IFCAXIS2PLACEMENT3D              | Transform                 | Placement transform        |
| IFCLOCALPLACEMENT                | Transform                 | Local placement            |
| IFCSHAPEREPRESENTATION           | Metadata                  | Shape representation type  |
| IFCPRODUCTDEFINITIONSHAPE        | Metadata                  | Product definition         |
| IFCPOLYGONALFACESET              | `int[] faceVertexIndices` | Consumed for mesh faces    |
| IFCINDEXEDPOLYGONALFACE          | `int[] faceVertexIndices` | Consumed for mesh faces    |
| IFCINDEXEDPOLYGONALFACEWITHVOIDS | `int[] faceVertexIndices` | Face with voids            |
| IFCMAPPEDITEM                    | Metadata                  | Mapped item reference      |

**Source Metadata:**

```
def Mesh "Wall_01"
{
    custom string ifc:geometry_source = "IfcPolygonalFaceSet"
    custom string ifc:representation_type = "Tessellation"

    # Actual mesh data
    point3f[] points = [(0, 0, 0), (1, 0, 0), ...]
    int[] faceVertexCounts = [3, 3, 3, ...]
    int[] faceVertexIndices = [0, 1, 2, ...]
}
```

---

## Category 6: Global Context

Maps to: Root layer `customLayerData` dictionary

| IFC Class                  | USD Location       | Description              |
| -------------------------- | ------------------ | ------------------------ |
| IFCOWNERHISTORY            | `ifc:context` dict | Owner history            |
| IFCAPPLICATION             | `ifc:context` dict | Application info         |
| IFCPERSON                  | `ifc:context` dict | Person info              |
| IFCORGANIZATION            | `ifc:context` dict | Organization info        |
| IFCPERSONANDORGANIZATION   | `ifc:context` dict | Person & organization    |
| IFCUNITASSIGNMENT          | `ifc:context` dict | Unit assignments         |
| IFCSIUNIT                  | `ifc:context` dict | SI unit                  |
| IFCCONVERSIONBASEDUNIT     | `ifc:context` dict | Conversion-based unit    |
| IFCDERIVEDUNIT             | `ifc:context` dict | Derived unit             |
| IFCDERIVEDUNITELEMENT      | `ifc:context` dict | Derived unit element     |
| IFCMEASUREWITHUNIT         | `ifc:context` dict | Measure with unit        |
| IFCDIMENSIONALEXPONENTS    | `ifc:context` dict | Dimensional exponents    |
| IFCMONETARYUNIT            | `ifc:context` dict | Monetary unit            |
| IFCCLASSIFICATIONREFERENCE | `ifc:context` dict | Classification reference |

**Root Metadata Structure:**

```
#usda 1.0
(
    customLayerData = {
        dictionary ifc:context = {
            dictionary IFCOWNERHISTORY = {
                int id_12345 = 12345
                string OwningUser_12345 = "Architect"
            }
            dictionary IFCUNITASSIGNMENT = {
                int id_23456 = 23456
                string Units_23456 = "METRIC"
            }
        }
    }
)
```

---

## Relationships

| IFC Relationship                  | USD Representation        |
| --------------------------------- | ------------------------- |
| IFCRELAGGREGATES                  | Parent-child hierarchy    |
| IFCRELCONTAINEDINSPATIALSTRUCTURE | Spatial containment       |
| IFCRELDEFINESBYTYPE               | `custom int ifc:type_ref` |
| IFCRELDEFINESBYPROPERTIES         | Properties on prim        |
| IFCRELASSOCIATESMATERIAL          | `rel material:binding`    |

---

## Unhandled Classes

If an IFC class is not in the master list above, it will be stored in:

```
customLayerData = {
    dictionary ifc:unhandled_data = {
        string note = "Entities not in master class list"
        int count = <number>
    }
}
```

The actual entity data is logged to console for inspection.

---

## Complete Example

**Input IFC Hierarchy:**

```
IfcProject
└── IfcSite
    └── IfcBuilding
        └── IfcBuildingStorey
            ├── IfcWall (references IfcWallType)
            │   ├── IfcPropertySet "Pset_WallCommon"
            │   ├── IfcElementQuantity
            │   └── IfcMaterial "Concrete"
            └── IfcSlab
```

**Output USD Structure:**

```
#usda 1.0
(
    defaultPrim = "IFCModel"
    upAxis = "Z"
    metersPerUnit = 1.0
    customLayerData = {
        dictionary ifc:context = {
            # Global context from IfcProject
        }
    }
)

def Scope "_Resources"
{
    def Scope "StandardWall"
    {
        custom string ifc:type = "IFCWALLTYPE"
        # Type properties
    }
}

def Scope "Materials"
{
    def Material "Concrete"
    {
        custom string ifc:material_type = "IFCMATERIAL"
    }
}

def Xform "IFCModel"
{
    def Xform "Site"
    {
        custom string ifc:type = "IFCSITE"

        def Xform "Building"
        {
            custom string ifc:type = "IFCBUILDING"

            def Xform "Ground_Floor"
            {
                custom string ifc:type = "IFCBUILDINGSTOREY"

                def Mesh "Wall_01"
                {
                    custom string ifc:type = "IFCWALL"
                    custom int ifc:type_ref = 12345
                    rel material:binding = </Materials/Concrete>

                    # Properties
                    custom string "ifc:pset:Pset_WallCommon:IsExternal" = "TRUE"
                    custom double "ifc:quantity:NetVolume" = 12.5

                    # Geometry
                    custom string ifc:geometry_source = "IfcPolygonalFaceSet"
                    point3f[] points = [...]
                    int[] faceVertexIndices = [...]
                }

                def Mesh "Slab_01"
                {
                    custom string ifc:type = "IFCSLAB"
                    # ...
                }
            }
        }
    }
}
```

---

## Best Practices

1. **Preserve IFC IDs** - Always keep `ifc:id` for round-trip capability
2. **Check unhandled data** - Review console for any unprocessed entities
3. **Validate geometry** - Ensure mesh data is correctly generated
4. **Verify hierarchy** - Check spatial structure is preserved
5. **Test properties** - Confirm all property sets are accessible

---

**Last Updated:** February 15, 2026
