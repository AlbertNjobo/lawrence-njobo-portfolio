/**
 * main.js — Lightweight interactions
 * - Scroll-triggered fade-in animations
 * - Medium RSS blog feed
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Intro Typing Animation ───
  const intro = document.getElementById('intro');
  const lines = document.querySelectorAll('.intro__line');

  if (intro && lines.length > 0) {
    runIntroSequence();
  }

  async function runIntroSequence() {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = line.getAttribute('data-text') || '';

      // Show line and start typing
      line.classList.add('typing');

      // Create cursor
      const cursor = document.createElement('span');
      cursor.className = 'intro__cursor';
      line.appendChild(cursor);

      // Type each character
      for (let c = 0; c < text.length; c++) {
        line.insertBefore(document.createTextNode(text[c]), cursor);
        await sleep(45 + Math.random() * 35); // Variable typing speed
      }

      // Pause after typing
      await sleep(600);

      // Remove cursor from this line (keep on last line)
      if (i < lines.length - 1) {
        cursor.remove();
      }

      line.classList.remove('typing');
      line.classList.add('done');
    }

    // Hold the final frame
    await sleep(1000);

    // Fade out intro
    intro.classList.add('fade-out');
    document.body.classList.remove('intro-active');

    // Remove intro from DOM after transition
    await sleep(700);
    intro.remove();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Scroll Animations (IntersectionObserver) ───
  const fadeEls = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);

          // Stagger children if present
          const staggerContainer = entry.target.querySelector('.stagger');
          if (staggerContainer) {
            const children = staggerContainer.children;
            Array.from(children).forEach((child, i) => {
              setTimeout(() => {
                child.classList.add('visible');
              }, i * 80);
            });
          }
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  fadeEls.forEach((el) => observer.observe(el));


  // ─── Medium RSS Feed ───
  const blogContainer = document.getElementById('blog-posts');
  const MEDIUM_USER = '@lawrencenjobo';
  const RSS_API = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/${MEDIUM_USER}`;

  // Fallback posts if RSS fails
  const fallbackPosts = [
    {
      title: 'Read my latest articles on Medium',
      link: `https://medium.com/${MEDIUM_USER}`,
      pubDate: '',
      description: 'Thoughts on AI, engineering, cybersecurity, and building things that matter.',
    },
  ];

  function renderPosts(posts) {
    if (!blogContainer) return;
    blogContainer.innerHTML = '';

    posts.forEach((post, i) => {
      const date = post.pubDate
        ? new Date(post.pubDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '';

      // Strip HTML from description for excerpt
      const tmp = document.createElement('div');
      tmp.innerHTML = post.description || '';
      const excerpt = tmp.textContent.substring(0, 160).trim();

      const el = document.createElement('a');
      el.href = post.link;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.className = 'post';

      el.innerHTML = `
        <div class="post__title">${post.title}</div>
        <div class="post__meta">
          ${date ? `<span class="iconify" data-icon="mdi:calendar-outline" data-width="13"></span> ${date}` : ''}
          ${post.categories && post.categories.length ? `<span>·</span> ${post.categories.slice(0, 3).join(', ')}` : ''}
        </div>
        ${excerpt ? `<p class="post__excerpt">${excerpt}...</p>` : ''}
      `;

      blogContainer.appendChild(el);

      // Animate in with stagger
      setTimeout(() => {
        el.classList.add('visible');
      }, i * 100);
    });
  }

  // Fetch from RSS
  fetch(RSS_API)
    .then((res) => {
      if (!res.ok) throw new Error('RSS fetch failed');
      return res.json();
    })
    .then((data) => {
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        renderPosts(data.items.slice(0, 5));
      } else {
        renderPosts(fallbackPosts);
      }
    })
    .catch(() => {
      renderPosts(fallbackPosts);
    });
});
