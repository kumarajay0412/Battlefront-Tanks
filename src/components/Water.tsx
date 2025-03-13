import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Water component for creating an ocean-like effect around the battlefield
const Water = ({ 
  position = [0, -0.5, 0], 
  size = 300, 
  resolution = 128,
  color = '#4a95e6', // Sky blue color
  distortionScale = 3.7,
  waveSpeed = 0.5
}: {
  position?: [number, number, number];
  size?: number;
  resolution?: number;
  color?: string;
  distortionScale?: number;
  waveSpeed?: number;
}) => {
  // References for animation
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const timeRef = useRef(0)
  
  // Load water textures
  const [normalMap, dudvMap] = useTexture([
    '/textures/water/waternormals.jpg',
    '/textures/water/waterDudv.jpg'
  ])
  
  // Configure textures
  useEffect(() => {
    if (normalMap && dudvMap) {
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
      dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping
    }
  }, [normalMap, dudvMap])
  
  // Create water shader
  const waterUniforms = useMemo(() => {
    return {
      time: { value: 0 },
      normalSampler: { value: null },
      dudvMap: { value: null },
      color: { value: new THREE.Color(color) },
      distortionScale: { value: distortionScale },
      size: { value: size },
      sunDirection: { value: new THREE.Vector3(5, 1, 8).normalize() }, // Match the sun position from Sky
      sunColor: { value: new THREE.Color('#ffffff') }
    }
  }, [color, distortionScale, size])
  
  // Update shader uniforms
  useEffect(() => {
    if (materialRef.current && normalMap && dudvMap) {
      materialRef.current.uniforms.normalSampler.value = normalMap
      materialRef.current.uniforms.dudvMap.value = dudvMap
    }
  }, [normalMap, dudvMap])
  
  // Animate water
  useFrame((_, delta) => {
    if (materialRef.current) {
      timeRef.current += delta * waveSpeed
      materialRef.current.uniforms.time.value = timeRef.current
    }
  })
  
  // Water vertex shader
  const vertexShader = `
    uniform float size;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  
  // Water fragment shader
  const fragmentShader = `
    uniform float time;
    uniform sampler2D normalSampler;
    uniform sampler2D dudvMap;
    uniform vec3 color;
    uniform float distortionScale;
    uniform vec3 sunDirection;
    uniform vec3 sunColor;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      // Calculate wave movement
      vec2 distortion = texture2D(dudvMap, vec2(vUv.x + time * 0.05, vUv.y)).rg * 0.1;
      distortion = vUv + distortion * distortionScale;
      
      // Get normal from normal map
      vec4 normalColor = texture2D(normalSampler, distortion);
      vec3 normal = vec3(normalColor.r * 2.0 - 1.0, normalColor.b, normalColor.g * 2.0 - 1.0);
      normal = normalize(normal);
      
      // Calculate fresnel effect for edge highlighting
      vec3 viewVector = normalize(cameraPosition - vWorldPosition);
      float fresnel = dot(viewVector, normal);
      fresnel = pow(1.0 - fresnel, 3.0) * 0.5;
      
      // Add wave patterns
      float wave = sin(vPosition.x * 0.05 + time) * 0.05 + 
                  cos(vPosition.z * 0.05 + time * 0.8) * 0.05;
      
      // Combine colors
      vec3 waterColor = color;
      vec3 deepColor = color * 0.5; // Darker version for depth
      vec3 finalColor = mix(deepColor, waterColor, fresnel + wave);
      
      // Add highlights
      finalColor += vec3(fresnel) * 0.3;
      
      // Add sun reflection (specular highlight)
      float specular = pow(max(0.0, dot(reflect(-sunDirection, normal), viewVector)), 100.0);
      finalColor += sunColor * specular * 0.5;
      
      gl_FragColor = vec4(finalColor, 0.8); // Slightly transparent
    }
  `
  
  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={[-Math.PI / 2, 0, 0]} // Flat on XZ plane
      receiveShadow
    >
      <planeGeometry args={[size, size, resolution, resolution]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={waterUniforms}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default Water 