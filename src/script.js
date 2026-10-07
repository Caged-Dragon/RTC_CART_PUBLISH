(function () {
  var SUPABASE_URL = 'https://ypmiinmkyvzdpakbkers.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_5qcy4L4sPBxHqRdvk_A1kw_tPJPXxhm';

  function loadCompanyBrand() {
    fetch(SUPABASE_URL + '/rest/v1/company_profile?select=company_name,logo_url&is_active=eq.true&order=updated_at.desc&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    }).then(function (res) { return res.ok ? res.json() : []; })
      .then(function (rows) {
        var company = rows && rows[0]; if (!company) return;
        var name = company.company_name || 'RT Crackers';
        document.querySelectorAll('.logo-crop').forEach(function (el) {
          if (company.logo_url) el.style.backgroundImage = 'url("' + company.logo_url.replace(/"/g, '%22') + '")';
          el.setAttribute('aria-label', name + ' logo');
        });
        document.title = name + ' | rtcrackers.com';
      }).catch(function () {});
  }
  loadCompanyBrand();

  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu');
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });
  var links = menu.querySelectorAll('a');
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting && map[en.target.id]) {
        links.forEach(function (l) { l.classList.remove('active'); });
        map[en.target.id].classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  Object.keys(map).forEach(function (id) {
    var s = document.getElementById(id); if (s) io.observe(s);
  });
})();
