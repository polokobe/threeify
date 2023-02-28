import { IDisposable } from '../../core/types';
import { PassGeometry } from '../../geometry/primitives/passGeometry';
import { ShaderMaterial } from '../../materials/ShaderMaterial';
import { BlendState } from '../webgl/BlendState';
import {
  BufferGeometry,
  makeBufferGeometryFromGeometry
} from '../webgl/buffers/BufferGeometry';
import { CullingState } from '../webgl/CullingState';
import { DepthTestState } from '../webgl/DepthTestState';
import { Attachment } from '../webgl/framebuffers/Attachment';
import { Framebuffer } from '../webgl/framebuffers/Framebuffer';
import {
  renderBufferGeometry,
  VirtualFramebuffer
} from '../webgl/framebuffers/VirtualFramebuffer';
import {
  makeProgramFromShaderMaterial,
  Program
} from '../webgl/programs/Program';
import { RenderingContext } from '../webgl/RenderingContext';
import { TexImage2D } from '../webgl/textures/TexImage2D';
import copyFragmentSource from './copy/fragment.glsl';
import copyVertexSource from './copy/vertex.glsl';
import { TextureEncoding } from './TextureEncoding';

export interface ICopyPassProps {
  sourceTexImage2D: TexImage2D;
  sourceEncoding?: TextureEncoding;
  targetFramebuffer?: VirtualFramebuffer;
  targetTexImage2D?: TexImage2D;
  targetEncoding?: TextureEncoding;
}

export class CopyPass implements IDisposable {
  programPromise: Promise<Program>;
  bufferGeometry: BufferGeometry;

  constructor(public readonly context: RenderingContext) {
    this.programPromise = context.programCache.acquireRef('copyPass', () => {
      const material = new ShaderMaterial(
        'copyPass',
        copyVertexSource,
        copyFragmentSource
      );
      return makeProgramFromShaderMaterial(context, material);
    });
    this.bufferGeometry = makeBufferGeometryFromGeometry(context, PassGeometry);
  }

  dispose() {
    this.context.programCache.releaseRef('copyPass');
  }

  async exec(props: ICopyPassProps) {
    const {
      sourceTexImage2D,
      sourceEncoding,
      targetFramebuffer,
      targetTexImage2D,
      targetEncoding
    } = props;
    const { context } = sourceTexImage2D;

    if (targetFramebuffer !== undefined && targetTexImage2D !== undefined) {
      throw new Error('Cannot specify both a target framebuffer and texture.');
    }

    const program = await this.programPromise;

    const uniforms = {
      sourceMap: sourceTexImage2D,
      sourceEncoding:
        sourceEncoding !== undefined ? sourceEncoding : TextureEncoding.Linear,
      targetEncoding:
        targetEncoding !== undefined ? targetEncoding : TextureEncoding.Linear
    };

    let localFramebuffer = targetFramebuffer;
    let tempFramebuffer: Framebuffer | undefined = undefined;

    if (targetFramebuffer === undefined && targetTexImage2D !== undefined) {
      tempFramebuffer = new Framebuffer(context);
      tempFramebuffer.attach(Attachment.Color0, targetTexImage2D);
      localFramebuffer = tempFramebuffer;
    }

    if (localFramebuffer === undefined)
      throw new Error('No target framebuffer or texture specified.');

    renderBufferGeometry({
      framebuffer: localFramebuffer,
      program,
      uniforms,
      bufferGeometry: this.bufferGeometry,
      depthTestState: DepthTestState.None,
      blendState: BlendState.None,
      cullingState: CullingState.None
    });

    if (tempFramebuffer !== undefined) {
      tempFramebuffer.dispose();
    }
  }
}