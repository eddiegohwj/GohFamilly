(function () {
  const root = document.documentElement;
  const reduce = root.classList.contains("reduce");

  const score = document.getElementById("score");
  const soundBtn = document.getElementById("soundBtn");
  let soundPref = null;
  try { soundPref = localStorage.getItem("goh-koyo-sound"); } catch (e) {}
  if (score) score.volume = 0.32;

  function paintSound(on) {
    if (!soundBtn) return;
    soundBtn.classList.toggle("is-on", on);
    soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    soundBtn.textContent = on ? "Sound on" : "Sound off";
  }
  function setSound(on) {
    soundPref = on ? "on" : "off";
    try { localStorage.setItem("goh-koyo-sound", soundPref); } catch (e) {}
    paintSound(on);
    if (!score) return;
    if (on) {
      const pending = score.play();
      if (pending && pending.catch) pending.catch(function () { paintSound(false); });
    } else {
      score.pause();
    }
  }
  paintSound(false);
  if (soundBtn) soundBtn.addEventListener("click", function () { setSound(soundPref !== "on"); });

  const intro = document.getElementById("intro");
  function dismissIntro() {
    if (!intro || intro.dataset.done) return;
    intro.dataset.done = "1";
    intro.classList.add("out");
    window.setTimeout(function () { intro.remove(); }, 480);
  }
  if (intro && !root.classList.contains("no-intro")) {
    const enter = document.getElementById("enterTrip");
    if (enter) {
      enter.addEventListener("click", function (e) {
        e.stopPropagation();
        if (soundPref !== "off") setSound(true);
        dismissIntro();
      });
    }
    intro.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("#enterTrip")) return;
      dismissIntro();
    });
    window.setTimeout(dismissIntro, 2200);
    document.addEventListener("keydown", function (e) {
      if (!intro || intro.dataset.done) return;
      if (e.key === "Escape") dismissIntro();
      if (e.key === "Enter") {
        if (soundPref !== "off") setSound(true);
        dismissIntro();
      }
    });
  } else if (intro) {
    intro.remove();
  }

  document.querySelectorAll("video").forEach(function (v) {
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    if (reduce) {
      v.pause();
      v.removeAttribute("autoplay");
    }
  });
  if (!reduce && "IntersectionObserver" in window) {
    const cuts = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const v = entry.target;
        if (entry.isIntersecting) {
          const pending = v.play();
          if (pending && pending.catch) pending.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll("video").forEach(function (v) { cuts.observe(v); });
  }

  document.querySelectorAll(".avatar img").forEach(function (img) {
    function show() { img.classList.add("is-in"); }
    function hide() { img.remove(); }
    if (img.complete && img.naturalWidth > 0) show();
    else if (img.complete) hide();
    else {
      img.addEventListener("load", show);
      img.addEventListener("error", hide);
    }
  });

  const todoKey = "goh-koyo-todos";
  function readTodos() {
    try { return JSON.parse(localStorage.getItem(todoKey) || "{}"); } catch (e) { return {}; }
  }
  function writeTodoCount() {
    const boxes = document.querySelectorAll("[data-todo]");
    const open = Array.prototype.filter.call(boxes, function (b) { return !b.checked; }).length;
    const el = document.getElementById("todoCount");
    if (el) el.textContent = open === 0 ? "All clear on this phone" : open + " still open on this phone";
    Array.prototype.forEach.call(boxes, function (b) {
      const li = b.closest("li");
      if (li) li.classList.toggle("is-done", b.checked);
    });
  }
  const savedTodos = readTodos();
  Array.prototype.forEach.call(document.querySelectorAll("[data-todo]"), function (box) {
    box.checked = !!savedTodos[box.getAttribute("data-todo")];
    box.addEventListener("change", function () {
      const data = readTodos();
      data[box.getAttribute("data-todo")] = box.checked;
      try { localStorage.setItem(todoKey, JSON.stringify(data)); } catch (e) {}
      writeTodoCount();
    });
  });
  writeTodoCount();

  const topbar = document.getElementById("topbar");
  const fill = document.getElementById("progressFill");
  const nav = document.getElementById("tocNav");
  if (nav) {
    nav.addEventListener("click", function (e) {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href");
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const behavior = reduce ? "auto" : "smooth";
      if (id === "#top") {
        window.scrollTo({ top: 0, behavior: behavior });
        return;
      }
      const offset = (topbar ? topbar.offsetHeight : 64) + 28;
      const top = window.scrollY + el.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: behavior });
    });
  }
  const links = Array.prototype.slice.call(document.querySelectorAll("#tocNav a"));
  const days = Array.prototype.slice.call(document.querySelectorAll(".day"));
  let lastCurrent = null;

  function onScroll() {
    const max = root.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (fill) fill.style.width = Math.min(100, Math.max(0, pct)) + "%";
    if (topbar) topbar.classList.toggle("solid", window.scrollY > 24);

    let current = null;
    for (let i = 0; i < days.length; i++) {
      if (days[i].getBoundingClientRect().top <= 130) current = days[i].id;
    }
    links.forEach(function (a) {
      const on = !!(current && a.getAttribute("href") === "#" + current);
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    if (current && current !== lastCurrent && nav) {
      lastCurrent = current;
      const active = nav.querySelector('a[href="#' + current + '"]');
      if (active) {
        const left = active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2;
        nav.scrollTo({ left: left, behavior: reduce ? "auto" : "smooth" });
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const spots = ["#day3", "#day5", "#day9", "#day11", "#day13"];
  let spot = 0;
  const scramble = document.getElementById("scramble");
  if (scramble) {
    scramble.addEventListener("click", function () {
      const target = document.querySelector(spots[spot % spots.length]);
      spot += 1;
      if (!reduce) {
        document.body.classList.add("glitch");
        window.setTimeout(function () { document.body.classList.remove("glitch"); }, 420);
      }
      if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  }

  function mountMotion() {
    if (!window.gsap || !window.ScrollTrigger || reduce) return;
    if (!window.matchMedia("(min-width: 900px)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const hero = document.querySelector(".hero");
    if (!hero) return;
    gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=50%",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    })
      .to(".pane-a", { xPercent: 7, ease: "none" }, 0)
      .to(".pane-b", { xPercent: -7, ease: "none" }, 0)
      .to(".pane-a img, .pane-a video", { scale: 1.16, ease: "none" }, 0)
      .to(".pane-b img, .pane-b video", { scale: 1.16, ease: "none" }, 0)
      .to(".hero-slash", { scaleY: 0, opacity: 0, ease: "none" }, 0)
      .to(".hero-copy", { y: -24, scale: 0.96, ease: "none" }, 0);

    if (!CSS.supports("animation-timeline: view()")) {
      document.querySelectorAll(".act-opener").forEach(function (opener) {
        const img = opener.querySelectorAll(".act-media img, .act-media video");
        const title = opener.querySelector(".act-title");
        if (img.length) {
          gsap.fromTo(img, { scale: 1.25, clipPath: "inset(12% 12% 12% 12%)" }, {
            scale: 1.02,
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: { trigger: opener, start: "top bottom", end: "top 20%", scrub: true }
          });
        }
        if (title) {
          gsap.fromTo(title, { y: 70 }, {
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: opener, start: "top bottom", end: "top 30%", scrub: true }
          });
        }
      });
    }
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
  mountMotion();
})();
