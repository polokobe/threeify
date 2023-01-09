import {
  DepthTestFunc,
  DepthTestState,
  fetchImage,
  icosahedronGeometry,
  makeBufferGeometryFromGeometry,
  makeMat4PerspectiveFov,
  makeMat4Translation,
  makeProgramFromShaderMaterial,
  makeTexImage2DFromEquirectangularTexture,
  Mat4,
  renderBufferGeometry,
  RenderingContext,
  ShaderMaterial,
  Texture,
  Vec3,
  Vec2
} from '../../../lib/index.js';
import fragmentSource from './fragment.glsl';
import vertexSource from './vertex.glsl';

async function init(): Promise<null> {
  const debugTexture = new Texture(
    await fetchImage('/assets/textures/cube/debug/latLong.png')
  );

  const geometry = icosahedronGeometry(0.75, 4);
  const material = new ShaderMaterial(vertexSource, fragmentSource);

  const context = new RenderingContext(
    document.getElementById('framebuffer') as HTMLCanvasElement
  );
  const { canvasFramebuffer } = context;
  window.addEventListener('resize', () => canvasFramebuffer.resize());

  const cubeMap = makeTexImage2DFromEquirectangularTexture(
    context,
    debugTexture,
    new Vec2(1024, 1024)
  );

  const program = makeProgramFromShaderMaterial(context, material);
  const uniforms = {
    localToWorld: new Mat4(),
    worldToView: makeMat4Translation(new Vec3(0, 0, -3)),
    viewToScreen: makeMat4PerspectiveFov(
      25,
      0.1,
      4,
      1,
      canvasFramebuffer.aspectRatio
    ),
    cubeMap,
    mipCount: cubeMap.mipCount,
    perceptualRoughness: 0
  };
  const bufferGeometry = makeBufferGeometryFromGeometry(context, geometry);
  const depthTestState = new DepthTestState(true, DepthTestFunc.Less);

  function animate(): void {
    requestAnimationFrame(animate);
    const now = Date.now();

    /* uniforms.localToWorld = makeMat4RotationFromEuler(
      new Euler3(now * 0.0001, now * 0.00033, now * 0.000077),
      uniforms.localToWorld,
    ); */
    uniforms.perceptualRoughness = Math.sin(now * 0.001) * 0.5 + 0.5;

    renderBufferGeometry(
      canvasFramebuffer,
      program,
      uniforms,
      bufferGeometry,
      depthTestState
    );
  }

  animate();

  return null;
}

init();
