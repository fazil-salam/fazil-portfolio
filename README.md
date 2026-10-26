# Abdul Fazil — Portfolio Website

A clean, responsive, and minimalist portfolio website showcasing 3D printing prototyping, embedded systems, robotics, and IoT hardware engineering.

## Directory Structure

```
fazil-portfolio/
├── index.html        # Main HTML structure with all 9 verified projects & sections
├── styles.css        # Responsive styling with modern minimal industrial aesthetic
├── app.js            # Interactive logic (layer visualizer, modals, gesture switchers)
├── README.md         # Documentation and setup instructions
└── assets/           # High-resolution studio & build photos + transparent cutouts
    ├── portrait-actual-hero-cutout.png # Primary hero cutout
    ├── portrait-real-suit-cutout.png   # Suit portrait option
    ├── bionic-arm-studio-open.jpg      # Bionic Arm (Open gesture)
    ├── bionic-arm-studio-peace.jpg     # Bionic Arm (Peace gesture)
    ├── project-neural-amp-front.png    # Femto 3D Neural Amp v0.1 (Front)
    ├── project-neural-amp-ic.png       # Femto 3D Neural Amp v0.1 (Back)
    ├── project-quadruped-robot.png     # 3D-Printed Quadruped Walking Robot
    ├── project-surveillance-quadrotor.png # AIRC Lab Surveillance Quadrotor & RadioLink
    ├── project-lqg-controller.png      # MATLAB LQG Lane-Change Simulation
    ├── project-esp32-iot.jpg           # Home & Plant Health Monitoring System
    ├── project-campus-iot-box.png      # Campus IoT Automation Unit
    ├── project-shredstock-display.png  # ShredStock Production Dashboard
    └── project-intruder-alert.png      # ESP32-CAM & PIR Security Unit
```

## How to Run Locally

You can open the site directly without requiring any build step or package manager:

### Option 1: Direct File Opening
Double-click `index.html` or open it with any web browser (Chrome, Safari, Firefox, Edge).

### Option 2: Local HTTP Server (Python)
If you prefer running via a local server:
```bash
cd fazil-portfolio
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

## Features
- **Hero Section**: Studio headshot layered in front of background typography, with interactive skill badges that highlight circuit paths on hover.
- **Interactive 3D × PCB Stack Lab**: Interactive layer separation slider and signal simulation.
- **Project Showcase**: Filterable cards with dual-specification hardware strips and full blueprint modals.
- **Work Experience & Academic Timeline**: 100% verified credentials and achievements.
- **Contact & Direct Messaging**: Instant copy-to-clipboard preformatted message and direct LinkedIn link.
