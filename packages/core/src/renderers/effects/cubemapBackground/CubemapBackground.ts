import { Mat4 } from '@threeify/math';

import { assert } from '../../../core/assert';
import { ShaderMaterial } from '../../../materials/ShaderMaterial';
import { DepthTestState } from '../../webgl/DepthTestState';
import {
  renderPass,
  VirtualFramebuffer
} from '../../webgl/framebuffers/VirtualFramebuffer';
import { shaderMaterialToProgram } from '../../webgl/programs/Program';
import { RenderingContext } from '../../webgl/RenderingContext';
import { TexImage2D } from '../../webgl/textures/TexImage2D';
import { IEffect } from '../IEffect';
import fragmentSource from './fragment.glsl';
import vertexSource from './vertex.glsl';

export interface ICubemapBackgroundProps {
  cubeMapTexImage2D: TexImage2D;
  cubeMapIntensity: number;
  viewToWorld: Mat4;
  clipToView: Mat4;
  targetFramebuffer: VirtualFramebuffer;
}

export interface CubemapBackground extends IEffect {
  exec(props: ICubemapBackgroundProps): void;
}

export async function createCubemapBackground(
  context: RenderingContext
): Promise<CubemapBackground> {
  const programRef = context.programCache.acquireRef(
    'cubemapBackground',
    (name) => {
      const material = new ShaderMaterial(name, vertexSource, fragmentSource);
      return shaderMaterialToProgram(context, material);
    }
  );
  const program = await programRef.promise;

  return {
    exec: (props: ICubemapBackgroundProps) => {
      const {
        cubeMapTexImage2D,
        cubeMapIntensity,
        targetFramebuffer,
        viewToWorld,
        clipToView
      } = props;

      assert(cubeMapIntensity > 0);

      const uniforms = {
        cubeMap: cubeMapTexImage2D,
        cubeMapIntensity,
        viewToWorld,
        clipToView
      };

      renderPass({
        framebuffer: targetFramebuffer,
        program,
        uniforms,
        depthTestState: DepthTestState.Less
      });
    },
    dispose: () => {
      programRef.dispose();
    }
  };
}