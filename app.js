/**
 * ABDUL FAZIL ABDUL SALAM — PORTFOLIO CONTROLLER
 * 100% Verified Project & Experience Data from Master Resume
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================
     1. HERO INTERACTIVE SKILL PILLS & WATERMARK CONTROLLER
     ========================================================== */
  const heroSection = document.getElementById('hero');
  const backdropWord = document.getElementById('heroBackdropWord');
  const portraitImg = document.getElementById('heroPortraitImg');
  const skillPills = document.querySelectorAll('.skill-pill');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  const defaultWatermark = 'ENGINEER';

  /* Live Hero Portrait Switcher (if present) */
  const portraitOptBtns = document.querySelectorAll('.portrait-opt-btn');
  if (portraitOptBtns.length > 0) {
    portraitOptBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        portraitOptBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const newSrc = btn.getAttribute('data-portrait-src');
        if (portraitImg && newSrc) {
          portraitImg.style.opacity = '0.3';
          setTimeout(() => {
            portraitImg.src = newSrc;
            portraitImg.style.opacity = '1';
          }, 120);
        }
      });
    });
  }

  function filterProjectsByTrack(filterKey) {
    filterBtns.forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-filter') === filterKey);
    });
    projectCards.forEach((card) => {
      const cats = card.getAttribute('data-category') || '';
      if (filterKey === 'all' || cats.includes(filterKey)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  skillPills.forEach((pill) => {
    pill.addEventListener('mouseenter', () => {
      const targetWord = pill.getAttribute('data-watermark') || defaultWatermark;
      const domain = pill.getAttribute('data-domain');

      if (backdropWord && backdropWord.textContent !== targetWord) {
        backdropWord.style.opacity = '0.04';
        backdropWord.style.transform = 'scale(0.985)';
        setTimeout(() => {
          backdropWord.textContent = targetWord;
          backdropWord.style.opacity = '1';
          backdropWord.style.transform = 'scale(1)';
          backdropWord.style.color =
            domain === '3d'
              ? 'rgba(232, 93, 42, 0.16)'
              : 'rgba(24, 121, 78, 0.16)';
        }, 110);
      }

      if (heroSection) {
        heroSection.classList.remove('highlight-3d', 'highlight-embedded');
        if (domain === '3d') heroSection.classList.add('highlight-3d');
        if (domain === 'embedded') heroSection.classList.add('highlight-embedded');
      }
    });

    pill.addEventListener('mouseleave', () => {
      if (backdropWord) {
        backdropWord.textContent = defaultWatermark;
        backdropWord.style.color = 'rgba(20, 20, 19, 0.13)';
      }
      if (heroSection) {
        heroSection.classList.remove('highlight-3d', 'highlight-embedded');
      }
    });

    pill.addEventListener('click', () => {
      const jumpFilter = pill.getAttribute('data-filter-jump') || 'all';
      filterProjectsByTrack(jumpFilter);
      const workSection = document.getElementById('work');
      if (workSection) {
        workSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* Subtle Smooth Mouse Parallax on Hero Stage */
  if (heroSection && portraitImg && backdropWord) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;

      portraitImg.style.transform = `translate3d(${normX * 10}px, ${normY * 6}px, 0)`;
      backdropWord.style.transform = `translate3d(${-normX * 18}px, ${-normY * 8}px, 0)`;
    });

    heroSection.addEventListener('mouseleave', () => {
      portraitImg.style.transform = 'translate3d(0, 0, 0)';
      backdropWord.style.transform = 'translate3d(0, 0, 0)';
    });
  }

  /* ==========================================================
     2. INTERACTIVE BCI BIONIC ARM + TL074 PCB STACK EXPLODER
     ========================================================== */
  const explodeSlider = document.getElementById('explodeSlider');
  const explodeValueLabel = document.getElementById('explodeValueLabel');
  const isoLayerTop = document.getElementById('isoLayerTop');
  const isoLayerMid = document.getElementById('isoLayerMid');
  const isoLayerBot = document.getElementById('isoLayerBot');
  const isoViewport = document.getElementById('isoViewport');
  const layerBtns = document.querySelectorAll('.layer-btn');
  const visLayerTitle = document.getElementById('visLayerTitle');
  const toggleWireframeBtn = document.getElementById('toggleWireframeBtn');
  const simulatePulseBtn = document.getElementById('simulatePulseBtn');

  const telemMat = document.getElementById('telemMat');
  const telemTol = document.getElementById('telemTol');
  const telemMcu = document.getElementById('telemMcu');
  const telemPwr = document.getElementById('telemPwr');

  function updateStackSeparation(percent) {
    const p = Number(percent) / 100;
    const topOffset = -95 * p;
    const botOffset = 95 * p;

    if (isoLayerTop) isoLayerTop.style.transform = `translateY(${topOffset}px)`;
    if (isoLayerMid) isoLayerMid.style.transform = `translateY(0px)`;
    if (isoLayerBot) isoLayerBot.style.transform = `translateY(${botOffset}px)`;

    if (explodeValueLabel) {
      if (percent < 12) {
        explodeValueLabel.textContent = `CLOSED PANEL (${percent}%)`;
      } else if (percent > 80) {
        explodeValueLabel.textContent = `SIDE EXPLODED (${percent}%)`;
      } else {
        explodeValueLabel.textContent = `PANEL OPEN (${percent}%)`;
      }
    }
  }

  if (explodeSlider) {
    updateStackSeparation(explodeSlider.value);
    explodeSlider.addEventListener('input', (e) => {
      updateStackSeparation(e.target.value);
    });
  }

  const layerConfigs = {
    all: {
      title: 'SYSTEM: BCI BIONIC ARM + TL074 BIO-AMP STACK',
      slider: 85,
      opacities: [1, 1, 1],
      telem: [
        'FUSION 360 • 1.4–1.5 kg PLA',
        'TL074 • 20–500 Hz BANDPASS',
        'ARDUINO C • 10 GESTURES',
        'INR 1,00,000 TNSI WINNER'
      ]
    },
    shell: {
      title: 'LAYER 01: AUTODESK FUSION 360 3D-PRINTED ARM',
      slider: 95,
      opacities: [1, 0.25, 0.25],
      telem: [
        '7 FUSION 360 ITERATIONS',
        '1.4 TO 1.5 kg PLA PRINT',
        'GD&T VERIFIED FIT',
        'INDEPENDENT FINGER LINKS'
      ]
    },
    pcb: {
      title: 'LAYER 02: AUTODESK EAGLE 2-LAYER TL074 PCB',
      slider: 90,
      opacities: [0.2, 1, 0.2],
      telem: [
        '2-LAYER EAGLE PCB',
        'TL074 DUAL-STAGE OP-AMP',
        '20–500 Hz BANDPASS STAGE',
        '50/60 Hz NOISE REJECTION'
      ]
    },
    firmware: {
      title: 'LAYER 03: EMBEDDED C SERVO CONTROL & AI SAFETY GATE',
      slider: 70,
      opacities: [0.22, 0.85, 1],
      telem: [
        'EMBEDDED C ON ARDUINO',
        '10 COORDINATED GESTURES',
        'EEG + TENSORFLOW GATE',
        '~50 VALIDATION TRIALS'
      ]
    }
  };

  layerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      layerBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const layerKey = btn.getAttribute('data-layer') || 'all';
      const cfg = layerConfigs[layerKey];
      if (!cfg) return;

      if (visLayerTitle) visLayerTitle.textContent = cfg.title;
      if (explodeSlider) {
        explodeSlider.value = cfg.slider;
        updateStackSeparation(cfg.slider);
      }

      if (isoLayerTop) isoLayerTop.style.opacity = cfg.opacities[0];
      if (isoLayerMid) isoLayerMid.style.opacity = cfg.opacities[1];
      if (isoLayerBot) isoLayerBot.style.opacity = cfg.opacities[2];

      if (telemMat) telemMat.textContent = cfg.telem[0];
      if (telemTol) telemTol.textContent = cfg.telem[1];
      if (telemMcu) telemMcu.textContent = cfg.telem[2];
      if (telemPwr) telemPwr.textContent = cfg.telem[3];
    });
  });

  if (toggleWireframeBtn && isoViewport) {
    let wireframeOn = false;
    toggleWireframeBtn.addEventListener('click', () => {
      wireframeOn = !wireframeOn;
      isoViewport.classList.toggle('wireframe-mode', wireframeOn);
      toggleWireframeBtn.textContent = `CAD Wireframe: ${wireframeOn ? 'ON' : 'OFF'}`;
    });
  }

  if (simulatePulseBtn && isoViewport) {
    simulatePulseBtn.addEventListener('click', () => {
      isoViewport.classList.add('signal-burst');
      simulatePulseBtn.textContent = 'EEG + Camera Confirmed ✓';
      const labImg = document.getElementById('bionicLabPreviewImg');
      if (labImg) {
        labImg.src = 'assets/bionic-arm-studio-peace.jpg';
      }
      setTimeout(() => {
        isoViewport.classList.remove('signal-burst');
        simulatePulseBtn.textContent = 'Test EEG + Camera Gate ⚡';
      }, 1200);
    });
  }

  /* Live Bionic Arm Gesture Switchers ("Bionic Arm" Open <-> "Peace" Gesture) */
  const bionicLabTabs = document.querySelectorAll('.bionic-lab-tab');
  const bionicLabPreviewImg = document.getElementById('bionicLabPreviewImg');
  bionicLabTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      bionicLabTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const targetSrc = tab.getAttribute('data-lab-img');
      if (bionicLabPreviewImg && targetSrc) {
        bionicLabPreviewImg.src = targetSrc;
      }
    });
  });

  const gesturePills = document.querySelectorAll('[data-bionic-src]');
  const bionicCardImg = document.getElementById('bionicCardImg');
  gesturePills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      gesturePills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const targetSrc = pill.getAttribute('data-bionic-src');
      if (bionicCardImg && targetSrc) {
        bionicCardImg.src = targetSrc;
      }
    });
  });

  /* Neural Amp PCB View Switcher (Front Gold ENIG <-> Back TL074 IC) */
  const pcbViewBtns = document.querySelectorAll('[data-pcb-src]');
  const neuralAmpCardImg = document.getElementById('neuralAmpCardImg');
  pcbViewBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pcbViewBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetSrc = btn.getAttribute('data-pcb-src');
      if (neuralAmpCardImg && targetSrc) {
        neuralAmpCardImg.src = targetSrc;
      }
    });
  });

  /* ==========================================================
     3. PROJECT FILTERING & 100% VERIFIED BLUEPRINT SPEC MODAL
     ========================================================== */
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter') || 'all';
      filterProjectsByTrack(filter);
    });
  });

  const projectsBlueprintData = [
    {
      code: 'PROJECT 01 // EMB • ROB • AI (2022)',
      title: 'BCI-Controlled Bionic Arm for Upper Limb Amputees',
      img: 'assets/project-bionic-arm.jpg',
      summary:
        'Mind-controlled prosthetic arm that moves only when the user’s brain signal and a camera both confirm the target, winning the INR 1,00,000 TNSI 2022 national innovation prize from the Government of Tamil Nadu.',
      specs3d: [
        'Designed the prosthetic arm in Autodesk Fusion 360 across 7 mechanical iterations',
        '3D-printed in PLA at a total weight of 1.4 to 1.5 kg',
        'Custom 2-layer TL074 bio-potential amplifier PCB serves as the EEG/EMG control input',
        'Won 1st Place at Project Expo 2022 (SRM TRP) and Runner-Up in the IEEE Region 10 (Asia-Pacific) Project Video Contest 2021'
      ],
      specsEmb: [
        'Developed servo firmware in Embedded C on Arduino for independent finger control, grip force, and 10 coordinated gestures',
        'Engineered a dual-check safety gate fusing EEG attention with a Python/TensorFlow object-detection pipeline',
        'Across ~50 test trials, traced and fixed a safety gate fault caused by EMG signal reception'
      ]
    },
    {
      code: 'PROJECT 02 // EMB • ANALOG PCB DESIGN',
      title: 'Custom PCB: Dual-Stage Bio-Potential Amplifier (Neural Amp v0.1)',
      img: 'assets/project-neural-amp-front.png',
      summary:
        'Custom bio-potential analog signal-conditioning PCB (Femto 3D Neural Amp v0.1) engineered in Autodesk Eagle to amplify microvolt-level bio-potentials (EMG/EEG) with active filtering for the BCI bionic arm.',
      specs3d: [
        'Schematic capture and 2-layer PCB layout completed in Autodesk Eagle with ENIG gold surface finish',
        'Built with DIP-14 TL074 low-noise JFET-input operational amplifier on the back side',
        'Hardware front-end control interface for the BCI-Controlled Bionic Arm',
        'Silk-screened hardware branding: femto 3d • Neural amp v0.1 (Feb 2022)'
      ],
      specsEmb: [
        'Boosts µV-level EMG/EEG signals to clean mV range with dual-stage gain trimming',
        'Integrated active 20 to 500 Hz bandpass filtering stage with dedicated reference (REF)',
        '50/60 Hz power-line noise rejection verified via oscilloscope bring-up'
      ]
    },
    {
      code: 'PROJECT 03 // ROB • EMB • 3D PRINTING',
      title: 'Quadruped Walking Robot (Custom 3D Chassis)',
      img: 'assets/project-quadruped-robot.png',
      summary:
        'A multi-legged walking robot prototype combining a 3D-printed chassis and articulated limbs with servo actuation, ultrasonic distance navigation, and onboard power regulation.',
      specs3d: [
        'Custom 3D-printed modular chassis and lightweight leg linkages designed and fabricated in-house',
        'Independent servo-driven joints on each limb enabling multi-axis step kinematics',
        'Front-mounted HC-SR04 ultrasonic distance sensor bracket for real-time obstacle detection',
        'Integrated underbelly lithium battery compartment and cable management routing'
      ],
      specsEmb: [
        'Programmed in Embedded C on an Arduino microcontroller architecture',
        'Inverse and forward step timing gait algorithms coordinating smooth leg lift and sweep',
        'Autonomous obstacle avoidance loop scanning surroundings and pivoting in real time'
      ]
    },
    {
      code: 'PROJECT 04 // ROB • CTRL • EMB (2025)',
      title: 'Surveillance Quadrotor (AIRC Lab, University of Windsor)',
      img: 'assets/project-surveillance-quadrotor.png',
      summary:
        'Camera-equipped autonomous surveillance quadrotor built as a volunteer researcher at the University of Windsor AIRC Lab and flight-verified out to a 1 km operational range.',
      specs3d: [
        'Built on a multi-rotor composite frame with gold brushless outrunners and central flight avionics deck',
        'Mast-mounted GPS module and compass mast for accurate positioning and geofencing',
        'Paired with RadioLink T8FB 2.4 GHz digital transmitter system',
        'Flight-verified in field testing out to a 1 km range'
      ],
      specsEmb: [
        'Configured and tuned on the ArduPilot autopilot stack',
        'GPS waypoint mapping and real-time telemetry link',
        'Configured geofencing boundaries and automatic Return-to-Home (RTH) fail-safe protection'
      ]
    },
    {
      code: 'PROJECT 05 // CTRL • ROB — MEng CAPSTONE (2026)',
      title: 'Real-Time LQG Lane-Change Controller',
      img: 'assets/project-lqg-controller.png',
      summary:
        'MEng ECE capstone at the University of Windsor: a 100 Hz Linear-Quadratic-Gaussian (LQG) lateral vehicle controller combining LQR optimal control with discrete Kalman state estimation.',
      specs3d: [
        'Simulation workbench running MATLAB state-space model, Kalman filter script, and trajectory plots',
        '100 Hz LQG lateral controller on a 4-state bicycle model tracking a 3.5 m lane change from noisy measurements',
        'Discrete Kalman filter (ZOH discretization, Joseph-form covariance update) estimating unmeasured lateral velocity and yaw rate',
        'Mathematical derivation and closed-loop eigenvalue stability validation'
      ],
      specsEmb: [
        'Validated via 200-run Monte Carlo trials, t-tests, and sensor-noise sweeps across 40, 80, and 120 km/h',
        'Cut tracking RMSE by 7% to 25% on the linear plant and by up to 59% (0.236 m to 0.097 m) on a nonlinear Pacejka tyre plant at 40 km/h under high sensor noise',
        'Diagnosed Kalman filter divergence at 80–120 km/h on the nonlinear plant (up to 2.6× higher error than direct feedback) from tyre saturation & model mismatch, specifying EKF/UKF, gain scheduling, and MPC as the fix'
      ]
    },
    {
      code: 'PROJECT 06 // IOT • EMB • CLOUD',
      title: 'Home & Plant Health Monitoring Platform',
      img: 'assets/project-esp32-iot.jpg',
      summary:
        'End-to-end IoT telemetry system where ESP32 sensor nodes stream environmental and multi-channel plant data to a self-hosted cloud stack on an Oracle Cloud ARM VM.',
      specs3d: [
        'ESP32 edge hardware interfacing with DHT11 temperature/humidity, BH1750 ambient light, and 4 soil-moisture sensor channels',
        'Room monitor samples temperature and humidity every minute (1,440 readings/day) and stores 10-minute averages',
        'Per-sensor dry/wet calibration with automatic dry-soil and low-light alerts'
      ],
      specsEmb: [
        'Self-hosted Node.js REST API and SQLite database behind nginx on an Oracle Cloud ARM VM',
        'Running continuously for 2+ months at $0 hosting cost',
        'Interactive historical charting spanning from 1 hour to 1 year'
      ]
    },
    {
      code: 'PROJECT 07 // IOT • EMB • MQTT',
      title: 'Campus IoT Automation System',
      img: 'assets/project-campus-iot-box.png',
      summary:
        'University-scale IoT automation network controlling ~20 switches and appliances through distributed ESP32/ESP8266 nodes and a central Raspberry Pi MQTT gateway.',
      specs3d: [
        'Custom 3D-printed translucent switchgear enclosure with integrated toggle switches and internal illumination',
        'Fabricated at SRM TRPEC for hands-on campus room hardware deployment',
        'Multi-sensor fusion reading temperature, humidity, motion, ambient light, and gas sensors',
        'Central Raspberry Pi Embedded Linux gateway managing MQTT broker traffic'
      ],
      specsEmb: [
        'Threshold-based automated switching for ~20 electrical devices and switches',
        'Over-the-Air (OTA) firmware updates eliminating manual reflashing of individual nodes',
        'Python data logging pipeline with automated anomaly alerts'
      ]
    },
    {
      code: 'PROJECT 08 // MFG • FULL-STACK (GALATI CHEESE)',
      title: 'ShredStock — Manufacturing Inventory & Alert Platform',
      img: 'assets/project-shredstock-display.png',
      summary:
        'Production inventory web application built at Galati Cheese Company after a material shortage stopped production—delivering zero stock-outs since launch.',
      specs3d: [
        'Real-time production monitoring dashboard tracking daily cheese output, yield, and prep time metrics',
        'Replaced untracked and paper records for all non-cheese production materials (boxes, CO2, sanitation chemicals, pallets, packaging)',
        'Used twice a week by the plant manager to place supplier orders via automated Excel exports',
        'Low-stock alert system has delivered zero material stock-outs since launch'
      ],
      specsEmb: [
        'Frontend built with React and TypeScript',
        'Backend powered by Node.js, Express, Prisma ORM, and SQLite with JWT role-based access control',
        'Deployed on Oracle Cloud Infrastructure (OCI)'
      ]
    },
    {
      code: 'PROJECT 09 // IOT • SECURITY',
      title: 'Intruder Alert & Surveillance System',
      img: 'assets/project-intruder-alert.png',
      summary:
        'Event-driven smart security camera system combining an ESP32-CAM and Raspberry Pi with PIR motion triggers and automated email photo dispatches.',
      specs3d: [
        'Custom 3D-printed enclosure housing the ESP32-CAM, dome PIR lens, status LED, and high-gain external antenna',
        'Precision camera and sensor alignment ports for wide-angle detection coverage',
        'Live local video streaming feed for real-time monitoring'
      ],
      specsEmb: [
        'Python automation service that captures a snapshot on PIR motion and emails it automatically via SMTP',
        'Configurable motion detection zones and scheduled alert suppression windows'
      ]
    }
  ];

  const modal = document.getElementById('blueprintModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCode = document.getElementById('modalCode');
  const modalTitle = document.getElementById('modalTitle');
  const modalImg = document.getElementById('modalImg');
  const modalSummary = document.getElementById('modalSummary');
  const modal3dList = document.getElementById('modal3dList');
  const modalEmbList = document.getElementById('modalEmbList');

  document.querySelectorAll('.btn-inspect-project').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-project-index') || 0);
      const data = projectsBlueprintData[idx];
      if (!data || !modal) return;

      modalCode.textContent = data.code;
      modalTitle.textContent = data.title;
      modalImg.src = data.img;
      modalImg.alt = data.title;
      modalSummary.textContent = data.summary;

      modal3dList.innerHTML = data.specs3d.map((item) => `<li>${item}</li>`).join('');
      modalEmbList.innerHTML = data.specsEmb.map((item) => `<li>${item}</li>`).join('');

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ==========================================================
     4. DIRECT MESSAGE COMPOSER & LINKEDIN CONNECT
     ========================================================== */
  const topicChips = document.querySelectorAll('.topic-chip');
  const pingMessage = document.getElementById('pingMessage');
  const quickPingForm = document.getElementById('quickPingForm');
  const formFeedback = document.getElementById('formFeedback');

  let selectedTopic = 'Embedded Systems / Firmware Role';

  topicChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      topicChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedTopic = chip.getAttribute('data-topic') || 'Engineering Opportunity';
    });
  });

  if (quickPingForm) {
    quickPingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const note =
        (pingMessage && pingMessage.value.trim()) ||
        `Hi Fazil! I reviewed your portfolio and would love to connect regarding ${selectedTopic}.`;
      const fullText = `[${selectedTopic}] ${note}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).catch(() => {});
      }

      if (formFeedback) {
        formFeedback.textContent =
          '✓ Message copied to clipboard! Opening Abdul Fazil’s LinkedIn (/in/connectfazil)...';
      }

      setTimeout(() => {
        window.open('https://www.linkedin.com/in/connectfazil', '_blank', 'noopener');
      }, 450);
    });
  }
});
