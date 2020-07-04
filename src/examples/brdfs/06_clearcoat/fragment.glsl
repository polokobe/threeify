precision highp float;

varying vec3 v_viewSurfacePosition;
varying vec3 v_viewSurfaceNormal;
varying vec2 v_uv0;

uniform vec3 pointLightViewPosition;
uniform vec3 pointLightColor;
uniform float pointLightRange;

uniform sampler2D albedoMap;

uniform sampler2D clearCoatBumpMap;


#pragma include <brdfs/common>
#pragma include <lighting/punctual>
#pragma include <brdfs/ambient/basic>
#pragma include <brdfs/diffuse/lambert>
#pragma include <brdfs/specular/ggx>
#pragma include <color/spaces/srgb>

void main() {

  vec3 ambient = vec3(0.);
  vec3 albedo = sRGBToLinear( texture2D( albedoMap, v_uv0 ).rgb );
  vec3 specular = vec3(0.15);
  float specularRoughness = 0.25;
  vec3 clearCoatF0 = vec3( 1. );
  float clearCoatRoughness = 0.1;
  vec3 specularF0 = ( specular * specular ) * 0.16;

  Surface surface;
  surface.position = v_viewSurfacePosition;
  surface.normal = normalize( v_viewSurfaceNormal );
  surface.viewDirection = normalize( -v_viewSurfacePosition );

  uvToTangentFrame( surface, v_uv0 );

  Surface clearCoatSurface = surface;
  perturbSurfaceNormal_BumpMap( clearCoatSurface, clearCoatBumpMap, v_uv0 * 1., 1. );

  PunctualLight punctualLight;
  punctualLight.position = pointLightViewPosition;
  punctualLight.color = pointLightColor;
  punctualLight.range = pointLightRange;

  DirectIllumination directIllumination;
  pointLightToDirectIllumination( surface, punctualLight, directIllumination );

  vec3 lightDirection = directIllumination.lightDirection;
  vec3 irradiance = directIllumination.color * saturate( dot( surface.normal, lightDirection ) );

  vec3 outputColor;
  outputColor += irradiance * BRDF_Specular_GGX( clearCoatSurface, lightDirection, clearCoatF0, clearCoatRoughness );
  outputColor += irradiance * BRDF_Specular_GGX( surface, lightDirection, specularF0, specularRoughness );
  outputColor += ( irradiance + ambient ) * BRDF_Diffuse_Lambert( albedo );

  gl_FragColor.rgb = linearTosRGB( outputColor );
  gl_FragColor.a = 1.;

}
