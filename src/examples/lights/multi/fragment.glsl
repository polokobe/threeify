precision highp float;

in vec3 v_viewSurfacePosition;
in vec3 v_viewSurfaceNormal;
in vec2 v_uv0;

#define MAX_PUNCTUAL_LIGHTS (4)
uniform int numPunctualLights;
uniform int punctualLightType[MAX_PUNCTUAL_LIGHTS];
uniform vec3 punctualLightViewPosition[MAX_PUNCTUAL_LIGHTS];
uniform vec3 punctualLightViewDirection[MAX_PUNCTUAL_LIGHTS];
uniform vec3 punctualLightColor[MAX_PUNCTUAL_LIGHTS];
uniform float punctualLightRange[MAX_PUNCTUAL_LIGHTS];
uniform float punctualLightInnerCos[MAX_PUNCTUAL_LIGHTS];
uniform float punctualLightOuterCos[MAX_PUNCTUAL_LIGHTS];

uniform sampler2D albedoMap;

out vec4 outputColor;

#pragma include <lighting/punctual>
#pragma include <brdfs/ambient/basic>
#pragma include <brdfs/diffuse/lambert>
#pragma include <brdfs/specular/ggx>
#pragma include <color/spaces/srgb>
#pragma include <normals/normalPacking>
#pragma include <normals/tangentSpace>

void main() {
  vec3 albedo = sRGBToLinear(texture(albedoMap, v_uv0).rgb);
  vec3 specular = vec3(0.5);
  float specularRoughness = 0.25;
  vec3 specularF0 = specularIntensityToF0(specular);

  vec3 position = v_viewSurfacePosition;
  vec3 normal = normalize(v_viewSurfaceNormal);
  vec3 viewDirection = normalize(-v_viewSurfacePosition);

  mat3 tangentToView = tangentToViewFromPositionNormalUV(position, normal, v_uv0);
  normal = tangentToView[2];

  vec3 outgoingRadiance;

  for(int i = 0; i < MAX_PUNCTUAL_LIGHTS; i++) {
    if(i >= numPunctualLights)
      break;

    PunctualLight punctualLight;
    punctualLight.type = punctualLightType[i];
    punctualLight.position = mat4TransformPosition(worldToView, vec3(0., 0., 2)); // punctualLightWorldPosition[i] );
    punctualLight.direction = mat4TransformDirection(worldToView, punctualLightWorldDirection[i]);
    punctualLight.intensity = punctualLightColor[i];
    punctualLight.range = punctualLightRange[i];
    punctualLight.innerConeCos = punctualLightInnerCos[i];
    punctualLight.outerConeCos = punctualLightOuterCos[i];

    DirectLight directLight = punctualLightToDirectLight(position, punctualLight);

    float dotNL = saturate(dot(directLight.direction, normal));

    outgoingRadiance += directLight.radiance *
      dotNL *
      BRDF_Specular_GGX(normal, viewDirection, directLight.direction, specularF0, specularRoughness);
    outgoingRadiance += directLight.radiance * dotNL * BRDF_Diffuse_Lambert(albedo);

  }

  outputColor.rgb = linearTosRGB(outgoingRadiance);
  outputColor.a = 1.0;

}
