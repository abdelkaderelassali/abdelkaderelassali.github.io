/**
 * Portfolio JavaScript — Abdelkader Elassali
 * Interactive 3D Three.js Constellation, Typewriter, Filters, Modal, and Navigation
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. INTERACTIVE 3D CONSTELLATION BACKGROUND (THREE.JS / CANVAS FALLBACK)
     ========================================================================== */
  const canvas = document.getElementById('bg-canvas');
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - windowHalfX) * 0.0006;
    mouseY = (e.clientY - windowHalfY) * 0.0006;
  });

  // Try initializing Three.js 3D Constellation
  if (typeof THREE !== 'undefined') {
    initThreeConstellation();
  } else {
    initCanvas2DFallback();
  }

  function initThreeConstellation() {
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.z = 600;

      const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const particleCount = window.innerWidth < 768 ? 70 : 130;
      const maxDistance = window.innerWidth < 768 ? 120 : 150;
      const positions = new Float32Array(particleCount * 3);
      const velocities = [];

      const range = 700;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * range * 1.6;
        positions[i * 3 + 1] = (Math.random() - 0.5) * range;
        positions[i * 3 + 2] = (Math.random() - 0.5) * range;

        velocities.push({
          x: (Math.random() - 0.5) * 0.45,
          y: (Math.random() - 0.5) * 0.45,
          z: (Math.random() - 0.5) * 0.45
        });
      }

      // 1. Points Geometry
      const pointGeometry = new THREE.BufferGeometry();
      pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Create glowing circular sprite
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 32;
      spriteCanvas.height = 32;
      const ctx = spriteCanvas.getContext('2d');
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 1)');
      gradient.addColorStop(0.3, 'rgba(56, 189, 248, 0.7)');
      gradient.addColorStop(0.8, 'rgba(14, 165, 233, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);

      const pointTexture = new THREE.CanvasTexture(spriteCanvas);
      const pointMaterial = new THREE.PointsMaterial({
        size: 9,
        map: pointTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const particleSystem = new THREE.Points(pointGeometry, pointMaterial);
      scene.add(particleSystem);

      // 2. Dynamic Connecting Lines
      const linePositions = new Float32Array(particleCount * particleCount * 6);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineMesh);

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      function animate() {
        requestAnimationFrame(animate);

        // Smooth camera drift based on mouse
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        camera.position.x += (targetX * 250 - camera.position.x) * 0.05;
        camera.position.y += (-targetY * 250 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Slow automatic rotation
        particleSystem.rotation.y += 0.0006;
        lineMesh.rotation.y += 0.0006;

        // Update positions
        let lineIdx = 0;
        const pos = pointGeometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] += velocities[i].x;
          pos[i * 3 + 1] += velocities[i].y;
          pos[i * 3 + 2] += velocities[i].z;

          // Boundary bouncing
          if (pos[i * 3] < -range * 0.9 || pos[i * 3] > range * 0.9) velocities[i].x *= -1;
          if (pos[i * 3 + 1] < -range * 0.55 || pos[i * 3 + 1] > range * 0.55) velocities[i].y *= -1;
          if (pos[i * 3 + 2] < -range * 0.55 || pos[i * 3 + 2] > range * 0.55) velocities[i].z *= -1;

          // Connect to nearby points
          for (let j = i + 1; j < particleCount; j++) {
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < maxDistance) {
              linePositions[lineIdx++] = pos[i * 3];
              linePositions[lineIdx++] = pos[i * 3 + 1];
              linePositions[lineIdx++] = pos[i * 3 + 2];

              linePositions[lineIdx++] = pos[j * 3];
              linePositions[lineIdx++] = pos[j * 3 + 1];
              linePositions[lineIdx++] = pos[j * 3 + 2];
            }
          }
        }

        pointGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineIdx / 3);

        renderer.render(scene, camera);
      }

      animate();
    } catch (err) {
      console.warn('Three.js failed to initialize, falling back to 2D Canvas:', err);
      initCanvas2DFallback();
    }
  }

  function initCanvas2DFallback() {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = window.innerWidth < 768 ? 45 : 85;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1.5
      });
    }

    function animate2D() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate2D);
    }
    animate2D();
  }


  /* ==========================================================================
     2. TYPEWRITER EFFECT FOR HERO SUBTITLE
     ========================================================================== */
  const typewriterEl = document.getElementById('typewriter-text');
  const roles = [
    'AI & Data Engineer',
    'LLM & Agentic RAG Engineer',
    'Multi-Agent Systems Engineer',
    'Machine Learning Specialist'
  ];

  let roleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function typeRole() {
    const currentRole = roles[roleIdx];

    if (isDeleting) {
      typewriterEl.textContent = currentRole.substring(0, charIdx - 1);
      charIdx--;
      typeSpeed = 45;
    } else {
      typewriterEl.textContent = currentRole.substring(0, charIdx + 1);
      charIdx++;
      typeSpeed = 95;
    }

    if (!isDeleting && charIdx === currentRole.length) {
      isDeleting = true;
      typeSpeed = 1900; // Pause at end of word
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
      typeSpeed = 350; // Pause before typing next word
    }

    setTimeout(typeRole, typeSpeed);
  }

  if (typewriterEl) {
    typeRole();
  }


  /* ==========================================================================
     3. STICKY NAVBAR & ACTIVE LINK TRACKING
     ========================================================================== */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  const observerOptions = {
    root: null,
    rootMargin: '-25% 0px -55% 0px',
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => navObserver.observe(section));


  /* ==========================================================================
     4. MOBILE MENU (HAMBURGER)
     ========================================================================== */
  const hamburger = document.getElementById('hamburger');
  const navLinksMenu = document.getElementById('nav-links');

  if (hamburger && navLinksMenu) {
    hamburger.addEventListener('click', () => {
      navLinksMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navLinksMenu.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }


  /* ==========================================================================
     5. PROJECT CATEGORY FILTERING
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 40);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });


  /* ==========================================================================
     6. FLOATING SCROLL TO TOP BUTTON
     ========================================================================== */
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }


  /* ==========================================================================
     7. PROJECT STORY MODAL POPUP
     ========================================================================== */
  const projectStories = {
    token: {
      title: 'Token Efficient — Multi-Agent LLM System',
      category: 'Multi-Agent Systems & LLM Research',
      body: `
        <h4>The Challenge</h4>
        <p>In iterative multi-agent architectures (MAS), LLM reasoning chains scale quadratically with task complexity, driving up inference latency and API token expenditures to unsustainable levels.</p>

        <h4>The Solution</h4>
        <p>Architected a cooperative multi-agent system combining <strong>LangGraph</strong> for stateful graph orchestration, local <strong>Ollama (Llama 3)</strong> for offline inference, and deterministic Python verification routines. The deterministic validators intercept agent outputs, directly checking formatting and logic constraints before invoking downstream reasoning steps.</p>

        <h4>Key Results & Metrics</h4>
        <ul>
          <li><strong>57% Reduction in Token Consumption</strong>: Validated across synthetic and domain-specific benchmarks compared to unstructured iterative prompting.</li>
          <li><strong>137 Comprehensive Unit Tests</strong>: Ensuring robust agent transitions, error recovery, and zero hallucinated schema deviations.</li>
          <li><strong>Production-Ready Stack</strong>: Fully containerized with Docker, exposed via an asynchronous FastAPI microservice backend with an interactive web UI.</li>
        </ul>
      `,
      footer: `
        <a href="../rapport_last.pdf" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">View PFA Report 📄</a>
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
      `
    },

    logistics: {
      title: 'Smart Logistics Multi-Agent Orchestrator',
      category: 'Generative AI & Agentic RAG',
      body: `
        <h4>The Challenge</h4>
        <p>Global supply chain logistics decisions require reconciling massive volumes of unstructured shipping manifests, multimodal transport delays, and dynamic routing exceptions in near-real-time.</p>

        <h4>The Solution</h4>
        <p>Engineered an autonomous Multi-Agent System (MAS) comprising 4 specialized expert agents orchestrated through <strong>LangGraph</strong>. Built a Retrieval-Augmented Generation (RAG) pipeline leveraging <strong>LlamaIndex</strong> and <strong>ChromaDB</strong> vector database to index and query internal freight documents with sub-second retrieval.</p>

        <h4>Key Results & Metrics</h4>
        <ul>
          <li><strong>4 Autonomous Specialized Agents</strong>: Task Dispatcher, Route Optimizer, Incident Analyzer, and SLA Compliance Auditor.</li>
          <li><strong>Real-Time Geospatial Visualizer</strong>: Interactive Leaflet map dashboard visualizing fleet telemetry and automated rerouting decisions.</li>
          <li><strong>High-Speed Groq Llama 3.1 Inference</strong>: Achieving ultra-fast response times for time-critical maritime and land transport scenarios.</li>
        </ul>
      `,
      footer: `
        <a href="../rapport (9).pdf" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">View Project Report 📄</a>
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
      `
    },

    smartreco: {
      title: 'SmartReco — Hybrid Recommendation & Visual Search',
      category: 'Deep Learning & Recommendation Systems',
      body: `
        <h4>The Challenge</h4>
        <p>Traditional e-commerce recommendation engines suffer from severe cold-start penalties for new items and fail to capture user visual intent when shopping for fashion and lifestyle products.</p>

        <h4>The Solution</h4>
        <p>Developed a dual-engine hybrid architecture: collaborative filtering using <strong>Singular Value Decomposition (SVD)</strong> combined with content-based filtering (TF-IDF metadata extraction), paired with a deep convolutional neural network (<strong>CNN ResNet50</strong>) for visual embeddings and reverse-image catalog search.</p>

        <h4>Key Results & Metrics</h4>
        <ul>
          <li><strong>Visual Feature Embeddings</strong>: Pre-trained ResNet50 backbone extracting 2048-dimensional embeddings to perform cosine similarity nearest-neighbor image retrieval.</li>
          <li><strong>Decoupled Architecture</strong>: Ultra-fast React + Vite single-page application with reactive state handled by Nanostores, communicating via REST with a Flask API backend.</li>
          <li><strong>Cold-Start Mitigation</strong>: Automatic fallback from matrix factorization to visual & metadata-based recommendations when user history is scarce.</li>
        </ul>
      `,
      footer: `
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
        <a href="../rapport_smartreco.pdf" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">View Report (85 pages) 📄</a>
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
      `
    },

    churn: {
      title: 'Customer Churn Predictive Pipeline',
      category: 'Machine Learning & Predictive Analytics',
      body: `
        <h4>The Challenge</h4>
        <p>Anticipating customer attrition before cancellation requires extracting subtle behavioral signals across high-dimensional, imbalanced customer datasets containing missing values and non-linear interactions.</p>

        <h4>The Solution</h4>
        <p>Built an end-to-end machine learning classification pipeline over 10,000+ customer records. The pipeline includes extensive exploratory data analysis (EDA), automated outlier detection, missing-value imputation, one-hot encoding, and feature importance analysis.</p>

        <h4>Key Results & Metrics</h4>
        <ul>
          <li><strong>85% Classification Accuracy</strong>: Trained and tuned Random Forest and Logistic Regression models with cross-validation and hyperparameter optimization.</li>
          <li><strong>Feature Importance Insights</strong>: Identified key churn drivers (contract duration, monthly charges, customer service interaction frequency) for targeted business retention actions.</li>
          <li><strong>Robust ROC-AUC Score</strong>: Validated performance against severe class imbalance using stratified k-fold splits.</li>
        </ul>
      `,
      footer: `
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
      `
    },

    press: {
      title: 'Real-Time Data Engineering Pipeline — Press Intelligence',
      category: 'Big Data & Streaming ETL',
      body: `
        <h4>The Challenge</h4>
        <p>Aggregating and processing continuous real-time news publications across dozens of online media outlets requires high-throughput decoupled ingestion, fault-tolerant transformation, and scalable object storage.</p>

        <h4>The Solution</h4>
        <p>Engineered a distributed streaming pipeline: autonomous Python scrapers publish raw article payloads into partitioned <strong>Apache Kafka</strong> messaging topics. <strong>Apache Airflow</strong> schedules and orchestrates automated cleansing DAGs, persisting structured parquet datasets into a high-performance <strong>MinIO</strong> S3-compatible data lake.</p>

        <h4>Key Results & Metrics</h4>
        <ul>
          <li><strong>Fault-Tolerant Streaming</strong>: Decoupled producer-consumer architecture handling intermittent network drops and burst ingestion without data loss.</li>
          <li><strong>Automated Orchestration</strong>: Airflow DAGs managing deduplication, language normalization, and metadata tagging on regular schedules.</li>
          <li><strong>Scalable Data Lake</strong>: Integrated MinIO for cost-efficient, S3-compliant distributed object storage ready for downstream analytics and NLP models.</li>
        </ul>
      `,
      footer: `
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
        <a href="../presentation_press_bigdata.pdf" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">View Presentation Slides 📊</a>
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Repo ↗</a>
      `
    },

    moodle: {
      title: 'Enterprise LMS Platform & Educational Infrastructure',
      category: 'Infrastructure & DevOps · 1st Prize Winner',
      body: `
        <h4>The Context & Challenge</h4>
        <p>EMSI Summer Internship Competition: deploying and tuning a high-concurrency enterprise Moodle learning management system capable of reliably serving campus-wide concurrent student examinations and coursework.</p>

        <h4>The Solution</h4>
        <p>Designed and deployed a hardened Linux server environment running Moodle with optimized MySQL/MariaDB database connection pooling, Redis in-memory session caching, and strict role-based access control (RBAC). Conducted rigorous load testing and automated backup procedures.</p>

        <h4>Key Results & Metrics</h4>
        <ul>
          <li><strong>🥇 1st Prize Winner</strong>: Awarded 1st place in the EMSI Summer Internship Competition for technical excellence, architecture robustness, and professional defense.</li>
          <li><strong>High Concurrency Resilience</strong>: Optimized PHP-FPM worker pools and database indexes to minimize query response latency during peak traffic spikes.</li>
          <li><strong>Zero Downtime Backups</strong>: Automated cron snapshot procedures preserving pedagogical assets and database integrity.</li>
        </ul>
      `,
      footer: `
        <a href="https://github.com/abdelkaderelassali" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">GitHub Profile ↗</a>
      `
    }
  };

  const storyModal = document.getElementById('storyModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalBody = document.getElementById('modalBody');
  const modalFooter = document.getElementById('modalFooter');

  function openStoryModal(projectId) {
    const data = projectStories[projectId];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalCategory.textContent = data.category;
    modalBody.innerHTML = data.body;
    modalFooter.innerHTML = data.footer;

    storyModal.classList.add('active');
    storyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeStoryModal() {
    storyModal.classList.remove('active');
    storyModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.btn-story').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const proj = btn.getAttribute('data-project');
      openStoryModal(proj);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeStoryModal);
  }

  if (storyModal) {
    storyModal.addEventListener('click', (e) => {
      if (e.target === storyModal) {
        closeStoryModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && storyModal.classList.contains('active')) {
        closeStoryModal();
      }
    });
  }

});
