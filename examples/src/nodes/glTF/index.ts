import {
  ClearState,
  Orbit,
  RenderingContext,
  ShaderMaterial
} from '@threeify/core';
import {
  glTFToSceneNode,
  PerspectiveCamera,
  PointLight,
  renderScene,
  SceneNode,
  SceneTreeCache,
  subTreeStats,
  updateDirtyNodes,
  updateNodeTree,
  updateRenderCache
} from '@threeify/scene';
import {
  box3Center,
  box3MaxSize,
  Color3,
  Vec3,
  vec3Negate
} from '@threeify/vector-math';

import { getGLTFUrl, GLTFFormat, GLTFModel } from '../../ExampleModels';
import fragmentSource from './fragment.glsl';
import vertexSource from './vertex.glsl';

//const stats = new Stats();

async function init(): Promise<void> {
  const shaderMaterial = new ShaderMaterial(vertexSource, fragmentSource);
  const canvasHtmlElement = document.getElementById(
    'framebuffer'
  ) as HTMLCanvasElement;
  const context = new RenderingContext(canvasHtmlElement);
  const { canvasFramebuffer } = context;
  window.addEventListener('resize', () => canvasFramebuffer.resize());

  const orbitController = new Orbit(canvasHtmlElement);
  orbitController.zoom = 0.8;

  const sceneTreeCache = new SceneTreeCache();

  const root = new SceneNode({ name: 'root' });
  const glTFModel = await glTFToSceneNode(
    getGLTFUrl(GLTFModel.GlamVelvetSofa, GLTFFormat.glTF)
  );

  updateNodeTree(glTFModel, sceneTreeCache);

  const glTFBoundingBox = glTFModel.subTreeBoundingBox;
  glTFModel.translation = vec3Negate(box3Center(glTFBoundingBox));
  glTFModel.dirty();
  const maxSize = box3MaxSize(glTFBoundingBox);
  const lightIntensity = 25;
  const orbitNode = new SceneNode({
    name: 'orbit',
    translation: new Vec3(0, 0, -2),
    scale: new Vec3(1 / maxSize, 1 / maxSize, 1 / maxSize)
  });
  orbitNode.children.push(glTFModel);
  root.children.push(orbitNode);
  const pointLight1 = new PointLight({
    name: 'PointLight1',
    translation: new Vec3(5, 0, 0),
    color: new Color3(0.6, 0.8, 1),
    intensity: lightIntensity,
    range: 1000
  });
  root.children.push(pointLight1);
  const pointLight2 = new PointLight({
    name: 'PointLight2',
    translation: new Vec3(-5, 0, 0),
    color: new Color3(1, 0.9, 0.7),
    intensity: lightIntensity,
    range: 1000
  });
  root.children.push(pointLight2);
  const pointLight3 = new PointLight({
    name: 'PointLight3',
    translation: new Vec3(0, 5, 0),
    color: new Color3(0.8, 1, 0.7),
    intensity: lightIntensity,
    range: 1000
  });
  root.children.push(pointLight3);
  const camera = new PerspectiveCamera({
    name: 'Camera',
    verticalFov: 25,
    near: 0.1,
    far: 1000,
    translation: new Vec3(0, 0, 0)
  });
  root.children.push(camera);

  updateNodeTree(root, sceneTreeCache);

  const treeStats = subTreeStats(root);

  console.log(`Subtree stats: ${JSON.stringify(treeStats, null, 2)}`);

  const renderCache = updateRenderCache(
    context,
    root,
    camera,
    () => {
      return shaderMaterial;
    },
    sceneTreeCache
  );

  canvasFramebuffer.devicePixelRatio = window.devicePixelRatio;
  canvasFramebuffer.clearState = new ClearState(new Color3(1, 1, 1));

  function animate(): void {
    requestAnimationFrame(animate);

    // stats.time(() => {
    canvasFramebuffer.clear();

    orbitController.update();
    orbitNode.rotation = orbitController.rotation;
    camera.zoom = orbitController.zoom;
    camera.dirty();
    orbitNode.dirty();

    updateNodeTree(root, sceneTreeCache); // this is by far the slowest part of the system.
    updateDirtyNodes(sceneTreeCache, renderCache, canvasFramebuffer);
    renderScene(canvasFramebuffer, renderCache);
    //});
  }

  animate();
}

init();
