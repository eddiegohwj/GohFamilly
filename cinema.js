(function () {
  const root = document.documentElement;
  const reduce = root.classList.contains("reduce");

  const intro = document.getElementById("intro");
  function dismissIntro() {
    if (!intro || intro.dataset.done) return;
    intro.dataset.done = "1";
    intro.classList.add("out");
    window.setTimeout(function () { intro.remove(); }, 480);
  }
  if (intro && !root.classList.contains("no-intro")) {
    intro.addEventListener("click", dismissIntro);
    window.setTimeout(dismissIntro, 1600);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Enter") dismissIntro();
    });
  } else if (intro) {
    intro.remove();
  }

  const topbar = document.getElementById("topbar");
  const fill = document.getElementById("progressFill");
  const nav = document.getElementById("tocNav");
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
      .to(".pane-a img", { scale: 1.16, ease: "none" }, 0)
      .to(".pane-b img", { scale: 1.16, ease: "none" }, 0)
      .to(".hero-slash", { scaleY: 0, opacity: 0, ease: "none" }, 0)
      .to(".hero-copy", { y: -24, scale: 0.96, ease: "none" }, 0);

    if (!CSS.supports("animation-timeline: view()")) {
      document.querySelectorAll(".act-opener").forEach(function (opener) {
        const img = opener.querySelector(".act-media img");
        const title = opener.querySelector(".act-title");
        if (img) {
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
