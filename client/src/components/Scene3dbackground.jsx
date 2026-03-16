// Scene3DBackground.jsx
// npm install three @react-three/fiber

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── PALETTE matched to reference image ──────────────────────────────────────
const P = {
  wallBeige: '#c8b89a',
  wallSide: '#b8a888',
  ceiling: '#d8ccb8',
  floorWalnut: '#3a1f08',
  floorMid: '#5a3010',
  sofaBlue: '#1e4a9a',
  sofaMid: '#2558b8',
  sofaHighlight: '#3a6ecc',
  cushionOrange: '#d45820',
  cushionGreen: '#4a7830',
  cushionStripe: '#c03030',
  cushionPink: '#c04888',
  tableWalnut: '#5c2e08',
  tableLegLight: '#7a4018',
  rugRed: '#a82018',
  rugBlue: '#1e3a8a',
  rugCream: '#c8a858',
  rugDark: '#8a3010',
  curtainGreen: '#5a7840',
  curtainLight: '#7a9858',
  curtainDark: '#3a5028',
  windowFrame: '#e0d8c8',
  windowGlass: '#a8c8d8',
  skyBlue: '#7ab8d8',
  tvBlack: '#0a0a18',
  tvScreen: '#0a2848',
  tvGlow: '#1858a8',
  tvCabinet: '#4a2808',
  bookshelf: '#5c3008',
  book1: '#b83030',
  book2: '#2858a8',
  book3: '#c07820',
  book4: '#2a7830',
  book5: '#7830a8',
  book6: '#a84820',
  clockWood: '#6a3810',
  clockFace: '#f0e8d0',
  lampGold: '#c8920a',
  lampShade: '#f0d070',
  lampGlow: '#ffa030',
  potTerra: '#8a4820',
  plantGreen: '#2a6818',
  plantMid: '#3a8828',
  mantleWhite: '#e8e0d0',
  mantleCream: '#d8cfc0',
  teaWhite: '#f0ece0',
  lineArch: '#ffd080',
  lineFurn: '#80e8ff',
  lineArt: '#a0ff80',
};

// ─── Responsive Camera ────────────────────────────────────────────────────────
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const m = size.width < 768;
    camera.fov = m ? 82 : 60;
    camera.position.set(m ? 0.5 : 1.8, m ? 2.0 : 1.8, m ? 9 : 8);
    camera.lookAt(0, 0.0, 0);
    camera.updateProjectionMatrix();
  }, [size, camera]);
  return null;
}

// ─── Main animated scene ──────────────────────────────────────────────────────
function LivingRoom({ triggered }) {
  const clock = useRef(new THREE.Clock(false));
  const started = useRef(false);

  const archLines = useRef([]);
  const furnLines = useRef([]);
  const artLines = useRef([]);
  const allSolids = useRef([]);

  // Phase timings
  const PH = { as: 0, ae: 2.2, fs: 1.8, fe: 3.8, rs: 3.5, re: 5.0, cs: 4.8, ce: 7.2 };

  function lerp01(v, lo, hi) {
    if (v <= lo) return 0;
    if (v >= hi) return 1;
    return (v - lo) / (hi - lo);
  }
  function easeOut3(t) { return 1 - Math.pow(1 - t, 3); }

  useEffect(() => {
    if (triggered && !started.current) {
      clock.current.start();
      started.current = true;
    }
  }, [triggered]);

  useFrame(() => {
    if (!started.current) return;
    const t = clock.current.getElapsedTime();
    const aP = easeOut3(lerp01(t, PH.as, PH.ae));
    const fP = easeOut3(lerp01(t, PH.fs, PH.fe));
    const rP = easeOut3(lerp01(t, PH.rs, PH.re));
    const cP = easeOut3(lerp01(t, PH.cs, PH.ce));
    const lineFade = (prog) => Math.max(0, prog * (1 - cP * 1.15));
    archLines.current.forEach(o => { if (o?.material) o.material.opacity = lineFade(aP); });
    furnLines.current.forEach(o => { if (o?.material) o.material.opacity = lineFade(fP); });
    artLines.current.forEach(o => { if (o?.material) o.material.opacity = lineFade(rP); });
    allSolids.current.forEach(o => {
      if (o?.material) o.material.opacity = easeOut3(cP) * (o.userData.maxOp ?? 1.0);
    });
  });

  // ── Ref helpers ─────────────────────────────────────────────────────────
  const rA = el => { if (el && !archLines.current.includes(el)) archLines.current.push(el); };
  const rF = el => { if (el && !furnLines.current.includes(el)) furnLines.current.push(el); };
  const rR = el => { if (el && !artLines.current.includes(el)) artLines.current.push(el); };
  const rS = (maxOp = 1.0) => el => {
    if (el) { el.userData.maxOp = maxOp; if (!allSolids.current.includes(el)) allSolids.current.push(el); }
  };

  // ── Inline component builders ────────────────────────────────────────────

  const LineBox = ({ pos, size, reg, col }) => {
    const ref = useRef();
    const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size.join()]);
    useEffect(() => { if (ref.current) reg(ref.current); }, []);
    return (
      <lineSegments ref={ref} geometry={geo} position={pos}>
        <lineBasicMaterial color={col} transparent opacity={0} depthWrite={false} />
      </lineSegments>
    );
  };

  const LineCyl = ({ pos, args, reg, col }) => {
    const ref = useRef();
    const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.CylinderGeometry(...args)), [args.join()]);
    useEffect(() => { if (ref.current) reg(ref.current); }, []);
    return (
      <lineSegments ref={ref} geometry={geo} position={pos}>
        <lineBasicMaterial color={col} transparent opacity={0} depthWrite={false} />
      </lineSegments>
    );
  };

  const SolidBox = ({ pos, size, color, maxOp = 0.95, rough = 0.78, metal = 0.04, rot, emit, emitInt = 0 }) => {
    const ref = useRef();
    useEffect(() => { if (ref.current) rS(maxOp)(ref.current); }, []);
    return (
      <mesh ref={ref} position={pos} rotation={rot} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} transparent opacity={0} roughness={rough} metalness={metal}
          emissive={emit || '#000000'} emissiveIntensity={emitInt} />
      </mesh>
    );
  };

  const SolidCyl = ({ pos, args, color, maxOp = 0.95, rough = 0.75, metal = 0, emit, emitInt = 0 }) => {
    const ref = useRef();
    useEffect(() => { if (ref.current) rS(maxOp)(ref.current); }, []);
    return (
      <mesh ref={ref} position={pos}>
        <cylinderGeometry args={args} />
        <meshStandardMaterial color={color} transparent opacity={0} roughness={rough} metalness={metal}
          emissive={emit || '#000000'} emissiveIntensity={emitInt} />
      </mesh>
    );
  };

  const SolidSphere = ({ pos, args, color, maxOp = 0.95, rough = 0.82 }) => {
    const ref = useRef();
    useEffect(() => { if (ref.current) rS(maxOp)(ref.current); }, []);
    return (
      <mesh ref={ref} position={pos}>
        <sphereGeometry args={args} />
        <meshStandardMaterial color={color} transparent opacity={0} roughness={rough} />
      </mesh>
    );
  };

  // Wire + Solid shorthand
  const WS = ({ pos, size, wCol, sCol, reg, maxOp = 0.95, rough = 0.78, metal = 0.04, rot, emit, emitInt = 0 }) => (
    <>
      <LineBox pos={pos} size={size} reg={reg} col={wCol} />
      <SolidBox pos={pos} size={size} color={sCol} maxOp={maxOp} rough={rough} metal={metal} rot={rot} emit={emit} emitInt={emitInt} />
    </>
  );

  return (
    <>
      {/* ─── LIGHTING ─────────────────────────────────────────────────── */}
      <ambientLight intensity={0.65} color="#ffe8c8" />
      <pointLight position={[0, 4.0, -1.5]} intensity={2.5} color="#ffd898" castShadow distance={16} decay={2} />
      <pointLight position={[-3.6, 2.6, -0.8]} intensity={1.8} color="#ffb030" distance={5} decay={2} />
      <pointLight position={[3.8, 1.5, -1.2]} intensity={0.9} color="#ffe0b0" distance={7} decay={2} />
      <pointLight position={[4.5, 0.4, -3.4]} intensity={0.7} color="#3070c0" distance={4} decay={2} />
      <directionalLight position={[-4, 4, 3]} intensity={0.7} color="#c8e8ff" />

      {/* ══════════════════════════════════════════════
          PHASE 1 — ARCHITECTURE (warm yellow lines)
      ══════════════════════════════════════════════ */}

      {/* Floor — dark walnut */}
      <WS pos={[0, -1.52, 0]} size={[12, 0.06, 9]} wCol={P.lineArch} reg={rA} sCol={P.floorWalnut} maxOp={1.0} rough={0.55} metal={0.08} />
      {/* Plank stripes */}
      {[-2.4, -1.2, 0.0, 1.2, 2.4].map((x, i) => (
        <SolidBox key={i} pos={[x, -1.50, 0]} size={[0.07, 0.02, 9]} color={P.floorMid} maxOp={0.55} rough={0.6} />
      ))}

      {/* Back wall — warm beige */}
      <WS pos={[0, 1.5, -4.5]} size={[12, 7, 0.12]} wCol={P.lineArch} reg={rA} sCol={P.wallBeige} maxOp={1.0} rough={0.92} />

      {/* Left wall */}
      <WS pos={[-5.5, 1.5, 0]} size={[0.12, 7, 9]} wCol={P.lineArch} reg={rA} sCol={P.wallSide} maxOp={1.0} rough={0.92} />

      {/* Right wall */}
      <WS pos={[5.5, 1.5, 0]} size={[0.12, 7, 9]} wCol={P.lineArch} reg={rA} sCol={P.wallSide} maxOp={1.0} rough={0.92} />

      {/* Ceiling */}
      <WS pos={[0, 4.5, 0]} size={[12, 0.1, 9]} wCol={P.lineArch} reg={rA} sCol={P.ceiling} maxOp={1.0} rough={0.95} />

      {/* Crown molding */}
      <SolidBox pos={[0, 4.42, -4.44]} size={[12, 0.22, 0.22]} color="#ddd4c0" maxOp={0.92} rough={0.9} />
      <SolidBox pos={[-5.44, 4.42, 0]} size={[0.22, 0.22, 9]} color="#ddd4c0" maxOp={0.92} rough={0.9} />
      <SolidBox pos={[5.44, 4.42, 0]} size={[0.22, 0.22, 9]} color="#ddd4c0" maxOp={0.92} rough={0.9} />
      {/* Baseboard */}
      <SolidBox pos={[0, -1.44, -4.44]} size={[12, 0.18, 0.1]} color="#ddd4c0" maxOp={0.9} rough={0.9} />
      <SolidBox pos={[-5.44, -1.44, 0]} size={[0.1, 0.18, 9]} color="#ddd4c0" maxOp={0.9} rough={0.9} />
      <SolidBox pos={[5.44, -1.44, 0]} size={[0.1, 0.18, 9]} color="#ddd4c0" maxOp={0.9} rough={0.9} />

      {/* ── ARCHED WINDOW (left side back wall) ── */}
      <SolidBox pos={[-2.8, 1.0, -4.44]} size={[3.0, 3.2, 0.15]} color={P.wallBeige} maxOp={1.0} rough={0.9} />
      <LineBox pos={[-2.8, 1.0, -4.36]} size={[2.7, 2.9, 0.04]} reg={rA} col={P.lineArch} />
      <SolidBox pos={[-2.8, 1.0, -4.36]} size={[2.7, 2.9, 0.04]} color={P.windowGlass} maxOp={0.42} rough={0.05} metal={0.2} emit={P.skyBlue} emitInt={0.28} />
      {/* Frame bars */}
      <SolidBox pos={[-2.8, 1.0, -4.34]} size={[2.72, 0.07, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />
      <SolidBox pos={[-2.8, 1.0, -4.34]} size={[0.07, 2.92, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />
      <SolidBox pos={[-2.8, 2.38, -4.34]} size={[2.72, 0.07, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />
      <SolidBox pos={[-2.8, -0.38, -4.34]} size={[2.72, 0.07, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />
      {/* Arch semicircle */}
      <SolidCyl pos={[-2.8, 2.38, -4.34]} args={[1.36, 1.36, 0.07, 16, 1, false, 0, Math.PI]} color={P.windowFrame} maxOp={0.95} rough={0.8} />

      {/* ── CENTER WINDOW ── */}
      <SolidBox pos={[0.6, 0.9, -4.44]} size={[2.2, 2.6, 0.15]} color={P.wallBeige} maxOp={1.0} rough={0.9} />
      <LineBox pos={[0.6, 0.9, -4.36]} size={[1.92, 2.32, 0.04]} reg={rA} col={P.lineArch} />
      <SolidBox pos={[0.6, 0.9, -4.36]} size={[1.92, 2.32, 0.04]} color={P.windowGlass} maxOp={0.38} rough={0.05} metal={0.2} emit={P.skyBlue} emitInt={0.22} />
      <SolidBox pos={[0.6, 0.9, -4.34]} size={[1.94, 0.07, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />
      <SolidBox pos={[0.6, 0.9, -4.34]} size={[0.07, 2.34, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />
      <SolidBox pos={[0.6, 2.0, -4.34]} size={[1.94, 0.07, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />
      <SolidBox pos={[0.6, -0.2, -4.34]} size={[1.94, 0.07, 0.07]} color={P.windowFrame} maxOp={0.95} rough={0.8} />

      {/* ── CURTAINS ── */}
      {/* Left window: left curtain panel */}
      <LineBox pos={[-4.5, 1.5, -4.3]} size={[0.65, 3.6, 0.14]} reg={rA} col={P.lineArch} />
      <SolidBox pos={[-4.5, 1.5, -4.3]} size={[0.65, 3.6, 0.14]} color={P.curtainGreen} maxOp={0.94} rough={0.88} />
      <SolidBox pos={[-4.66, 1.5, -4.26]} size={[0.06, 3.5, 0.1]} color={P.curtainDark} maxOp={0.7} rough={0.9} />
      <SolidBox pos={[-4.44, 1.5, -4.26]} size={[0.06, 3.5, 0.1]} color={P.curtainDark} maxOp={0.6} rough={0.9} />
      {/* Between windows curtain */}
      <LineBox pos={[-1.4, 1.5, -4.3]} size={[0.55, 3.6, 0.14]} reg={rA} col={P.lineArch} />
      <SolidBox pos={[-1.4, 1.5, -4.3]} size={[0.55, 3.6, 0.14]} color={P.curtainGreen} maxOp={0.94} rough={0.88} />
      {/* Right of center window */}
      <LineBox pos={[2.0, 1.5, -4.3]} size={[0.55, 3.6, 0.14]} reg={rA} col={P.lineArch} />
      <SolidBox pos={[2.0, 1.5, -4.3]} size={[0.55, 3.6, 0.14]} color={P.curtainGreen} maxOp={0.94} rough={0.88} />
      {/* Curtain rods */}
      <SolidBox pos={[-2.8, 3.05, -4.28]} size={[5.4, 0.06, 0.06]} color="#7a5030" maxOp={0.9} rough={0.45} metal={0.4} />
      <SolidBox pos={[1.3, 3.05, -4.28]} size={[2.6, 0.06, 0.06]} color="#7a5030" maxOp={0.9} rough={0.45} metal={0.4} />

      {/* ══════════════════════════════════════════════
          PHASE 2 — FURNITURE (cyan-blue lines)
      ══════════════════════════════════════════════ */}

      {/* ── RUG ── */}
      <LineBox pos={[0.5, -1.48, -1.5]} size={[6.2, 0.02, 4.2]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[0.5, -1.49, -1.5]} size={[6.2, 0.02, 4.2]} color={P.rugRed} maxOp={0.94} rough={0.95} />
      <SolidBox pos={[0.5, -1.48, -1.5]} size={[5.9, 0.016, 3.9]} color={P.rugCream} maxOp={0.55} rough={0.95} />
      <SolidBox pos={[0.5, -1.47, -1.5]} size={[3.8, 0.015, 2.4]} color={P.rugBlue} maxOp={0.48} rough={0.95} />
      <SolidBox pos={[0.5, -1.46, -1.5]} size={[2.2, 0.014, 1.4]} color={P.rugDark} maxOp={0.42} rough={0.95} />

      {/* ── SOFA — cobalt blue sectional ── */}
      {/* Seat base */}
      <LineBox pos={[-0.8, -0.72, -2.85]} size={[4.3, 0.64, 1.18]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[-0.8, -0.72, -2.85]} size={[4.3, 0.64, 1.18]} color={P.sofaBlue} maxOp={0.97} rough={0.82} />
      {/* Sofa back */}
      <LineBox pos={[-0.8, -0.25, -3.38]} size={[4.3, 0.92, 0.24]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[-0.8, -0.25, -3.38]} size={[4.3, 0.92, 0.24]} color={P.sofaMid} maxOp={0.97} rough={0.82} />
      {/* Left arm */}
      <LineBox pos={[-3.0, -0.5, -2.85]} size={[0.24, 0.74, 1.18]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[-3.0, -0.5, -2.85]} size={[0.24, 0.74, 1.18]} color={P.sofaMid} maxOp={0.97} rough={0.82} />
      {/* Right arm */}
      <LineBox pos={[1.4, -0.5, -2.85]} size={[0.24, 0.74, 1.18]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[1.4, -0.5, -2.85]} size={[0.24, 0.74, 1.18]} color={P.sofaMid} maxOp={0.97} rough={0.82} />
      {/* Chaise L-extension right */}
      <LineBox pos={[2.2, -0.72, -2.3]} size={[1.65, 0.64, 0.68]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[2.2, -0.72, -2.3]} size={[1.65, 0.64, 0.68]} color={P.sofaHighlight} maxOp={0.95} rough={0.82} />
      {/* Sofa seat cushions */}
      {[[-2.0, -0.42, -2.8], [-0.7, -0.42, -2.8], [0.6, -0.42, -2.8]].map((p, i) => (
        <React.Fragment key={i}>
          <LineBox pos={p} size={[1.08, 0.22, 1.06]} reg={rF} col={P.lineFurn} />
          <SolidBox pos={p} size={[1.08, 0.22, 1.06]} color={P.sofaHighlight} maxOp={0.92} rough={0.85} />
        </React.Fragment>
      ))}
      {/* Sofa legs */}
      {[[-2.72, -1.16, -2.36], [-2.72, -1.16, -3.28], [1.14, -1.16, -2.36], [1.14, -1.16, -3.28]].map((p, i) => (
        <SolidBox key={i} pos={p} size={[0.1, 0.44, 0.1]} color={P.tableLegLight} maxOp={0.95} rough={0.5} metal={0.12} />
      ))}
      {/* Throw pillows */}
      <WS pos={[-1.75, -0.2, -3.18]} size={[0.52, 0.48, 0.13]} wCol={P.lineFurn} reg={rF} sCol={P.cushionOrange} maxOp={0.93} rough={0.88} />
      <WS pos={[-0.58, -0.2, -3.18]} size={[0.5, 0.47, 0.13]} wCol={P.lineFurn} reg={rF} sCol={P.cushionStripe} maxOp={0.93} rough={0.88} />
      <WS pos={[0.56, -0.2, -3.18]} size={[0.5, 0.47, 0.13]} wCol={P.lineFurn} reg={rF} sCol={P.cushionGreen} maxOp={0.93} rough={0.88} />
      <WS pos={[1.12, -0.2, -3.18]} size={[0.48, 0.44, 0.13]} wCol={P.lineFurn} reg={rF} sCol={P.cushionPink} maxOp={0.93} rough={0.88} />

      {/* ── COFFEE TABLE ── */}
      <LineBox pos={[0.2, -1.06, -1.42]} size={[2.25, 0.1, 1.12]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[0.2, -1.06, -1.42]} size={[2.25, 0.1, 1.12]} color={P.tableWalnut} maxOp={0.97} rough={0.52} metal={0.1} />
      <SolidBox pos={[0.2, -1.34, -1.42]} size={[2.05, 0.06, 0.92]} color={P.tableLegLight} maxOp={0.9} rough={0.6} />
      {[[-0.74, -1.22, -0.98], [1.14, -1.22, -0.98], [-0.74, -1.22, -1.86], [1.14, -1.22, -1.86]].map((p, i) => (
        <React.Fragment key={i}>
          <LineBox pos={p} size={[0.09, 0.54, 0.09]} reg={rF} col={P.lineFurn} />
          <SolidBox pos={p} size={[0.09, 0.54, 0.09]} color={P.tableLegLight} maxOp={0.97} rough={0.5} metal={0.12} />
        </React.Fragment>
      ))}

      {/* ── SIDE TABLE / TEAPOY ── */}
      <LineBox pos={[-3.65, -1.06, -1.62]} size={[0.92, 0.1, 0.92]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[-3.65, -1.06, -1.62]} size={[0.92, 0.1, 0.92]} color={P.tableWalnut} maxOp={0.97} rough={0.52} metal={0.1} />
      {[[-4.02, -1.3, -1.24], [-3.28, -1.3, -1.24], [-4.02, -1.3, -2.0], [-3.28, -1.3, -2.0]].map((p, i) => (
        <React.Fragment key={i}>
          <LineBox pos={p} size={[0.08, 0.5, 0.08]} reg={rF} col={P.lineFurn} />
          <SolidBox pos={p} size={[0.08, 0.5, 0.08]} color={P.tableLegLight} maxOp={0.95} rough={0.5} />
        </React.Fragment>
      ))}

      {/* ── FIREPLACE / MANTLE ── */}
      <LineBox pos={[1.35, -0.22, -4.38]} size={[2.25, 2.55, 0.30]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[1.35, -0.22, -4.38]} size={[2.25, 2.55, 0.30]} color={P.mantleWhite} maxOp={0.97} rough={0.88} />
      {/* Firebox */}
      <SolidBox pos={[1.35, -0.84, -4.28]} size={[1.42, 1.12, 0.16]} color="#1a1008" maxOp={1.0} rough={0.95} />
      {/* Mantle shelf */}
      <SolidBox pos={[1.35, 1.12, -4.3]} size={[2.45, 0.15, 0.42]} color={P.mantleCream} maxOp={0.97} rough={0.85} />
      {/* Mantle side pillars */}
      <SolidBox pos={[0.3, -0.22, -4.3]} size={[0.18, 2.46, 0.26]} color={P.mantleCream} maxOp={0.95} rough={0.85} />
      <SolidBox pos={[2.4, -0.22, -4.3]} size={[0.18, 2.46, 0.26]} color={P.mantleCream} maxOp={0.95} rough={0.85} />
      {/* Vase on mantle */}
      <SolidCyl pos={[0.72, 1.38, -4.22]} args={[0.1, 0.08, 0.4, 10]} color="#5888a8" maxOp={0.92} rough={0.38} metal={0.35} />

      {/* ── BOOKSHELF ── */}
      <LineBox pos={[3.62, 0.18, -4.42]} size={[1.82, 3.22, 0.44]} reg={rF} col={P.lineFurn} />
      <SolidBox pos={[3.62, 0.18, -4.42]} size={[1.82, 3.22, 0.44]} color={P.bookshelf} maxOp={0.97} rough={0.72} metal={0.06} />
      {[-1.42, -0.46, 0.48, 1.44].map((y, i) => (
        <SolidBox key={i} pos={[3.62, y, -4.22]} size={[1.7, 0.07, 0.38]} color={P.tableLegLight} maxOp={0.9} rough={0.65} />
      ))}
      {/* Books row 1 */}
      {[
        [2.84, 1.1, P.book1, 0.13, 0.42], [2.99, 1.1, P.book2, 0.14, 0.42],
        [3.15, 1.1, P.book3, 0.12, 0.42], [3.29, 1.1, P.book4, 0.16, 0.42],
        [3.47, 1.1, P.book5, 0.12, 0.42], [3.61, 1.1, P.book6, 0.14, 0.42],
        [3.77, 1.1, P.book1, 0.11, 0.42], [3.9, 1.1, P.book2, 0.13, 0.42],
        [4.05, 1.1, P.book3, 0.12, 0.42],
      ].map(([x, y, c, w, h], i) => (
        <SolidBox key={i} pos={[x, y, -4.22]} size={[w, h, 0.3]} color={c} maxOp={0.9} rough={0.88} />
      ))}
      {/* Books row 2 */}
      {[
        [2.86, 0.11, P.book5, 0.13, 0.4], [3.01, 0.11, P.book6, 0.14, 0.4],
        [3.17, 0.11, P.book1, 0.12, 0.4], [3.31, 0.11, P.book3, 0.13, 0.4],
        [3.46, 0.11, P.book4, 0.15, 0.4], [3.63, 0.11, P.book2, 0.11, 0.4],
        [3.76, 0.11, P.book5, 0.14, 0.4], [3.92, 0.11, P.book6, 0.12, 0.4],
        [4.06, 0.11, P.book1, 0.13, 0.4],
      ].map(([x, y, c, w, h], i) => (
        <SolidBox key={i} pos={[x, y, -4.22]} size={[w, h, 0.3]} color={c} maxOp={0.9} rough={0.88} />
      ))}
      {/* Books row 3 */}
      {[
        [2.88, -0.86, P.book2, 0.14, 0.38], [3.04, -0.86, P.book4, 0.12, 0.38],
        [3.18, -0.86, P.book6, 0.13, 0.38], [3.33, -0.86, P.book1, 0.12, 0.38],
        [3.47, -0.86, P.book3, 0.15, 0.38], [3.64, -0.86, P.book5, 0.11, 0.38],
        [3.77, -0.86, P.book2, 0.14, 0.38],
      ].map(([x, y, c, w, h], i) => (
        <SolidBox key={i} pos={[x, y, -4.22]} size={[w, h, 0.3]} color={c} maxOp={0.9} rough={0.88} />
      ))}

      {/* ══════════════════════════════════════════════
          PHASE 3 — ARTIFACTS (green lines)
      ══════════════════════════════════════════════ */}

      {/* ── TV CABINET + TV ── */}
      <LineBox pos={[4.55, -0.9, -3.52]} size={[2.1, 0.74, 0.64]} reg={rR} col={P.lineArt} />
      <SolidBox pos={[4.55, -0.9, -3.52]} size={[2.1, 0.74, 0.64]} color={P.tvCabinet} maxOp={0.97} rough={0.65} metal={0.08} />
      {/* Cabinet door panels */}
      {[3.88, 4.58, 5.22].map((x, i) => (
        <SolidBox key={i} pos={[x, -0.9, -3.2]} size={[0.62, 0.6, 0.04]} color={P.bookshelf} maxOp={0.9} rough={0.7} />
      ))}
      {/* TV body */}
      <LineBox pos={[4.55, 0.34, -3.5]} size={[2.45, 1.35, 0.1]} reg={rR} col={P.lineArt} />
      <SolidBox pos={[4.55, 0.34, -3.5]} size={[2.45, 1.35, 0.1]} color={P.tvBlack} maxOp={0.98} rough={0.2} metal={0.55} />
      {/* TV screen with glow */}
      <SolidBox pos={[4.55, 0.35, -3.45]} size={[2.22, 1.13, 0.04]} color={P.tvScreen} maxOp={0.96} rough={0.04} metal={0.2} emit={P.tvGlow} emitInt={0.55} />

      {/* ── WALL CLOCK ── */}
      <LineCyl pos={[1.78, 1.62, -4.38]} args={[0.44, 0.44, 0.08, 28]} reg={rR} col={P.lineArt} />
      <SolidCyl pos={[1.78, 1.62, -4.38]} args={[0.44, 0.44, 0.08, 28]} color={P.clockWood} maxOp={0.95} rough={0.55} />
      <SolidCyl pos={[1.78, 1.62, -4.34]} args={[0.37, 0.37, 0.03, 28]} color={P.clockFace} maxOp={0.92} rough={0.82} />
      <SolidBox pos={[1.78, 1.64, -4.31]} size={[0.03, 0.25, 0.02]} color="#1a1008" maxOp={0.92} rough={0.9} />
      <SolidBox pos={[1.84, 1.62, -4.31]} size={[0.19, 0.03, 0.02]} color="#1a1008" maxOp={0.92} rough={0.9} />

      {/* ── FLOOR LAMP (gold, left side next to teapoy) ── */}
      <LineCyl pos={[-3.65, 0.5, -0.82]} args={[0.038, 0.038, 4.05, 8]} reg={rR} col={P.lineArt} />
      <SolidCyl pos={[-3.65, 0.5, -0.82]} args={[0.038, 0.038, 4.05, 8]} color={P.lampGold} maxOp={0.95} rough={0.28} metal={0.82} />
      <LineCyl pos={[-3.65, 2.6, -0.82]} args={[0.48, 0.3, 0.56, 14]} reg={rR} col={P.lineArt} />
      <SolidCyl pos={[-3.65, 2.6, -0.82]} args={[0.48, 0.3, 0.56, 14]} color={P.lampShade} maxOp={0.94} rough={0.72} emit={P.lampGlow} emitInt={0.65} />
      <LineCyl pos={[-3.65, -1.42, -0.82]} args={[0.26, 0.2, 0.19, 12]} reg={rR} col={P.lineArt} />
      <SolidCyl pos={[-3.65, -1.42, -0.82]} args={[0.26, 0.2, 0.19, 12]} color={P.lampGold} maxOp={0.95} rough={0.28} metal={0.82} />
      <pointLight position={[-3.65, 2.42, -0.82]} intensity={1.9} color="#ffb030" distance={5} decay={2} />

      {/* ── POTTED PLANT (fiddle-leaf, right side) ── */}
      <LineCyl pos={[4.82, -1.22, -1.02]} args={[0.3, 0.24, 0.68, 12]} reg={rR} col={P.lineArt} />
      <SolidCyl pos={[4.82, -1.22, -1.02]} args={[0.3, 0.24, 0.68, 12]} color="#d0d0c0" maxOp={0.95} rough={0.7} />
      <SolidCyl pos={[4.82, -0.56, -1.02]} args={[0.065, 0.065, 0.72, 8]} color="#5a3010" maxOp={0.9} rough={0.72} />
      {[
        [4.82, 0.38, -1.02, 0.54, P.plantGreen],
        [4.55, 0.15, -0.82, 0.4, P.plantMid],
        [5.08, 0.2, -0.88, 0.36, '#1e5012'],
        [4.8, 0.74, -1.04, 0.44, P.plantMid],
        [4.52, 0.55, -1.18, 0.3, P.plantGreen],
        [5.1, 0.5, -0.96, 0.32, '#2a6818'],
      ].map(([x, y, z, r, c], i) => (
        <SolidSphere key={i} pos={[x, y, z]} args={[r, 9, 7]} color={c} maxOp={0.93} rough={0.9} />
      ))}

      {/* ── TEA SET on coffee table ── */}
      {/* Tray */}
      <SolidBox pos={[0.22, -1.0, -1.36]} size={[0.7, 0.04, 0.54]} color={P.tableWalnut} maxOp={0.88} rough={0.55} />
      {/* Teapot */}
      <LineCyl pos={[0.06, -0.92, -1.36]} args={[0.11, 0.09, 0.24, 10]} reg={rR} col={P.lineArt} />
      <SolidCyl pos={[0.06, -0.92, -1.36]} args={[0.11, 0.09, 0.24, 10]} color={P.teaWhite} maxOp={0.92} rough={0.38} metal={0.12} />
      {/* Cups */}
      <SolidCyl pos={[0.32, -0.99, -1.38]} args={[0.07, 0.07, 0.13, 8]} color={P.teaWhite} maxOp={0.9} rough={0.4} />
      <SolidCyl pos={[0.50, -0.99, -1.3]} args={[0.07, 0.07, 0.13, 8]} color={P.teaWhite} maxOp={0.9} rough={0.4} />

      {/* ── BOOKS on coffee table ── */}
      <SolidBox pos={[-0.05, -1.32, -1.44]} size={[0.58, 0.065, 0.4]} color={P.book2} maxOp={0.85} rough={0.88} />
      <SolidBox pos={[-0.05, -1.26, -1.44]} size={[0.52, 0.062, 0.36]} color={P.book4} maxOp={0.85} rough={0.88} />

      {/* ── SMALL PLANT on coffee table ── */}
      <SolidCyl pos={[0.88, -1.02, -1.3]} args={[0.085, 0.075, 0.2, 8]} color="#8a5828" maxOp={0.9} rough={0.78} />
      <SolidSphere pos={[0.88, -0.84, -1.3]} args={[0.15, 7, 6]} color={P.plantGreen} maxOp={0.9} rough={0.88} />

      {/* ── CHANDELIER ── */}
      <LineCyl pos={[0, 4.22, -1.6]} args={[0.045, 0.045, 0.56, 6]} reg={rR} col={P.lineArt} />
      <SolidCyl pos={[0, 4.22, -1.6]} args={[0.045, 0.045, 0.56, 6]} color={P.lampGold} maxOp={0.92} rough={0.28} metal={0.85} />
      <SolidCyl pos={[0, 3.88, -1.6]} args={[0.24, 0.24, 0.2, 14]} color={P.lampGold} maxOp={0.92} rough={0.28} metal={0.85} />
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2;
        const cx = Math.cos(a) * 0.42;
        const cz = -1.6 + Math.sin(a) * 0.42;
        return (
          <React.Fragment key={i}>
            <SolidBox pos={[cx * 0.5, 3.74, (-1.6 + cz) * 0.5 + -0.8]} size={[0.42, 0.045, 0.045]}
              color={P.lampGold} maxOp={0.88} rough={0.28} metal={0.85} rot={[0, -a, 0]} />
            <SolidCyl pos={[cx, 3.62, cz]} args={[0.065, 0.065, 0.32, 6]} color={P.lampShade} maxOp={0.88} rough={0.72} emit={P.lampGlow} emitInt={0.55} />
          </React.Fragment>
        );
      })}

      {/* ── WALL PAINTINGS (left wall) ── */}
      <SolidBox pos={[-5.44, 0.88, -3.25]} size={[0.08, 0.9, 0.68]} color="#5a3810" maxOp={0.9} rough={0.7} />
      <SolidBox pos={[-5.42, 0.88, -3.25]} size={[0.04, 0.82, 0.6]} color="#7ab0c8" maxOp={0.7} rough={0.28} emit="#5090a8" emitInt={0.14} />
      <SolidBox pos={[-5.44, -0.2, -2.84]} size={[0.08, 0.8, 0.65]} color="#5a3810" maxOp={0.9} rough={0.7} />
      <SolidBox pos={[-5.42, -0.2, -2.84]} size={[0.04, 0.72, 0.58]} color="#90b870" maxOp={0.7} rough={0.28} emit="#609050" emitInt={0.12} />

    </>
  );
}

// ─── Canvas wrapper with IntersectionObserver ─────────────────────────────────
export default function Scene3DBackground() {
  const [triggered, setTriggered] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !triggered) setTriggered(true); },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [triggered]);

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <Canvas
        shadows
        camera={{ fov: 60, position: [1.8, 1.8, 8], near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ResponsiveCamera />
        <LivingRoom triggered={triggered} />
      </Canvas>
    </div>
  );
}