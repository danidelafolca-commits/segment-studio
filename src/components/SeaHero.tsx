'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SeaHeroProps {
  className?: string;
  cameraZ?: number;
  planeSize?: number;
  speed?: number;
}

const vertexShader = /* glsl */ `
  #define GLSLIFY 1
  attribute vec3 position;
  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;
  uniform float time;
  varying vec3 vPosition;

  mat4 rotateMatrixX(float radian) {
    return mat4(
      1.0, 0.0, 0.0, 0.0,
      0.0, cos(radian), -sin(radian), 0.0,
      0.0, sin(radian), cos(radian), 0.0,
      0.0, 0.0, 0.0, 1.0
    );
  }

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }

  void main(void) {
    // Lay the plane flat (becomes the sea surface in the XZ plane).
    vec3 updatePosition = (rotateMatrixX(radians(90.0)) * vec4(position, 1.0)).xyz;
    // Scroll the noise field toward the camera over time = rolling swell.
    vec3 noisePosition = updatePosition + vec3(0.0, 0.0, time * -28.0);
    float n1 = cnoise(noisePosition * 0.035);
    float n2 = cnoise(noisePosition * 0.085);
    float n3 = cnoise(noisePosition * 0.22);
    // Uniform rolling waves (no canyon walls).
    float h = n1 * 9.0 + n2 * 4.0 + n3 * 1.6;
    vec3 lastPosition = updatePosition + vec3(0.0, h, 0.0);

    vPosition = lastPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(lastPosition, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  #define GLSLIFY 1
  varying vec3 vPosition;

  void main(void) {
    // Fade the far edge into the page background (horizon haze).
    float fog = clamp((vPosition.z + 90.0) / 210.0, 0.0, 1.0);
    // Wave crests glow brighter / lighter than troughs.
    float crest = clamp((vPosition.y + 9.0) / 22.0, 0.0, 1.0);
    vec3 deep = vec3(0.012, 0.105, 0.205); // navy-teal trough
    vec3 high = vec3(0.122, 0.776, 0.741); // teal/ice crest
    vec3 color = mix(deep, high, crest);
    float opacity = fog * (0.16 + crest * 0.6);
    gl_FragColor = vec4(color, opacity);
  }
`;

export default function SeaHero({
  className,
  cameraZ = 120,
  planeSize = 256,
  speed = 0.5,
}: SeaHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    camera.position.set(0, 14, cameraZ);
    camera.lookAt(new THREE.Vector3(0, 7, 0));

    const clock = new THREE.Clock();
    const uniforms = { time: { value: 0 } };
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, planeSize, planeSize);
    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    window.addEventListener('resize', resize);

    // Pause the render loop while the hero is off-screen.
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    io.observe(container);

    let rafId = 0;
    let disposed = false;
    const loop = () => {
      if (disposed) return;
      const delta = clock.getDelta();
      if (visible) {
        uniforms.time.value += delta * speed;
        renderer.render(scene, camera);
      }
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      io.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [cameraZ, planeSize, speed]);

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
