/* ==========================================================
   KAIZEN — Interações e efeitos de rolagem
   ========================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Header sticky ---------- */
  const header = document.getElementById("header");
  if (header) {
    const onScrollHeader = () => {
      header.classList.toggle("scrolled", window.scrollY > 30);
    };
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ---------- 2. Menu mobile ---------- */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  if (hamburger && mobileMenu) {
    const closeMenu = () => {
      hamburger.classList.remove("open");
      mobileMenu.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    hamburger.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  /* ---------- 3. Scroll reveal ---------- */
  const staggerGroups = [
    ".checklist",
    ".prova-stats",
    ".content-grid",
    ".ads-kpis",
    ".plano-lista",
    ".plus-beneficios",
    ".sobre-pillars",
    ".faq-row",
    ".phones-row",
    ".cases-strip",
    ".lead-bullets"
  ];

  staggerGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        child.classList.add("reveal");
        if (selector === ".phones-row") {
          if (i === 0) child.classList.add("reveal-left");
          else if (i === 1) child.classList.add("reveal-scale");
          else child.classList.add("reveal-right");
        }
        child.style.setProperty("--stagger-i", String(i));
      });
    });
  });

  /* FAQ accordion: só 1 aberto; a linha inteira empurra as de baixo */
  const faqList = document.querySelector(".faq-list");
  if (faqList) {
    const faqItems = Array.from(faqList.querySelectorAll(".faq-item"));
    faqItems.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  const counted = new WeakSet();

  function animateCount(el) {
    if (!el || counted.has(el)) return;
    const target = parseInt(el.dataset.count, 10);
    if (Number.isNaN(target)) return;
    counted.add(el);

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("pt-BR");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function showReveal(el) {
    if (!el || el.classList.contains("visible")) return;
    el.classList.add("visible");

    // Dispara gráficos/contadores só quando o bloco fica visível
    // (evita animar “escondido” com opacity: 0 no pai)
    el.querySelectorAll(".visual-box").forEach((box) => box.classList.add("in-view"));
    if (el.classList.contains("visual-box")) el.classList.add("in-view");
    el.querySelectorAll("[data-count]").forEach(animateCount);
    if (el.hasAttribute("data-count")) animateCount(el);
  }

  function isInView(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < vh * 0.9 && rect.bottom > 0;
  }

  function revealVisibleNow() {
    revealEls.forEach((el) => {
      if (!el.classList.contains("visible") && isInView(el)) showReveal(el);
    });
  }

  if (prefersReducedMotion) {
    revealEls.forEach(showReveal);
    document.querySelectorAll(".visual-box").forEach((el) => el.classList.add("in-view"));
    document.querySelectorAll("[data-count]").forEach(animateCount);
  } else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            showReveal(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));

    requestAnimationFrame(() => {
      requestAnimationFrame(revealVisibleNow);
    });
    window.addEventListener("load", revealVisibleNow, { once: true });
    window.addEventListener("scroll", revealVisibleNow, { passive: true });

    // Segurança: se algo ficar preso em opacity:0, libera após 2.5s
    setTimeout(() => {
      revealEls.forEach((el) => {
        if (!el.classList.contains("visible") && isInView(el)) showReveal(el);
      });
    }, 2500);
  } else {
    revealVisibleNow();
    window.addEventListener("scroll", revealVisibleNow, { passive: true });
  }

  /* ---------- 4. Gráficos sem pai .reveal ---------- */
  document.querySelectorAll(".visual-box").forEach((box) => {
    if (box.closest(".reveal")) return;
    if (prefersReducedMotion) {
      box.classList.add("in-view");
      return;
    }
    if (!("IntersectionObserver" in window)) {
      box.classList.add("in-view");
      return;
    }
    const chartObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            chartObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    chartObserver.observe(box);
  });

  /* ---------- 6. Parallax leve ---------- */
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  let parallaxTicking = false;

  function applyParallax() {
    const viewportCenter = window.innerHeight / 2;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax);
      if (Number.isNaN(speed)) return;
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const offset = (elCenter - viewportCenter) * speed * -1;
      el.style.transform = "translateY(" + offset.toFixed(1) + "px)";
    });
    parallaxTicking = false;
  }

  if (!prefersReducedMotion && parallaxEls.length) {
    window.addEventListener("scroll", () => {
      if (!parallaxTicking) {
        parallaxTicking = true;
        requestAnimationFrame(applyParallax);
      }
    }, { passive: true });
    applyParallax();
  }

  /* ---------- 7. Tilt 3D no card do logo ---------- */
  const tiltCard = document.getElementById("sobreCard");
  const canHover = window.matchMedia("(hover: hover)").matches;

  if (tiltCard && canHover && !prefersReducedMotion) {
    tiltCard.addEventListener("mousemove", (e) => {
      const rect = tiltCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform =
        "rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (y * -10).toFixed(2) + "deg)";
    });

    tiltCard.addEventListener("mouseleave", () => {
      tiltCard.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
  }

  /* ---------- 8. Link ativo no menu ---------- */
  const sections = Array.from(document.querySelectorAll("section[id], footer[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));

  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- 9. Formulário de lead → WhatsApp ---------- */
  const leadForm = document.getElementById("leadForm");
  const formNote = document.getElementById("formNote");

  if (leadForm && formNote) {
    leadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const nome = document.getElementById("leadNome").value.trim();
      const nicho = document.getElementById("leadNicho").value.trim();
      const orcamento = document.getElementById("leadOrcamento");
      const whats = document.getElementById("leadWhats").value.trim();
      const mensagemEl = document.getElementById("leadMensagem");
      const mensagem = mensagemEl ? mensagemEl.value.trim() : "";
      const orcamentoLabel = orcamento.options[orcamento.selectedIndex]
        ? orcamento.options[orcamento.selectedIndex].text
        : "";

      if (!nome || !nicho || !orcamento.value || !whats) {
        formNote.textContent = "Preencha todos os campos para continuar.";
        formNote.classList.add("is-error");
        formNote.classList.remove("is-success");
        return;
      }

      let msg =
        "Olá! Vim pelo site da KAIZEN.%0A%0A" +
        "*Nome:* " + encodeURIComponent(nome) + "%0A" +
        "*Nicho:* " + encodeURIComponent(nicho) + "%0A" +
        "*Orçamento:* " + encodeURIComponent(orcamentoLabel) + "%0A" +
        "*WhatsApp:* " + encodeURIComponent(whats) + "%0A";

      if (mensagem) {
        msg += "*Descrição:* " + encodeURIComponent(mensagem) + "%0A";
      }

      msg += "%0AQuero uma consultoria gratuita.";

      formNote.textContent = "Abrindo WhatsApp...";
      formNote.classList.remove("is-error");
      formNote.classList.add("is-success");

      window.open("https://wa.me/5511989299387?text=" + msg, "_blank", "noopener");
    });
  }

  /* ---------- 10. Portfólio do calendário de conteúdo ---------- */
  const portfolioData = {
    reels: {
      title: "Portfólio · Reels",
      desc: "Vídeos curtos com gancho, ritmo e CTA — feitos para prender atenção e gerar ação no Instagram.",
      items: [
        {
          type: "image",
          src: "Assets/Insta/0713.png",
          tag: "Reels · Automotivo",
          title: "Raptor Motors",
          text: "Bastidores, estoque e prova social em formato vertical."
        },
        {
          type: "image",
          src: "Assets/Insta/0713(1).png",
          tag: "Reels · Saúde",
          title: "Nutrição & Rotina",
          text: "Conteúdo educativo com autoridade e linguagem leve."
        },
        {
          type: "mock",
          badge: "Roteiro",
          title: "Gancho em 3s",
          text: "Abertura forte + problema + solução + CTA no final do vídeo.",
          statLeft: "Retenção",
          statRight: "Alto"
        }
      ]
    },
    carrossel: {
      title: "Portfólio · Carrossel",
      desc: "Sequências educativas e comerciais que aumentam o tempo de permanência e a percepção de valor.",
      items: [
        {
          type: "image",
          src: "Assets/Insta/0713(1).png",
          tag: "Carrossel · Saúde",
          title: "Emagrecimento & Produtividade",
          text: "Slides com método, prova e próximo passo."
        },
        {
          type: "image",
          src: "Assets/Insta/WhatsApp%20Image%202026-07-16%20at%2015.16.43.jpeg",
          tag: "Carrossel · Institucional",
          title: "Quadrangular Imirim",
          text: "Agenda, comunidade e conteúdo de valor em série."
        },
        {
          type: "mock",
          badge: "Estrutura",
          title: "Capa → Valor → CTA",
          text: "Cada carrossel termina com uma ação clara: salvar, compartilhar ou falar no WhatsApp.",
          statLeft: "Saves",
          statRight: "+38%"
        }
      ]
    },
    estatico: {
      title: "Portfólio · Estático",
      desc: "Peças de feed com identidade forte, hierarquia visual e mensagem objetiva.",
      items: [
        {
          type: "image",
          src: "Assets/Insta/0713.png",
          tag: "Feed · Automotivo",
          title: "Raptor Motors",
          text: "Vitrine de produtos e autoridade de marca."
        },
        {
          type: "image",
          src: "Assets/Insta/WhatsApp%20Image%202026-07-16%20at%2015.16.43.jpeg",
          tag: "Feed · Institucional",
          title: "Quadrangular Imirim",
          text: "Comunicação clara e consistente da comunidade."
        },
        {
          type: "mock",
          badge: "Design",
          title: "Identidade aplicada",
          text: "Cores, tipografia e enquadramento alinhados ao posicionamento da marca.",
          statLeft: "Consistência",
          statRight: "Alta"
        }
      ]
    }
  };

  const portfolioModal = document.getElementById("portfolioModal");
  const portfolioTitle = document.getElementById("portfolioTitle");
  const portfolioDesc = document.getElementById("portfolioDesc");
  const portfolioGallery = document.getElementById("portfolioGallery");
  const portfolioButtons = Array.from(document.querySelectorAll("[data-portfolio]"));

  function renderPortfolioItem(item) {
    if (item.type === "image") {
      return (
        '<article class="portfolio-card">' +
          '<div class="portfolio-card-media">' +
            '<img src="' + item.src + '" alt="' + item.title + '" loading="lazy" decoding="async" />' +
          "</div>" +
          '<div class="portfolio-card-body">' +
            "<span>" + item.tag + "</span>" +
            "<strong>" + item.title + "</strong>" +
            "<small>" + item.text + "</small>" +
          "</div>" +
        "</article>"
      );
    }

    return (
      '<article class="portfolio-card">' +
        '<div class="portfolio-card-media">' +
          '<div class="portfolio-card-mock">' +
            '<span class="mock-badge">' + item.badge + "</span>" +
            "<div><strong>" + item.title + "</strong><p>" + item.text + "</p></div>" +
            '<div class="mock-stat"><span>' + item.statLeft + "</span><span>" + item.statRight + "</span></div>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function openPortfolio(key) {
    const data = portfolioData[key];
    if (!data || !portfolioModal) return;

    portfolioTitle.textContent = data.title;
    portfolioDesc.textContent = data.desc;
    portfolioGallery.innerHTML = data.items.map(renderPortfolioItem).join("");

    portfolioButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.portfolio === key);
    });

    portfolioModal.hidden = false;
    portfolioModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePortfolio() {
    if (!portfolioModal || portfolioModal.hidden) return;
    portfolioModal.hidden = true;
    portfolioModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    portfolioButtons.forEach((btn) => btn.classList.remove("is-active"));
  }

  portfolioButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled || btn.getAttribute("aria-disabled") === "true") return;
      openPortfolio(btn.dataset.portfolio);
    });
  });

  if (portfolioModal) {
    portfolioModal.querySelectorAll("[data-close-portfolio]").forEach((el) => {
      el.addEventListener("click", closePortfolio);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePortfolio();
  });
})();
