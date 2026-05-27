(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function initMobileMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        window.clearInterval(timer);
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    start();
  }

  function initFilters() {
    var panel = document.querySelector('[data-filter-panel]');
    var list = document.querySelector('[data-card-list]');
    if (!panel || !list) {
      return;
    }
    var input = panel.querySelector('.js-filter-input');
    var type = panel.querySelector('.js-filter-type');
    var year = panel.querySelector('.js-filter-year');
    var count = panel.querySelector('[data-filter-count]');
    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function apply() {
      var q = normalize(input && input.value);
      var selectedType = normalize(type && type.value);
      var selectedYear = normalize(year && year.value);
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-tags')
        ].join(' '));
        var ok = true;
        if (q && haystack.indexOf(q) === -1) {
          ok = false;
        }
        if (selectedType && normalize(card.getAttribute('data-type')) !== selectedType) {
          ok = false;
        }
        if (selectedYear && normalize(card.getAttribute('data-year')).indexOf(selectedYear) === -1) {
          ok = false;
        }
        card.classList.toggle('is-hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = String(visible);
      }
    }

    [input, type, year].forEach(function (element) {
      if (element) {
        element.addEventListener('input', apply);
        element.addEventListener('change', apply);
      }
    });

    var params = new URLSearchParams(window.location.search);
    if (params.get('region') && input) {
      input.value = params.get('region');
    }
    if (params.get('year') && year) {
      year.value = params.get('year');
    }
    apply();
  }

  function renderSearchResult(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span class="tag-pill">' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card movie-card-compact">',
      '  <a class="movie-card-link" href="' + escapeHtml(movie.url) + '">',
      '    <figure class="poster-frame">',
      '      <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '      <figcaption class="poster-overlay"><span class="play-dot">▶</span><span>查看详情</span></figcaption>',
      '    </figure>',
      '    <div class="movie-card-body">',
      '      <div class="movie-meta-line"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine) + '</p>',
      '      <div class="tag-row">' + tags + '</div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initGlobalSearch() {
    var input = document.getElementById('global-search');
    var results = document.getElementById('search-results');
    var button = document.querySelector('[data-run-search]');
    var count = document.querySelector('[data-search-count]');
    var data = window.MOVIE_SEARCH_DATA || [];
    if (!input || !results || !data.length) {
      return;
    }

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function run() {
      var q = normalize(input.value);
      var matches = data.filter(function (movie) {
        if (!q) {
          return true;
        }
        return normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.category,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' ')).indexOf(q) !== -1;
      }).slice(0, 120);
      if (!matches.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配影片，请换一个关键词。</div>';
      } else {
        results.innerHTML = matches.map(renderSearchResult).join('');
      }
      if (count) {
        count.textContent = String(matches.length);
      }
    }

    var params = new URLSearchParams(window.location.search);
    if (params.get('q')) {
      input.value = params.get('q');
    }
    input.addEventListener('input', run);
    if (button) {
      button.addEventListener('click', run);
    }
    run();
  }

  function initPlayers() {
    var shells = Array.prototype.slice.call(document.querySelectorAll('.video-shell'));
    shells.forEach(function (shell) {
      var video = shell.querySelector('video');
      var button = shell.querySelector('[data-play-button]');
      var status = shell.querySelector('[data-player-status]');
      var source = shell.getAttribute('data-video-url');
      var hlsInstance = null;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function loadAndPlay() {
        if (!video || !source) {
          setStatus('播放源暂不可用');
          return;
        }
        setStatus('正在加载播放源...');
        shell.classList.add('playing');

        if (window.Hls && window.Hls.isSupported()) {
          if (!hlsInstance) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              setStatus('播放源已就绪');
              video.play().catch(function () {
                setStatus('请再次点击播放器开始播放');
              });
            });
            hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                setStatus('视频加载失败，请稍后再试');
              }
            });
          } else {
            video.play();
          }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            setStatus('播放源已就绪');
            video.play();
          }, { once: true });
        } else {
          video.src = source;
          video.play().then(function () {
            setStatus('播放中');
          }).catch(function () {
            setStatus('当前浏览器需要 HLS 支持，请使用现代浏览器访问');
          });
        }
      }

      if (button) {
        button.addEventListener('click', loadAndPlay);
      }
      if (video) {
        video.addEventListener('play', function () {
          shell.classList.add('playing');
        });
        video.addEventListener('pause', function () {
          if (video.currentTime === 0 || video.ended) {
            shell.classList.remove('playing');
          }
        });
      }
    });
  }

  ready(function () {
    initMobileMenu();
    initHero();
    initFilters();
    initGlobalSearch();
    initPlayers();
  });
})();
