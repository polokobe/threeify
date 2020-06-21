import { Float32Attribute } from "../../../lib/geometry/Attribute";
import { Geometry } from "../../../lib/geometry/Geometry";
import { convertToInterleavedGeometry } from "../../../lib/geometry/Geometry.Functions";
import { ShaderMaterial } from "../../../lib/materials/ShaderMaterial";
import { BufferGeometry } from "../../../lib/renderers/webgl2/buffers/BufferGeometry";
import { Program } from "../../../lib/renderers/webgl2/programs/Program";
import { RenderingContext } from "../../../lib/renderers/webgl2/RenderingContext";
import fragmentSourceCode from "./fragment.glsl";
import vertexSourceCode from "./vertex.glsl";

let geometry = new Geometry();
geometry.attributes["position"] = new Float32Attribute([0, 0.5, 0.5, -0.5, -0.5, -0.5], 2);
geometry.attributes["color"] = new Float32Attribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3);

console.log("geometry", geometry);
geometry = convertToInterleavedGeometry(geometry);
console.log("interleaved", geometry);

const material = new ShaderMaterial(vertexSourceCode, fragmentSourceCode);

const context = new RenderingContext();
const canvasFramebuffer = context.canvasFramebuffer;
document.body.appendChild(canvasFramebuffer.canvas);

const bufferGeometry = new BufferGeometry(context, geometry);
const program = new Program(context, material);
const uniforms = {};

canvasFramebuffer.renderBufferGeometry(program, uniforms, bufferGeometry);
