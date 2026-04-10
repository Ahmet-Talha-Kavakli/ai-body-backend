import * as THREE from 'three';

const VERTEX_SHADER = `
  attribute float severity;
  varying float vSeverity;
  varying vec3 vPosition;

  void main() {
    vSeverity = severity;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float time;
  uniform float pulseIntensity;
  uniform float pulseSpeed;
  varying float vSeverity;
  varying vec3 vPosition;

  vec3 getSeverityColor(float severity) {
    vec3 color;
    if (severity < 0.2) {
      color = vec3(0.0, 1.0, 0.0);
    } else if (severity < 0.5) {
      float t = (severity - 0.2) / 0.3;
      color = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), t);
    } else if (severity < 0.8) {
      float t = (severity - 0.5) / 0.3;
      color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.65, 0.0), t);
    } else {
      float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
      float intensity = 1.0 + (pulse * pulseIntensity);
      color = vec3(1.0, 0.0, 0.0) * intensity;
    }
    return color;
  }

  void main() {
    vec3 color = getSeverityColor(vSeverity);
    float glow = vSeverity * 0.3;
    color += glow;
    gl_FragColor = vec4(color, 0.8);
  }
`;

export interface HeatMapUniforms extends THREE.IUniform {
  severity: THREE.IUniform<number>;
  time: THREE.IUniform<number>;
  pulseIntensity: THREE.IUniform<number>;
  pulseSpeed: THREE.IUniform<number>;
}

export function createHeatMapShader(): THREE.ShaderMaterial {
  const uniforms: Record<string, THREE.IUniform> = {
    severity: { value: 0.0 },
    time: { value: 0.0 },
    pulseIntensity: { value: 0.5 },
    pulseSpeed: { value: 2.0 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: THREE.DoubleSide,
    transparent: true,
  });
}

export function updateHeatMapSeverity(
  material: THREE.ShaderMaterial,
  geometryGroup: THREE.Mesh,
  severity: number
): void {
  const clampedSeverity = Math.max(0, Math.min(1, severity));
  if (material.uniforms.severity) {
    material.uniforms.severity.value = clampedSeverity;
  }
}

export function getColorForSeverity(severity: number): THREE.Color {
  severity = Math.max(0, Math.min(1, severity));
  if (severity < 0.2) return new THREE.Color(0x00ff00);
  if (severity < 0.5) {
    const t = (severity - 0.2) / 0.3;
    return new THREE.Color().lerpColors(new THREE.Color(0x00ff00), new THREE.Color(0xffff00), t);
  }
  if (severity < 0.8) {
    const t = (severity - 0.5) / 0.3;
    return new THREE.Color().lerpColors(new THREE.Color(0xffff00), new THREE.Color(0xffa500), t);
  }
  return new THREE.Color(0xff0000);
}

export function updateShaderTime(material: THREE.ShaderMaterial, elapsed: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value = elapsed;
  }
}
