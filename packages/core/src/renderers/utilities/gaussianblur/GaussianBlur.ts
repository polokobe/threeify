import { Vec2, vec2Equals, vec2ToString } from '@threeify/math';

import { assert } from '../../../core/assert';
import { using } from '../../../core/using';
import { ShaderMaterial } from '../../../materials/ShaderMaterial';
import { BlendState } from '../../webgl/BlendState';
import {
  colorAttachmentToFramebuffer,
  Framebuffer
} from '../../webgl/framebuffers/Framebuffer';
import { renderPass } from '../../webgl/framebuffers/VirtualFramebuffer';
import { shaderMaterialToProgram } from '../../webgl/programs/Program';
import { RenderingContext } from '../../webgl/RenderingContext';
import { TexImage2D } from '../../webgl/textures/TexImage2D';
import { IEffect } from '../IEffect';
import fragmentSource from './fragment.glsl';
import vertexSource from './vertex.glsl';

export interface IGaussianBlurProps {
  sourceTexImage2D: TexImage2D;
  sourceLod: number;
  standardDeviationInTexels: number;
  tempTexImage2D: TexImage2D;
  targetFramebuffer: Framebuffer;
  targetAlpha: number;
}

export interface GaussianBlur extends IEffect {
  exec(props: IGaussianBlurProps): void;
}

export async function createGaussianBlur(
  context: RenderingContext
): Promise<GaussianBlur> {
  const programRef = context.programCache.acquireRef('gaussianBlur', (name) => {
    const material = new ShaderMaterial(name, vertexSource, fragmentSource);
    return shaderMaterialToProgram(context, material);
  });
  const program = await programRef.promise;

  return {
    exec: (
      props = {
        sourceLod: 0,
        standardDeviationInTexels: 3,
        targetAlpha: 1
      } as IGaussianBlurProps
    ) => {
      const {
        sourceTexImage2D,
        sourceLod,
        standardDeviationInTexels,
        tempTexImage2D,
        targetFramebuffer,
        targetAlpha
      } = props;

      assert(sourceLod >= 0);
      assert(standardDeviationInTexels >= 0);
      assert(
        vec2Equals(tempTexImage2D.size, targetFramebuffer.size),
        `Temp texture size ${vec2ToString(
          tempTexImage2D.size
        )} does not match target size ${vec2ToString(targetFramebuffer.size)}.`
      );
      assert(0 <= targetAlpha && targetAlpha <= 1);

      const uniforms = {
        sourceMap: sourceTexImage2D,
        sourceLod,
        standardDeviationInTexels:
          standardDeviationInTexels / Math.pow(2, sourceLod),
        kernelRadiusInTexels: Math.ceil(standardDeviationInTexels * 3),
        blurDirection: new Vec2(1, 0),
        targetAlpha: 1
      };

      using(colorAttachmentToFramebuffer(tempTexImage2D), (tempFramebuffer) => {
        renderPass({
          framebuffer: tempFramebuffer,
          program,
          uniforms
        });
      });

      uniforms.blurDirection.set(0, 1);
      uniforms.sourceMap = tempTexImage2D;
      uniforms.targetAlpha = targetAlpha;

      if (sourceLod > 0) {
        tempTexImage2D.generateMipmaps();
      }

      renderPass({
        framebuffer: targetFramebuffer,
        program,
        uniforms,
        blendState:
          targetAlpha < 1 ? BlendState.PremultipliedOver : BlendState.None
      });
    },

    dispose: () => {
      programRef.dispose();
    }
  };
}
