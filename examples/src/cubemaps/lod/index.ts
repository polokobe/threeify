import {
  convertToInterleavedGeometry,
  CubeMapTexture,
  fetchCubeImages,
  icosahedronGeometry,
  makeBufferGeometryFromGeometry,
  makeProgramFromShaderMaterial,
  makeTexImage2DFromTexture,
  renderBufferGeometry,
  RenderingContext,
  ShaderMaterial
} from '@threeify/core';
import {
  Euler3,
  euler3ToMat4,
  Mat4,
  mat4PerspectiveFov,
  translation3ToMat4,
  Vec3
} from '@threeify/vector-math';

import fragmentSource from './fragment.glsl';
import vertexSource from './vertex.glsl';

async function init(): Promise<void> {
  const geometry = convertToInterleavedGeometry(
    icosahedronGeometry(0.75, 2, true)
  );
  const material = new ShaderMaterial(vertexSource, fragmentSource);
  const cubeTexture = new CubeMapTexture(
    await fetchCubeImages('/assets/textures/cube/pisa/*.png')
  );

  const context = new RenderingContext(
    document.getElementById('framebuffer') as HTMLCanvasElement
  );
  const { canvasFramebuffer } = context;
  window.addEventListener('resize', () => canvasFramebuffer.resize());

  const program = makeProgramFromShaderMaterial(context, material);
  const cubeMap = makeTexImage2DFromTexture(context, cubeTexture);
  const uniforms = {
    localToWorld: new Mat4(),
    worldToView: translation3ToMat4(new Vec3(0, 0, -3)),
    viewToScreen: mat4PerspectiveFov(
      25,
      0.1,
      4,
      1,
      canvasFramebuffer.aspectRatio
    ),
    perceptualRoughness: 0,
    mipCount: cubeTexture.mipCount,
    cubeMap: cubeMap
  };

  const bufferGeometry = makeBufferGeometryFromGeometry(context, geometry);

  function animate(): void {
    const now = Date.now();
    uniforms.localToWorld = euler3ToMat4(
      new Euler3(now * 0.0001, now * 0.00033, now * 0.000077),
      uniforms.localToWorld
    );
    uniforms.perceptualRoughness = Math.sin(now * 0.001) * 0.5 + 0.5;
    renderBufferGeometry({
      framebuffer: canvasFramebuffer,
      program,
      uniforms,
      bufferGeometry
    });

    requestAnimationFrame(animate);
  }

  animate();
}

init();
