precision highp float;

in vec2 v_uv0;

uniform sampler2D transmissionTexture;
uniform sampler2D opaqueTexture;
uniform float exposure;

out vec4 outputColor;

#pragma include <color/tonemapping/acesfilmic>
#pragma include <color/spaces/srgb>

void main() {
  
  vec4 transmissionColor = texture(transmissionTexture, v_uv0 );
  vec4 opaqueColor = texture(opaqueTexture, v_uv0 );
  
  vec4 combinedColor = opaqueColor * ( 1. - transmissionColor.a ) + transmissionColor;

  vec3 tonemapped = tonemappingACESFilmic(combinedColor.rgb * exposure);
  vec3 sRGB = linearTosRGB(tonemapped);
  vec3 premultipliedAlpha = sRGB * combinedColor.a;

  outputColor.rgb = premultipliedAlpha;
  outputColor.a = combinedColor.a;
}
