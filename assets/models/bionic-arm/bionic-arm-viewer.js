/**
 * Abdul Fazil - Interactive 3D Bionic Arm Electromechanical Studio
 * Powered by Three.js & 100% Aligned Fusion 360 / Tinkercad STL Geometry
 *
 * Coordinate Frame of window.BIONIC_ARM_DATA (CAD space before rootGroup rotation):
 *   +Z : Vertical axis of arm (Base at Z = -110, Wrist at Z = 0, Knuckles at Z ~ +94, Fingertips at Z ~ +180)
 *   -X : Front / Palmar side (Palm of hand, Open arch servo bay, Removable OLED side panel)
 *   +X : Back / Dorsal side
 *   -Y : Thumb / Right side (when viewing palm from front)
 *   +Y : Pinky / Left side (when viewing palm from front)
 */

(function () {
  'use strict';

  function decodeF32(b64) {
    const bin = atob(b64);
    const buf = new ArrayBuffer(bin.length);
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(buf);
  }

  function decodeU16(b64) {
    const bin = atob(b64);
    const buf = new ArrayBuffer(bin.length);
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Uint16Array(buf);
  }

  class BionicArmViewer {
    constructor() {
      this.container = document.getElementById('isoViewport');
      if (!this.container || typeof THREE === 'undefined') return;

      this.armData = window.BIONIC_ARM_DATA;
      if (!this.armData || !this.armData.parts || !this.armData.fingers) return;

      this.meshes = {};
      this.fingerChains = {};
      this.servoHorns = [];
      this.dynamicLines = [];
      this.calloutEls = [];
      this.wireframeMode = false;
      this.activeLayer = 'all';
      this.currentGesture = 'open';
      this.explodeProgress = 0.65;

      // Target curl angles [thumb, index, middle, ring, pinky] in radians
      this.fingerAngles = {
        open:  [0.0, 0.0, 0.0, 0.0, 0.0],
        peace: [1.05, 0.0, 0.0, 1.45, 1.50],
        fist:  [1.15, 1.42, 1.48, 1.48, 1.45]
      };
      this.currentAngles = [0.0, 0.0, 0.0, 0.0, 0.0];
      this.targetAngles = this.fingerAngles.open;

      this.initScene();
      this.buildArmChassis();
      this.buildMultiPhalanxFingers();
      this.buildInternalElectronics();
      this.buildCalloutPins();
      this.setupControls();
      this.setupDOMEvents();

      const slider = document.getElementById('explodeSlider');
      const initVal = slider ? parseFloat(slider.value) / 100 : 0.65;
      this.setExplode(initVal);

      this.animate();
    }

    initScene() {
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || 640;
      const height = rect.height || 480;

      // WebGL Canvas
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'bionic3dCanvas';
      this.canvas.className = 'bionic-3d-canvas';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.zIndex = '2';
      this.canvas.style.cursor = 'grab';

      this.container.style.position = 'relative';
      this.container.appendChild(this.canvas);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.scene = new THREE.Scene();

      // Root group rotates CAD (+Z up, -X front palm, -Y right thumb) into Three.js world (+Y up, +Z front palm, +X right thumb)
      // Vertical CAD span is Z = -111.3 (base) to Z = +184.4 (middle fingertip), midpoint = +36.5.
      // Setting Y = -34 centers the full 295.7mm height around World Y = 0 (-145.3 to +150.4).
      this.rootGroup = new THREE.Group();
      this.rootGroup.rotation.order = 'XYZ';
      this.rootGroup.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      this.rootGroup.position.set(12, -34, 0);
      this.scene.add(this.rootGroup);

      // Camera framed with generous top, bottom & mobile horizontal clearance
      const initAspect = width / height;
      const initDistScale = initAspect < 1.12 ? Math.min(1.46, 1.12 / Math.max(0.62, initAspect)) : 1.0;
      this.camera = new THREE.PerspectiveCamera(40, initAspect, 1, 2200);
      this.camera.position.set(-22, 6, Math.round(560 * initDistScale));

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.minDistance = 180;
      this.controls.maxDistance = 980;
      this.controls.target.set(-4, -2, 0);
      this.controls.maxPolarAngle = Math.PI * 0.85;

      // High-contrast CAD studio lighting so white 3D-printed PLA contours pop clearly against dark slate background
      const hemiLight = new THREE.HemisphereLight(0xFFFDF9, 0x334155, 0.58);
      hemiLight.position.set(0, 300, 0);
      this.scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xFFF8ED, 0.92);
      keyLight.position.set(150, 230, 190);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.001;
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x93C5FD, 0.42);
      fillLight.position.set(-200, 50, 110);
      this.scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xFDE68A, 0.48);
      rimLight.position.set(20, 140, -220);
      this.scene.add(rimLight);

      // Subtle shadow ground plane below forearm base (CAD Z = -111.3 -> World Y = -111.3 - 34 = -145.3)
      const shadowGeo = new THREE.PlaneGeometry(550, 550);
      const shadowMat = new THREE.ShadowMaterial({ opacity: 0.28 });
      const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -146;
      shadowPlane.receiveShadow = true;
      this.scene.add(shadowPlane);

      window.addEventListener('resize', () => this.onResize());
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(this.container);
      }
    }

    onResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || 640;
      const height = rect.height || 480;
      const aspect = width / height;
      this.camera.aspect = aspect;
      const distScale = aspect < 1.12 ? Math.min(1.46, 1.12 / Math.max(0.62, aspect)) : 1.0;
      this.camera.position.z = Math.round(560 * distScale);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    createBufferGeo(partData) {
      const geo = new THREE.BufferGeometry();
      const pos = decodeF32(partData.positions);
      const idx = decodeU16(partData.indices);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      geo.computeVertexNormals();
      return geo;
    }

    createOledTexture(text) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      // Black OLED background with subtle bezel border
      ctx.fillStyle = '#070B0E';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 248, 120);

      // Glowing Cyan SSD1306 OLED Typography
      ctx.fillStyle = '#67E8F9';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 34px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }

    buildArmChassis() {
      const parts = this.armData.parts;

      this.materials = {
        whitePLA: new THREE.MeshPhysicalMaterial({
          color: 0xEFEDE6,
          roughness: 0.48,
          metalness: 0.04,
          clearcoat: 0.08,
          clearcoatRoughness: 0.38,
          side: THREE.DoubleSide
        }),
        coverPLA: new THREE.MeshPhysicalMaterial({
          color: 0xF3F1EA,
          roughness: 0.45,
          metalness: 0.04,
          clearcoat: 0.08,
          side: THREE.DoubleSide
        }),
        greyPLA: new THREE.MeshPhysicalMaterial({
          color: 0x68707A,
          roughness: 0.44,
          metalness: 0.12,
          clearcoat: 0.06,
          side: THREE.DoubleSide
        }),
        accentOrange: new THREE.MeshStandardMaterial({
          color: 0xE06538,
          roughness: 0.36,
          metalness: 0.12
        }),
        servoBlue: new THREE.MeshPhysicalMaterial({
          color: 0x1D7AFC,
          transparent: true,
          opacity: 0.90,
          roughness: 0.22,
          metalness: 0.05
        }),
        servoHorn: new THREE.MeshStandardMaterial({
          color: 0xF8FAFC,
          roughness: 0.3
        }),
        pcbArduino: new THREE.MeshStandardMaterial({
          color: 0x0F52BA,
          roughness: 0.35,
          metalness: 0.25
        }),
        pcbBioAmp: new THREE.MeshPhysicalMaterial({
          color: 0xF8FAFC,
          roughness: 0.26,
          metalness: 0.04,
          clearcoat: 0.35
        }),
        pcbGold: new THREE.MeshStandardMaterial({
          color: 0xF59E0B,
          roughness: 0.20,
          metalness: 0.88
        }),
        icBlack: new THREE.MeshStandardMaterial({
          color: 0x22252A,
          roughness: 0.48,
          metalness: 0.08
        }),
        icSilver: new THREE.MeshStandardMaterial({
          color: 0xE2E8F0,
          roughness: 0.22,
          metalness: 0.88
        }),
        smdCapTan: new THREE.MeshStandardMaterial({
          color: 0xB89F8D,
          roughness: 0.38,
          metalness: 0.05
        }),
        smdResBlack: new THREE.MeshStandardMaterial({
          color: 0x18181B,
          roughness: 0.42,
          metalness: 0.08
        })
      };

      // 1. Forearm Main Chassis (Smashing Turing-Gogo.stl)
      if (parts.forearmShell) {
        const geo = this.createBufferGeo(parts.forearmShell);
        const mesh = new THREE.Mesh(geo, this.materials.whitePLA);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.rootGroup.add(mesh);
        this.meshes.forearmShell = mesh;
      }

      // 2. Hand Palm Chassis (Hand4RIGHT.stl) - stays solidly mounted on wrist!
      if (parts.handPalm) {
        const geo = this.createBufferGeo(parts.handPalm);
        const mesh = new THREE.Mesh(geo, this.materials.whitePLA);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.palmGroup = new THREE.Group();
        this.palmGroup.add(mesh);
        this.rootGroup.add(this.palmGroup);
        this.meshes.handPalm = mesh;
      }

      // 3. Removable Side/Front Bottom Panel (Smashing Elzing.stl) + Embedded 0.96" OLED Display
      if (parts.sidePanelCover) {
        const geo = this.createBufferGeo(parts.sidePanelCover);
        const mesh = new THREE.Mesh(geo, this.materials.coverPLA);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.coverGroup = new THREE.Group();
        this.coverGroup.add(mesh);

        // Recessed 0.96" OLED Screen inside the rectangular window (Z in [-74, -46], Y in [-22, 22], X ~ -42)
        this.oledTexOpen = this.createOledTexture('Bionic Arm');
        this.oledTexPeace = this.createOledTexture('Peace');
        const oledGeo = new THREE.PlaneGeometry(34, 18);
        this.oledMat = new THREE.MeshBasicMaterial({
          map: this.oledTexOpen,
          side: THREE.DoubleSide
        });
        const oledMesh = new THREE.Mesh(oledGeo, this.oledMat);
        // Orient plane so text reads upright (+Z CAD) and left-to-right (-Y CAD) facing front (-X CAD)
        oledMesh.rotation.order = 'ZYX';
        oledMesh.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
        oledMesh.position.set(-41.2, 0, -61);
        this.coverGroup.add(oledMesh);

        // Dark backing housing behind OLED cutout
        const oledBackGeo = new THREE.BoxGeometry(3, 36, 22);
        const oledBackMesh = new THREE.Mesh(oledBackGeo, this.materials.icBlack);
        oledBackMesh.position.set(-39.2, 0, -61);
        this.coverGroup.add(oledBackMesh);

        this.rootGroup.add(this.coverGroup);
        this.meshes.sidePanelCover = mesh;
      }
    }

    buildMultiPhalanxFingers() {
      const fingerOrder = ['fingerThumb', 'fingerIndex', 'fingerMiddle', 'fingerRing', 'fingerPinky'];

      fingerOrder.forEach((fKey, fIdx) => {
        const fCfg = this.armData.fingers[fKey];
        if (!fCfg) return;

        // Knuckle base group positioned at exact socket on Hand4RIGHT
        const knuckleGroup = new THREE.Group();
        knuckleGroup.position.set(fCfg.knuckle[0], fCfg.knuckle[1], fCfg.knuckle[2]);

        // Splay orientation group
        const splayGroup = new THREE.Group();
        splayGroup.rotation.order = 'ZYX';
        splayGroup.rotation.set(fCfg.splay[0] || 0, fCfg.splay[1] || 0, fCfg.splay[2] || 0);
        knuckleGroup.add(splayGroup);

        // Build chained phalanx joints (Proximal -> Middle -> Distal)
        const jointGroups = [];
        let parentGroup = splayGroup;

        fCfg.phalanges.forEach((phData, pIdx) => {
          const jointPivot = new THREE.Group();
          if (pIdx > 0) {
            const prevLen = fCfg.phalanges[pIdx - 1].len;
            jointPivot.position.set(0, 0, prevLen + 0.5);
          }

          const geo = this.createBufferGeo(phData);
          const mesh = new THREE.Mesh(geo, this.materials.greyPLA);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          jointPivot.add(mesh);

          // Subtle orange/tan elastic tendon pin detail in phalanx hinge
          const pinGeo = new THREE.CylinderGeometry(1.1, 1.1, 8, 10);
          const pinMesh = new THREE.Mesh(pinGeo, this.materials.accentOrange);
          pinMesh.position.set(-2.5, 0, 2.0);
          jointPivot.add(pinMesh);

          parentGroup.add(jointPivot);
          jointGroups.push(jointPivot);
          parentGroup = jointPivot;
        });

        this.palmGroup.add(knuckleGroup);
        this.fingerChains[fKey] = {
          index: fIdx,
          knuckleGroup,
          jointGroups,
          ratios: fCfg.phalanges.length === 2 ? [0.55, 0.75] : [0.45, 0.68, 0.52]
        };
      });
    }

    buildInternalElectronics() {
      this.electronicsGroup = new THREE.Group();
      this.rootGroup.add(this.electronicsGroup);

      // =========================================================
      // 1. 5x 9g Micro Servo Motors Bank (1 Servo Per Finger)
      // =========================================================
      this.servosGroup = new THREE.Group();
      // Seated inside forearm bay when closed
      this.servosBasePos = new THREE.Vector3(6, 0, -68);
      this.servosGroup.position.copy(this.servosBasePos);

      const servoBodyGeo = new THREE.BoxGeometry(12.2, 22.5, 24.0);
      const servoTabGeo = new THREE.BoxGeometry(12.2, 32.0, 2.2);
      const servoGearGeo = new THREE.CylinderGeometry(2.8, 2.8, 4.5, 16);
      const servoHornGeo = new THREE.BoxGeometry(2.2, 17.5, 4.2);

      // 5 servos arranged in 2 tiers (3 lower, 2 upper) matching physical build photos
      const servoCoords = [
        { x: -2, y: -18, z: -14, hornDir: 1 },  // Thumb servo
        { x: -2, y: 0,   z: -14, hornDir: -1 }, // Index servo
        { x: -2, y: 18,  z: -14, hornDir: 1 },  // Middle servo
        { x: -2, y: -10, z: 15,  hornDir: -1 }, // Ring servo
        { x: -2, y: 10,  z: 15,  hornDir: 1 }   // Pinky servo
      ];

      servoCoords.forEach((sc, idx) => {
        const unit = new THREE.Group();
        unit.position.set(sc.x, sc.y, sc.z);

        const body = new THREE.Mesh(servoBodyGeo, this.materials.servoBlue);
        body.castShadow = true;
        unit.add(body);

        const tab = new THREE.Mesh(servoTabGeo, this.materials.servoBlue);
        tab.position.set(0, 0, 4);
        unit.add(tab);

        // Brass drive gear protruding toward -X (front opening)
        const gear = new THREE.Mesh(servoGearGeo, this.materials.pcbGold);
        gear.rotation.z = Math.PI / 2;
        gear.position.set(-7.5, 0, 6);
        unit.add(gear);

        // White rotating servo horn
        const hornPivot = new THREE.Group();
        hornPivot.position.set(-9.2, 0, 6);
        const horn = new THREE.Mesh(servoHornGeo, this.materials.servoHorn);
        horn.position.set(0, sc.hornDir * 5.5, 0);
        hornPivot.add(horn);
        unit.add(hornPivot);

        this.servoHorns.push({ pivot: hornPivot, dir: sc.hornDir });
        this.servosGroup.add(unit);
      });

      this.electronicsGroup.add(this.servosGroup);

      // =========================================================
      // 2. Arduino Nano Controller (Servo MCU)
      // =========================================================
      this.nanoGroup = new THREE.Group();
      this.nanoBasePos = new THREE.Vector3(-4, -2, -32);
      this.nanoGroup.position.copy(this.nanoBasePos);

      // Blue Nano FR4 PCB
      const nanoPcbGeo = new THREE.BoxGeometry(2.2, 18.5, 44.0);
      const nanoPcb = new THREE.Mesh(nanoPcbGeo, this.materials.pcbArduino);
      nanoPcb.castShadow = true;
      this.nanoGroup.add(nanoPcb);

      // ATmega328P TQFP IC
      const mcuGeo = new THREE.BoxGeometry(1.6, 9.0, 9.0);
      const mcuMesh = new THREE.Mesh(mcuGeo, this.materials.icBlack);
      mcuMesh.rotation.x = Math.PI / 4;
      mcuMesh.position.set(-1.6, 0, 2);
      this.nanoGroup.add(mcuMesh);

      // Silver Mini-USB Connector at top
      const usbGeo = new THREE.BoxGeometry(4.0, 8.0, 9.5);
      const usbMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.85, roughness: 0.2 });
      const usbMesh = new THREE.Mesh(usbGeo, usbMat);
      usbMesh.position.set(-2.2, 0, 18.5);
      this.nanoGroup.add(usbMesh);

      // Gold Pin Header Rows
      const headerGeo = new THREE.BoxGeometry(2.5, 1.8, 38.0);
      [-7.5, 7.5].forEach(hy => {
        const hdr = new THREE.Mesh(headerGeo, this.materials.pcbGold);
        hdr.position.set(-1.5, hy, -1);
        this.nanoGroup.add(hdr);
      });

      // Glowing Red Power/Status LED (seen shining inside forearm in user photo!)
      const ledGeo = new THREE.SphereGeometry(1.6, 12, 12);
      this.ledMat = new THREE.MeshBasicMaterial({ color: 0xFF2E2E });
      const ledMesh = new THREE.Mesh(ledGeo, this.ledMat);
      ledMesh.position.set(-2.2, 3.5, 10.5);
      this.nanoGroup.add(ledMesh);

      this.arduinoPointLight = new THREE.PointLight(0xFF2E2E, 1.1, 65);
      this.arduinoPointLight.position.set(-6, 3.5, 10.5);
      this.nanoGroup.add(this.arduinoPointLight);

      this.electronicsGroup.add(this.nanoGroup);

      // =========================================================
      // 3. Dual-Stage Bio-Potential Amplifier (Neural Amp v0.1 PCB)
      //    Exact 3D CAD Model: White Rounded PCB, 6 Gold Oval Pads,
      //    14-Pin TL074 IC with Gull-Wing Leads, and 19 SMD Passives
      // =========================================================
      this.ampGroup = new THREE.Group();
      this.ampBasePos = new THREE.Vector3(-4, 12, -82);
      this.ampGroup.position.copy(this.ampBasePos);

      // 3A. Rounded-Corner White Solder-Mask PCB Substrate (18.4mm wide x 45mm tall x 1.8mm thick)
      const bw = 18.4;
      const bh = 45.0;
      const br = 3.2;
      const pcbShape = new THREE.Shape();
      pcbShape.moveTo(-bw / 2 + br, -bh / 2);
      pcbShape.lineTo(bw / 2 - br, -bh / 2);
      pcbShape.quadraticCurveTo(bw / 2, -bh / 2, bw / 2, -bh / 2 + br);
      pcbShape.lineTo(bw / 2, bh / 2 - br);
      pcbShape.quadraticCurveTo(bw / 2, bh / 2, bw / 2 - br, bh / 2);
      pcbShape.lineTo(-bw / 2 + br, bh / 2);
      pcbShape.quadraticCurveTo(-bw / 2, bh / 2, -bw / 2, bh / 2 - br);
      pcbShape.lineTo(-bw / 2, -bh / 2 + br);
      pcbShape.quadraticCurveTo(-bw / 2, -bh / 2, -bw / 2 + br, -bh / 2);

      const ampPcbGeo = new THREE.ExtrudeGeometry(pcbShape, {
        depth: 1.7,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 2
      });
      // Rotate extruded XY shape so board thickness is along X, width (18.4) along Y, and height (45.0) along Z
      ampPcbGeo.rotateY(-Math.PI / 2);
      ampPcbGeo.rotateX(Math.PI / 2);
      const ampPcb = new THREE.Mesh(ampPcbGeo, this.materials.pcbBioAmp);
      ampPcb.position.x = 0.85;
      ampPcb.castShadow = true;
      ampPcb.receiveShadow = true;
      this.ampGroup.add(ampPcb);

      // 3B. Top 3x & Bottom 3x Gold ENIG Oval Through-Hole Electrode/Output Pads
      const ovalPadShape = new THREE.Shape();
      const pw = 2.2, ph = 4.4, pr = 1.1;
      ovalPadShape.moveTo(-pw / 2, -ph / 2 + pr);
      ovalPadShape.lineTo(-pw / 2, ph / 2 - pr);
      ovalPadShape.absarc(0, ph / 2 - pr, pr, Math.PI, 0, true);
      ovalPadShape.lineTo(pw / 2, -ph / 2 + pr);
      ovalPadShape.absarc(0, -ph / 2 + pr, pr, 0, Math.PI, true);

      const holePath = new THREE.Path();
      holePath.absarc(0, 0, 0.58, 0, Math.PI * 2, false);
      ovalPadShape.holes.push(holePath);

      const ovalPadGeo = new THREE.ExtrudeGeometry(ovalPadShape, {
        depth: 0.25,
        bevelEnabled: false
      });
      ovalPadGeo.rotateY(-Math.PI / 2);
      ovalPadGeo.rotateX(Math.PI / 2);
      const holeCenterGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.3, 12);
      holeCenterGeo.rotateZ(Math.PI / 2);

      [17.2, -17.2].forEach(pz => {
        [-4.2, 0, 4.2].forEach(py => {
          const padMesh = new THREE.Mesh(ovalPadGeo, this.materials.pcbGold);
          padMesh.position.set(-0.98, py, pz);
          this.ampGroup.add(padMesh);

          const darkHole = new THREE.Mesh(holeCenterGeo, this.materials.icBlack);
          darkHole.position.set(-0.98, py, pz);
          this.ampGroup.add(darkHole);
        });
      });

      // 3C. Central 14-Pin DIP/SOIC TL074 Quad Op-Amp IC + 14 Silver Gull-Wing Pins on Gold Pads
      const tl074Geo = new THREE.BoxGeometry(2.6, 6.2, 20.8);
      const tl074Mesh = new THREE.Mesh(tl074Geo, this.materials.icBlack);
      tl074Mesh.position.set(-2.2, 0, -2.0);
      tl074Mesh.castShadow = true;
      this.ampGroup.add(tl074Mesh);

      // White Pin-1 Dimple Dot at bottom-right of TL074 IC
      const dimpleGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.15, 12);
      dimpleGeo.rotateZ(Math.PI / 2);
      const dimpleMesh = new THREE.Mesh(dimpleGeo, this.materials.icSilver);
      dimpleMesh.position.set(-3.52, -1.8, -10.5);
      this.ampGroup.add(dimpleMesh);

      // 7 Pins on Left (+Y) and 7 Pins on Right (-Y)
      const icPadGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.2, 12);
      icPadGeo.rotateZ(Math.PI / 2);
      const icLeadTopGeo = new THREE.BoxGeometry(0.35, 1.3, 0.85);
      const icLeadLegGeo = new THREE.BoxGeometry(1.3, 0.35, 0.85);

      for (let p = 0; p < 7; p++) {
        const pinZ = -10.4 + p * 2.8;
        [-1, 1].forEach(side => {
          // Gold circular PCB pad
          const pad = new THREE.Mesh(icPadGeo, this.materials.pcbGold);
          pad.position.set(-1.02, side * 4.0, pinZ);
          this.ampGroup.add(pad);

          // Silver horizontal shoulder from IC body
          const sh = new THREE.Mesh(icLeadTopGeo, this.materials.icSilver);
          sh.position.set(-2.1, side * 3.45, pinZ);
          this.ampGroup.add(sh);

          // Silver vertical leg down to gold pad
          const leg = new THREE.Mesh(icLeadLegGeo, this.materials.icSilver);
          leg.position.set(-1.55, side * 3.95, pinZ);
          this.ampGroup.add(leg);
        });
      }

      // 3D. 19x Surface-Mount Resistors (Black) & Ceramic Capacitors (Tan) on Twin Gold Pads
      const addSMD = (py, pz, isCap, horiz, scale) => {
        const s = scale || 1.0;
        const g = new THREE.Group();
        g.position.set(-1.02, py, pz);
        if (horiz) g.rotation.x = Math.PI / 2;

        const padG = new THREE.BoxGeometry(0.18, 1.15 * s, 0.85 * s);
        const termG = new THREE.BoxGeometry(0.75 * s, 1.0 * s, 0.55 * s);
        const bodyG = new THREE.BoxGeometry(0.78 * s, 1.0 * s, 1.35 * s);

        [-1.05 * s, 1.05 * s].forEach(dz => {
          const pMesh = new THREE.Mesh(padG, this.materials.pcbGold);
          pMesh.position.set(0, 0, dz);
          g.add(pMesh);
        });
        [-0.85 * s, 0.85 * s].forEach(dz => {
          const tMesh = new THREE.Mesh(termG, this.materials.icSilver);
          tMesh.position.set(-0.42 * s, 0, dz);
          g.add(tMesh);
        });
        const bMesh = new THREE.Mesh(bodyG, isCap ? this.materials.smdCapTan : this.materials.smdResBlack);
        bMesh.position.set(-0.44 * s, 0, 0);
        g.add(bMesh);

        this.ampGroup.add(g);
      };

      // Left column of 6 vertical SMD passives (alongside pins 1-7)
      [
        { z: 5.8, cap: true },
        { z: 2.2, cap: false },
        { z: -1.4, cap: false },
        { z: -5.0, cap: true },
        { z: -8.6, cap: false },
        { z: -12.2, cap: false }
      ].forEach(item => addSMD(6.8, item.z, item.cap, false, 0.92));

      // Right column of 6 vertical SMD passives (alongside pins 8-14)
      [
        { z: 5.8, cap: false },
        { z: 2.2, cap: false },
        { z: -1.4, cap: false },
        { z: -5.0, cap: false },
        { z: -8.6, cap: true },
        { z: -12.2, cap: true }
      ].forEach(item => addSMD(-6.8, item.z, item.cap, false, 0.92));

      // Top filter section (between top 3 gold oval pads and TL074 IC)
      addSMD(4.5, 12.2, false, false, 0.92);
      addSMD(1.5, 12.2, true, false, 0.92);
      addSMD(-1.5, 12.2, false, false, 0.92);
      addSMD(3.8, 9.1, true, true, 0.88);
      addSMD(-0.4, 9.1, false, true, 0.88);
      // 2 larger stacked horizontal tan decoupling capacitors on top-right
      addSMD(-5.2, 12.4, true, true, 1.15);
      addSMD(-5.2, 9.2, true, true, 1.15);

      // Gold micro-vias matching the CAD layout (plus subtle point light for EEG gate test)
      const viaGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 10);
      viaGeo.rotateZ(Math.PI / 2);
      [
        [5.8, 14.8], [6.8, 11.2], [-1.8, 7.6], [-4.4, 6.2], [5.0, -14.2], [-4.8, -14.2]
      ].forEach(([vy, vz]) => {
        const via = new THREE.Mesh(viaGeo, this.materials.pcbGold);
        via.position.set(-1.02, vy, vz);
        this.ampGroup.add(via);
      });

      this.eegLedMat = new THREE.MeshBasicMaterial({ color: 0x10B981 });
      this.eegPointLight = new THREE.PointLight(0x10B981, 0.0, 45);
      this.eegPointLight.position.set(-6, 0, 0);
      this.ampGroup.add(this.eegPointLight);

      this.electronicsGroup.add(this.ampGroup);

      // =========================================================
      // 4. Dynamic Tendon Cords & Rainbow Ribbon Wiring
      // =========================================================
      this.wiringGroup = new THREE.Group();
      this.rootGroup.add(this.wiringGroup);
      this.updateDynamicWiring();
    }

    updateDynamicWiring() {
      if (!this.wiringGroup) return;
      while (this.wiringGroup.children.length > 0) {
        const child = this.wiringGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        this.wiringGroup.remove(child);
      }

      // 1. 5 White Nylon Tendon Lines from Servo Bank up into the 5 Knuckles
      const knuckleTargets = [
        new THREE.Vector3(-18.5, -49.5, 45.5), // Thumb
        new THREE.Vector3(-2.2, -28.0, 89.5),  // Index
        new THREE.Vector3(-1.8, -9.8, 94.2),   // Middle
        new THREE.Vector3(-1.8, 9.2, 93.2),    // Ring
        new THREE.Vector3(-2.2, 27.2, 87.2)    // Pinky
      ];

      const tendonMat = new THREE.LineBasicMaterial({
        color: 0xF8FAFC,
        transparent: true,
        opacity: 0.85
      });

      const sPos = this.servosGroup.position;
      knuckleTargets.forEach((kTarget, idx) => {
        const start = new THREE.Vector3(
          sPos.x - 9,
          sPos.y + (idx - 2) * 7,
          sPos.z + (idx < 3 ? -6 : 16)
        );
        const wristPass = new THREE.Vector3(-8, kTarget.y * 0.45, 2);
        const curve = new THREE.CatmullRomCurve3([start, wristPass, kTarget]);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
        this.wiringGroup.add(new THREE.Line(lineGeo, tendonMat));
      });

      // 2. Rainbow Ribbon Harness connecting Bio-Amp -> Arduino Nano -> Servo Bank
      const ribbonColors = [0xEF4444, 0xF97316, 0xFACC15, 0x10B981, 0x3B82F6];
      const nPos = this.nanoGroup.position;
      const aPos = this.ampGroup.position;

      ribbonColors.forEach((col, i) => {
        const offset = (i - 2) * 1.6;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(aPos.x - 1, aPos.y + offset, aPos.z + 16),
          new THREE.Vector3(
            (aPos.x + nPos.x) * 0.5 - 8,
            (aPos.y + nPos.y) * 0.5 + offset,
            (aPos.z + nPos.z) * 0.5
          ),
          new THREE.Vector3(nPos.x - 1, nPos.y + offset, nPos.z - 16),
          new THREE.Vector3(sPos.x - 4, sPos.y + offset * 2, sPos.z + 8)
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: col });
        const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
        this.wiringGroup.add(new THREE.Line(lineGeo, lineMat));
      });
    }

    buildCalloutPins() {
      // Create clean non-overlapping outer callout badges with SVG leader lines & target dots
      this.calloutOverlay = document.createElement('div');
      this.calloutOverlay.className = 'bionic-3d-callouts';
      this.calloutOverlay.style.position = 'absolute';
      this.calloutOverlay.style.inset = '0';
      this.calloutOverlay.style.pointerEvents = 'none';
      this.calloutOverlay.style.zIndex = '4';
      this.container.appendChild(this.calloutOverlay);

      // SVG layer for crisp angled leader lines connecting outer labels to 3D parts
      this.leaderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.leaderSvg.setAttribute('width', '100%');
      this.leaderSvg.setAttribute('height', '100%');
      this.leaderSvg.style.position = 'absolute';
      this.leaderSvg.style.inset = '0';
      this.leaderSvg.style.overflow = 'visible';
      this.calloutOverlay.appendChild(this.leaderSvg);

      const pins = [
        {
          id: 'pinNano',
          badge: 'MCU',
          badgeColor: '#2563EB',
          text: 'Arduino Nano Controller',
          mobileText: 'Arduino Nano',
          side: 'left',
          offsetX: -125,
          offsetY: -36,
          getPos: () => this.nanoGroup ? this.nanoGroup.position.clone().add(new THREE.Vector3(-4, 6, 12)) : new THREE.Vector3()
        },
        {
          id: 'pinAmp',
          badge: 'EEG PCB',
          badgeColor: '#10B981',
          text: 'Neural Amp v0.1 (TL074)',
          mobileText: 'Neural Amp v0.1',
          side: 'left',
          offsetX: -125,
          offsetY: 16,
          getPos: () => this.ampGroup ? this.ampGroup.position.clone().add(new THREE.Vector3(-3, 6, 0)) : new THREE.Vector3()
        },
        {
          id: 'pinServos',
          badge: '5× SERVOS',
          badgeColor: '#0EA5E9',
          text: '9g Micro Servos (1/Finger)',
          mobileText: '5× 9g Servos',
          side: 'bottom',
          offsetX: 12,
          offsetY: 44,
          getPos: () => this.servosGroup ? this.servosGroup.position.clone().add(new THREE.Vector3(-10, 0, -16)) : new THREE.Vector3()
        },
        {
          id: 'pinCover',
          badge: 'PLA + OLED',
          badgeColor: '#E85D2A',
          text: 'Side Panel + 0.96" OLED',
          mobileText: 'OLED Side Panel',
          side: 'right',
          offsetX: 95,
          offsetY: -54,
          getPos: () => {
            const v = new THREE.Vector3(-40, -18, -50);
            if (this.coverGroup) v.add(this.coverGroup.position);
            return v;
          }
        }
      ];

      pins.forEach(p => {
        // SVG polyline + target circle on component
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.55)');
        line.setAttribute('stroke-width', '1.4');
        line.setAttribute('stroke-dasharray', '3 2');
        this.leaderSvg.appendChild(line);

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '3.5');
        dot.setAttribute('fill', p.badgeColor);
        dot.setAttribute('stroke', '#FFFFFF');
        dot.setAttribute('stroke-width', '1.2');
        this.leaderSvg.appendChild(dot);

        // Callout Pill Badge
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.background = 'rgba(18, 21, 28, 0.88)';
        el.style.backdropFilter = 'blur(8px)';
        el.style.border = '1px solid rgba(255, 255, 255, 0.16)';
        el.style.borderRadius = '999px';
        el.style.padding = '4px 10px';
        el.style.display = 'inline-flex';
        el.style.alignItems = 'center';
        el.style.gap = '6px';
        el.style.fontFamily = 'var(--font-mono, monospace)';
        el.style.fontSize = '10px';
        el.style.fontWeight = '600';
        el.style.color = '#F8FAFC';
        el.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.32)';
        el.style.transition = 'opacity 0.2s ease';
        el.style.whiteSpace = 'nowrap';

        const pill = document.createElement('span');
        pill.textContent = p.badge;
        pill.style.background = p.badgeColor;
        pill.style.color = '#FFF';
        pill.style.padding = '1.5px 6px';
        pill.style.borderRadius = '999px';
        pill.style.fontSize = '9px';

        const lbl = document.createElement('span');
        lbl.textContent = p.text;

        el.appendChild(pill);
        el.appendChild(lbl);
        this.calloutOverlay.appendChild(el);
        this.calloutEls.push({
          el,
          lbl,
          text: p.text,
          mobileText: p.mobileText || p.text,
          line,
          dot,
          side: p.side,
          offsetX: p.offsetX,
          offsetY: p.offsetY,
          getPos: p.getPos
        });
      });
    }

    updateCalloutPositions() {
      if (!this.calloutEls.length || !this.canvas) return;
      const show = this.explodeProgress > 0.25 && this.canvas.style.display !== 'none';
      const rect = this.container.getBoundingClientRect();
      const w = rect.width || 640;
      const h = rect.height || 480;
      const isCompact = w < 540;
      const hMargin = isCompact ? 62 : 108;
      const xScale = isCompact ? 0.56 : 1.0;
      const alpha = String(Math.min(1, (this.explodeProgress - 0.2) * 2.2));

      // Project all 3D target anchor points first
      const computed = this.calloutEls.map(item => {
        if (item.lbl) {
          item.lbl.textContent = isCompact ? item.mobileText : item.text;
        }
        item.el.style.fontSize = isCompact ? '8.5px' : '10px';
        item.el.style.padding = isCompact ? '3px 7px' : '4px 10px';

        const localPos = item.getPos();
        const worldPos = localPos.clone().applyMatrix4(this.rootGroup.matrixWorld);
        worldPos.project(this.camera);
        const tx = (worldPos.x * 0.5 + 0.5) * w;
        const ty = (-worldPos.y * 0.5 + 0.5) * h;

        let lx = Math.max(hMargin, Math.min(w - hMargin, tx + item.offsetX * xScale));
        let ly = Math.max(28, Math.min(h - 64, ty + item.offsetY));
        return { item, worldZ: worldPos.z, tx, ty, lx, ly };
      });

      // Enforce minimum vertical separation on left-side labels so they never overlap
      const leftGroup = computed.filter(c => c.item.side === 'left').sort((a, b) => a.ly - b.ly);
      for (let i = 1; i < leftGroup.length; i++) {
        if (leftGroup[i].ly - leftGroup[i - 1].ly < 42) {
          leftGroup[i].ly = Math.min(h - 56, leftGroup[i - 1].ly + 42);
        }
      }

      computed.forEach(({ item, worldZ, tx, ty, lx, ly }) => {
        if (!show || worldZ >= 1.0) {
          item.el.style.opacity = '0';
          item.line.style.opacity = '0';
          item.dot.style.opacity = '0';
          return;
        }

        item.el.style.opacity = alpha;
        item.line.style.opacity = alpha;
        item.dot.style.opacity = alpha;

        item.el.style.left = `${lx.toFixed(1)}px`;
        item.el.style.top = `${ly.toFixed(1)}px`;

        item.dot.setAttribute('cx', tx.toFixed(1));
        item.dot.setAttribute('cy', ty.toFixed(1));

        const elbowX = tx + (lx - tx) * 0.45;
        item.line.setAttribute('points', `${tx.toFixed(1)},${ty.toFixed(1)} ${elbowX.toFixed(1)},${ly.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)}`);
      });
    }

    /**
     * Side-Exploded View:
     * - Forearm, Palm, and 5 Fingers remain 100% intact as a solid bionic arm!
     * - Side/Front bottom panel (Smashing Elzing) hinges & slides open to the right side (-Y, -X).
     * - 5x 9g Servo Motors, Arduino Nano controller, and Dual-Stage Bio-Potential Amplifier
     *   expand horizontally outside into well-separated tiers so every part and label is clear.
     */
    setExplode(val) {
      this.explodeProgress = Math.max(0, Math.min(1, val));
      const p = this.explodeProgress;

      // 1. Open Side Bottom Panel to the Right Side (matching physical build photo)
      if (this.coverGroup) {
        this.coverGroup.position.set(
          -20 * p,  // Slightly forward (-X)
          -84 * p,  // Out to the right side (-Y)
          0
        );
        this.coverGroup.rotation.z = -0.58 * p;
      }

      // 2. Expand 5x 9g Servo Motors Horizontally Outside (Center-Front Bay)
      if (this.servosGroup) {
        this.servosGroup.position.set(
          this.servosBasePos.x - 54 * p, // Outward through front opening (-X)
          this.servosBasePos.y + 6 * p,  // Slightly left (+Y)
          this.servosBasePos.z
        );
      }

      // 3. Expand Arduino Nano Controller Outside (Upper-Left Tier)
      if (this.nanoGroup) {
        this.nanoGroup.position.set(
          this.nanoBasePos.x - 68 * p,   // Outward (-X)
          this.nanoBasePos.y + 62 * p,   // Left side (+Y)
          this.nanoBasePos.z + 16 * p    // Upper tier (+Z)
        );
        this.nanoGroup.rotation.z = 0.22 * p;
      }

      // 4. Expand Dual-Stage Bio-Potential Amplifier Outside (Lower-Left Tier)
      if (this.ampGroup) {
        this.ampGroup.position.set(
          this.ampBasePos.x - 78 * p,    // Outward (-X)
          this.ampBasePos.y + 92 * p,    // Further left (+Y), clear of servos & Nano
          this.ampBasePos.z - 6 * p      // Lower tier (-Z)
        );
        this.ampGroup.rotation.z = 0.28 * p;
      }

      this.updateDynamicWiring();
    }

    setGesture(gestureName) {
      if (!this.fingerAngles[gestureName]) return;
      this.currentGesture = gestureName;
      this.targetAngles = this.fingerAngles[gestureName];

      // Update 3D OLED Screen Texture ("Bionic Arm" vs "Peace")
      if (this.oledMat) {
        this.oledMat.map = gestureName === 'peace' ? this.oledTexPeace : this.oledTexOpen;
        this.oledMat.needsUpdate = true;
      }

      // Rotate 9g Servo Horns proportionally to tendon pull
      this.servoHorns.forEach((h, i) => {
        const curl = this.targetAngles[i] || 0;
        h.pivot.rotation.x = h.dir * curl * 0.55;
      });
    }

    toggleWireframe() {
      this.wireframeMode = !this.wireframeMode;
      const wf = this.wireframeMode;
      Object.values(this.materials).forEach(mat => {
        if (mat.wireframe !== undefined) mat.wireframe = wf;
      });

      const btn = document.getElementById('toggleWireframeBtn');
      if (btn) {
        btn.textContent = `CAD Wireframe: ${wf ? 'ON' : 'OFF'}`;
        btn.classList.toggle('active', wf);
      }
    }

    setLayer(layerId) {
      this.activeLayer = layerId;
      const slider = document.getElementById('explodeSlider');

      if (layerId === 'all') {
        this.setExplode(0.65);
        if (slider) slider.value = '65';
        this.setShellOpacity(1.0);
      } else if (layerId === 'shell') {
        this.setExplode(0.0);
        if (slider) slider.value = '0';
        this.setShellOpacity(1.0);
      } else if (layerId === 'pcb') {
        this.setExplode(0.95);
        if (slider) slider.value = '95';
        this.setShellOpacity(0.35);
      } else if (layerId === 'firmware') {
        this.setExplode(0.85);
        if (slider) slider.value = '85';
        this.setShellOpacity(0.35);
      }
    }

    setShellOpacity(alpha) {
      ['whitePLA', 'coverPLA', 'greyPLA'].forEach(k => {
        if (this.materials[k]) {
          this.materials[k].transparent = alpha < 0.99;
          this.materials[k].opacity = alpha;
        }
      });
    }

    simulateEEGTest() {
      const btn = document.getElementById('simulatePulseBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'EEG Pulse Syncing... ⚡';
      }

      // Ensure side panel is open so viewer sees the Bio-Amp, Arduino & Servos working together
      if (this.explodeProgress < 0.5) {
        this.setExplode(0.75);
        const slider = document.getElementById('explodeSlider');
        if (slider) slider.value = '75';
      }

      let step = 0;
      const interval = setInterval(() => {
        step++;
        const isHigh = step % 2 === 1;
        this.ledMat.color.setHex(isHigh ? 0xFF0000 : 0x450A0A);
        this.arduinoPointLight.intensity = isHigh ? 2.6 : 0.2;
        this.eegLedMat.color.setHex(isHigh ? 0x34D399 : 0x064E3B);
        this.eegPointLight.intensity = isHigh ? 2.2 : 0.3;

        if (step === 2) this.setGesture('fist');
        if (step === 7) this.setGesture('peace');
        if (step === 13) this.setGesture('open');

        if (step >= 16) {
          clearInterval(interval);
          this.ledMat.color.setHex(0xFF2E2E);
          this.arduinoPointLight.intensity = 1.1;
          this.eegLedMat.color.setHex(0x10B981);
          this.eegPointLight.intensity = 0.5;
          this.setGesture('peace');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Test EEG + Camera Gate ⚡';
          }
        }
      }, 150);
    }

    setupControls() {
      const slider = document.getElementById('explodeSlider');
      const valLabel = document.getElementById('explodeValueLabel');
      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value) / 100;
          this.setExplode(val);
          if (valLabel) {
            if (val < 0.15) valLabel.textContent = `CLOSED PANEL (${Math.round(val * 100)}%)`;
            else if (val < 0.65) valLabel.textContent = `PANEL OPEN (${Math.round(val * 100)}%)`;
            else valLabel.textContent = `SIDE EXPLODED (${Math.round(val * 100)}%)`;
          }
        });
      }

      const labTabs = document.querySelectorAll('.bionic-lab-tab');
      labTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const text = tab.textContent || '';
          this.setGesture(text.includes('Peace') ? 'peace' : 'open');
        });
      });

      const gesturePills = document.querySelectorAll('.gesture-pill[data-bionic-src]');
      gesturePills.forEach((pill) => {
        pill.addEventListener('click', () => {
          const text = pill.textContent || '';
          this.setGesture(text.includes('Peace') ? 'peace' : 'open');
        });
      });

      const wfBtn = document.getElementById('toggleWireframeBtn');
      if (wfBtn) {
        wfBtn.addEventListener('click', () => this.toggleWireframe());
      }

      const pulseBtn = document.getElementById('simulatePulseBtn');
      if (pulseBtn) {
        pulseBtn.addEventListener('click', () => this.simulateEEGTest());
      }

      const layerBtns = document.querySelectorAll('.layer-btn');
      layerBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const layer = btn.getAttribute('data-layer');
          if (layer) this.setLayer(layer);
        });
      });
    }

    setupDOMEvents() {
      const visActions = document.querySelector('.vis-actions');
      if (visActions && !document.getElementById('mode3dToggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mode3dToggle';
        toggleBtn.type = 'button';
        toggleBtn.className = 'vis-mini-btn active';
        toggleBtn.textContent = '3D CAD Model';
        toggleBtn.style.marginRight = '0.35rem';

        toggleBtn.addEventListener('click', () => {
          const svgLayers = document.querySelectorAll('.iso-layer');
          const is3d = this.canvas.style.display !== 'none';
          if (is3d) {
            this.canvas.style.display = 'none';
            if (this.calloutOverlay) this.calloutOverlay.style.display = 'none';
            svgLayers.forEach(l => l.style.display = 'block');
            toggleBtn.textContent = 'Schematic View';
            toggleBtn.classList.remove('active');
          } else {
            this.canvas.style.display = 'block';
            if (this.calloutOverlay) this.calloutOverlay.style.display = 'block';
            svgLayers.forEach(l => l.style.display = 'none');
            toggleBtn.textContent = '3D CAD Model';
            toggleBtn.classList.add('active');
          }
        });

        visActions.insertBefore(toggleBtn, visActions.firstChild);
      }

      const svgLayers = document.querySelectorAll('.iso-layer');
      svgLayers.forEach(l => l.style.display = 'none');
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      // Smooth multi-phalanx finger articulation
      const targets = this.targetAngles || this.fingerAngles[this.currentGesture];
      if (targets) {
        for (let i = 0; i < 5; i++) {
          this.currentAngles[i] += (targets[i] - this.currentAngles[i]) * 0.12;
        }

        Object.values(this.fingerChains).forEach((chain) => {
          const curl = this.currentAngles[chain.index];
          chain.jointGroups.forEach((jg, pIdx) => {
            // Negative Y rotation curls +Z phalanx toward -X (the palm)
            jg.rotation.y = -curl * chain.ratios[pIdx];
          });
        });
      }

      // Heartbeat pulse on Arduino red status LED
      if (this.arduinoPointLight) {
        const t = performance.now() * 0.003;
        this.arduinoPointLight.intensity = 0.85 + Math.sin(t * 3.0) * 0.25;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.updateCalloutPositions();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BionicArmViewer());
  } else {
    new BionicArmViewer();
  }
})();
