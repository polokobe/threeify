import { makeVec3View } from '../math/arrays/PrimitiveView.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';
import {
  transformNormal3,
  transformPoint3
} from '../math/Vec3Mat4.Functions.js';
import { Attribute, makeFloat32Attribute } from './Attribute.js';
import { AttributeData } from './AttributeData.js';
import { Geometry } from './Geometry.js';

function copyBytesUsingStride(
  dest: ArrayBuffer,
  source: ArrayBuffer,
  bytesPerVertex: number,
  byteStridePerVertex: number,
  attributeOffset: number
): void {
  const destBytes = new Int8Array(dest);
  const sourceBytes = new Int8Array(source);
  const vertexCount = source.byteLength / bytesPerVertex;
  for (let v = 0; v < vertexCount; v++) {
    const sourceOffset = v * bytesPerVertex;
    const destOffset = v * byteStridePerVertex + attributeOffset;
    for (let i = 0; i < bytesPerVertex; i++) {
      destBytes[destOffset + i] = sourceBytes[sourceOffset + i];
    }
  }
}

export function convertToInterleavedGeometry(geometry: Geometry): Geometry {
  let byteStridePerVertex = 0;
  let vertexCount = 0;
  for (const name in geometry.attributes) {
    const attribute = geometry.attributes[name];
    if (attribute !== undefined) {
      byteStridePerVertex += Math.max(attribute.bytesPerVertex, 4);
      vertexCount = attribute.count;
    }
  }
  const interleavedArray = new ArrayBuffer(byteStridePerVertex * vertexCount);
  const interleavedData = new AttributeData(interleavedArray);

  const interleavedGeometry = new Geometry();
  interleavedGeometry.indices = geometry.indices;

  let byteOffset = 0;
  for (const name in geometry.attributes) {
    const attribute = geometry.attributes[name];
    if (attribute !== undefined) {
      copyBytesUsingStride(
        interleavedArray,
        attribute.attributeData.arrayBuffer,
        attribute.bytesPerVertex,
        byteStridePerVertex,
        byteOffset
      );

      interleavedGeometry.attributes[name] = new Attribute(
        interleavedData,
        attribute.componentsPerVertex,
        attribute.componentType,
        byteStridePerVertex,
        byteOffset,
        attribute.normalized
      );
      byteOffset += Math.max(attribute.bytesPerVertex, 4);
    }
  }
  return interleavedGeometry;
}

export function computeVertexNormals(geometry: Geometry): void {
  const indicesAttribute = geometry.indices;
  const { attributes } = geometry;

  const positionAttribute = attributes.position;
  if (positionAttribute === undefined) {
    throw new Error('missing position attribute');
  }
  let normalAttribute = attributes.normal;
  if (normalAttribute === undefined) {
    normalAttribute = makeFloat32Attribute(
      new Float32Array(positionAttribute.count * 3),
      3
    );
    geometry.attributes.normal = normalAttribute;
  }

  // reset existing normals to zero

  const positions = makeVec3View(positionAttribute);
  const normals = makeVec3View(normalAttribute);

  for (let i = 0, il = normals.count; i < il; i++) {
    normals.set(i, new Vec3());
  }

  const pA = new Vec3();
  const pB = new Vec3();
  const pC = new Vec3();
  const cb = new Vec3();
  const ab = new Vec3();

  // indexed elements

  if (indicesAttribute !== undefined) {
    const indices = new Uint32Array(indicesAttribute.attributeData.arrayBuffer);

    for (let i = 0, il = indices.length; i < il; i += 3) {
      const vA = indices[i + 0];
      const vB = indices[i + 1];
      const vC = indices[i + 2];

      positions.get(vA, pA);
      positions.get(vB, pB);
      positions.get(vC, pC);

      cb.copy(pC).sub(pB);
      ab.copy(pA).sub(pB);
      cb.cross(ab);

      normals.add(vA, cb);
      normals.add(vB, cb);
      normals.add(vC, cb);
    }
  } else {
    // non-indexed elements (unconnected triangle soup)

    for (let i = 0, il = positions.count; i < il; i += 3) {
      positions.get(i, pA);
      positions.get(i + 1, pB);
      positions.get(i + 2, pC);

      cb.copy(pC).sub(pB);
      ab.copy(pA).sub(pB);
      cb.cross(ab);

      normals.add(i, cb);
      normals.add(i + 1, cb);
      normals.add(i + 2, cb);
    }
  }

  const v = new Vec3();
  for (let i = 0, il = normals.count; i < il; i += 3) {
    normals.set(i, normals.get(i, v).normalize());
  }
}

export function transformGeometry(geometry: Geometry, m: Mat4): void {
  const positionAttribute = geometry.attributes.position;
  if (positionAttribute === undefined) {
    throw new Error('missing position attribute');
  }
  const positions = makeVec3View(positionAttribute);

  const v = new Vec3();
  for (let i = 0; i < positions.count; i++) {
    positions.get(i, v);
    transformPoint3(v, m, v);
    positions.set(i, v);
  }

  const normalAttribute = geometry.attributes.normal;
  if (normalAttribute !== undefined) {
    const normals = makeVec3View(normalAttribute);
    for (let i = 0; i < normals.count; i++) {
      normals.get(i, v);
      transformNormal3(v, m, v);
      normals.set(i, v);
    }
  }
}
