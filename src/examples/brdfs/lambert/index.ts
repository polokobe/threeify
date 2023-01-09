import {
  BufferBit,
  ClearState,
  Color3,
  CullingState,
  DepthTestFunc,
  DepthTestState,
  Euler3,
  EulerOrder3,
  fetchImage,
  icosahedronGeometry,
  makeBufferGeometryFromGeometry,
  makeMat4PerspectiveFov,
  makeMat4RotationFromEuler,
  makeMat4Translation,
  makeProgramFromShaderMaterial,
  makeTexImage2DFromTexture,
  Mat4,
  renderBufferGeometry,
  RenderingContext,
  ShaderMaterial,
  Texture,
  Vec3
} from '../../../lib/index.js';
import fragmentSource from './fragment.glsl';
import vertexSource from './vertex.glsl';

async function init(): Promise<null> {
  const geometry = icosahedronGeometry(0.75, 5);
  const material = new ShaderMaterial(vertexSource, fragmentSource);
  const texture = new Texture(
    await fetchImage('/assets/textures/planets/jupiter_2k.jpg')
  );

  const context = new RenderingContext(
    document.getElementById('framebuffer') as HTMLCanvasElement
  );
  const { canvasFramebuffer } = context;
  window.addEventListener('resize', () => canvasFramebuffer.resize());

  const program = makeProgramFromShaderMaterial(context, material);
  const uniforms = {
    // vertices
    localToWorld: new Mat4(),
    worldToView: makeMat4Translation(new Vec3(0, 0, -3)),
    viewToScreen: makeMat4PerspectiveFov(
      25,
      0.1,
      4,
      1,
      canvasFramebuffer.aspectRatio
    ),

    // lights
    pointLightViewPosition: new Vec3(1, 0, -0.5),
    pointLightIntensity: new Color3(1, 1, 1).multiplyByScalar(40),
    pointLightRange: 6,

    // materials
    albedoModulator: new Vec3(1, 1, 1),
    albedoMap: makeTexImage2DFromTexture(context, texture)
  };
  const bufferGeometry = makeBufferGeometryFromGeometry(context, geometry);
  canvasFramebuffer.depthTestState = new DepthTestState(
    true,
    DepthTestFunc.Less
  );
  canvasFramebuffer.clearState = new ClearState(new Vec3(0, 0, 0), 1);
  canvasFramebuffer.cullingState = new CullingState(true);

  function animate(): void {
    const now = Date.now();

    uniforms.localToWorld = makeMat4RotationFromEuler(
      new Euler3(0.15 * Math.PI, now * 0.0002, 0, EulerOrder3.XZY),
      uniforms.localToWorld
    );
    uniforms.viewToScreen = makeMat4PerspectiveFov(
      25,
      0.1,
      4,
      1,
      canvasFramebuffer.aspectRatio
    );
    uniforms.pointLightViewPosition = new Vec3(
      Math.cos(now * 0.001) * 3,
      2,
      0.5
    );

    canvasFramebuffer.clear(BufferBit.All);

    renderBufferGeometry(canvasFramebuffer, program, uniforms, bufferGeometry);

    requestAnimationFrame(animate);
  }

  animate();

  return null;
}

init();
