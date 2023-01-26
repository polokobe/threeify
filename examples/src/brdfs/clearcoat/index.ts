import {
  Color3,
  color3MultiplyByScalar,
  Euler3,
  euler3ToMat4,
  EulerOrder3,
  fetchImage,
  icosahedronGeometry,
  makeBufferGeometryFromGeometry,
  makeProgramFromShaderMaterial,
  makeTexImage2DFromTexture,
  Mat4,
  mat4PerspectiveFov,
  renderBufferGeometry,
  RenderingContext,
  ShaderMaterial,
  Texture,
  TextureBindings,
  translation3ToMat4,
  Vec3
} from '@threeify/core';

import fragmentSource from './fragment.glsl';
import vertexSource from './vertex.glsl';

async function init(): Promise<void> {
  const geometry = icosahedronGeometry(0.75, 5, true);
  const material = new ShaderMaterial(vertexSource, fragmentSource);
  const texture = new Texture(
    await fetchImage('/assets/textures/planets/jupiter_2k.jpg')
  );
  const scratchesTexture = new Texture(
    await fetchImage('/assets/textures/golfball/scratches.png')
  );

  const context = new RenderingContext(
    document.getElementById('framebuffer') as HTMLCanvasElement
  );
  const { canvasFramebuffer } = context;
  window.addEventListener('resize', () => canvasFramebuffer.resize());

  const albedoMap = makeTexImage2DFromTexture(context, texture);
  const clearCoatBumpMap = makeTexImage2DFromTexture(context, scratchesTexture);
  const specularRoughnessMap = clearCoatBumpMap;
  const clearCoatRoughnessMap = specularRoughnessMap;

  const textureBindings = new TextureBindings();

  const program = makeProgramFromShaderMaterial(context, material);
  const uniforms = {
    // vertices
    localToWorld: new Mat4(),
    worldToView: translation3ToMat4(new Vec3(0, 0, -3)),
    viewToScreen: mat4PerspectiveFov(
      25,
      0.1,
      4,
      1,
      canvasFramebuffer.aspectRatio
    ),

    // lights
    pointLightViewPosition: new Vec3(0, 0, 0),
    pointLightIntensity: color3MultiplyByScalar(new Color3(1, 1, 1), 30),
    pointLightRange: 6,

    // materials
    albedoColor: new Color3(0.9, 0.9, 0.9),
    albedoMap: textureBindings.bind(albedoMap),

    specularRoughnessFactor: 0.5,
    specularRoughnessMap: textureBindings.bind(specularRoughnessMap),

    clearCoatStrength: 0.5,
    clearCoatTint: new Color3(1, 1, 1),

    clearCoatBumpMap: textureBindings.bind(clearCoatBumpMap),

    clearCoatRoughnessFactor: 0.1,
    clearCoatRoughnessMap: textureBindings.bind(clearCoatRoughnessMap)
  };
  const bufferGeometry = makeBufferGeometryFromGeometry(context, geometry);

  function animate(): void {
    const now = Date.now();

    uniforms.localToWorld = euler3ToMat4(
      new Euler3(0.15 * Math.PI, now * 0.0002, 0, EulerOrder3.XZY),
      uniforms.localToWorld
    );
    uniforms.pointLightViewPosition = new Vec3(
      Math.cos(now * 0.001) * 3,
      2,
      0.5
    );

    canvasFramebuffer.clear();
    renderBufferGeometry({
      framebuffer: canvasFramebuffer,
      program,
      uniforms,
      bufferGeometry,
      textureBindings
    });

    requestAnimationFrame(animate);
  }

  animate();
}

init();
