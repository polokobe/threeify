//
// based on PlaneGeometry from Three.js
//
// Authors:
// * @bhouston
//

import { Vec2 } from '@threeify/vector-math';

import { makeFloat32Attribute, makeUint32Attribute } from '../Attribute.js';
import { Geometry } from '../Geometry.js';

/**
 * A 2D pass geometry
 *
 * @param min in clip space
 * @param max in clip space
 */
export function passGeometry(
  min = new Vec2(-1, -1),
  max = new Vec2(1, 1)
): Geometry {
  const geometry = new Geometry();
  geometry.indices = makeUint32Attribute([0, 2, 1, 0, 3, 2]);

  // in clip space: starts at bottom left, goes CW to top left, top right, bottom right.
  geometry.attributes.position = makeFloat32Attribute(
    [min.x, min.y, min.x, max.y, max.x, max.y, max.x, min.y],
    2
  );

  // texture space is not the same as clip space.  Thus this goes to the same locations but it has different
  // values
  geometry.attributes.uv0 = makeFloat32Attribute([0, 1, 0, 0, 1, 0, 1, 1], 2);

  // because -z points forward, the normals for this to point towards would have to be +z.
  geometry.attributes.normal = makeFloat32Attribute(
    [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    3
  );

  return geometry;
}
