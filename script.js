/* Apna Stage Bharat — vanilla JS, no dependencies */
(function () {
  'use strict';

  var CONFIG = {
    paymentLinks: {
      community_entry: 'REPLACE_WITH_PAYMENT_LINK_199',
      featured_creator: 'REPLACE_WITH_PAYMENT_LINK_999',
      regional_ambassador_nomination: 'REPLACE_WITH_PAYMENT_LINK_1499'
    },
    whatsapp: {
      phone: 'REPLACE_WITH_SUPPORT_NUMBER'
    }
  };

  var TIER_PRICES = {
    community_entry: 199,
    featured_creator: 999,
    regional_ambassador_nomination: 1499
  };

  var STATE_CODES = [
    'gujarat', 'bihar', 'delhi_ncr', 'madhya_pradesh', 'uttarakhand',
    'karnataka', 'kerala', 'maharashtra', 'punjab', 'tamil_nadu',
    'andhra_pradesh', 'telangana'
  ];

  var STORAGE_LANG = 'asb_lang';
  var STORAGE_STATE = 'asb_state';
  var DEFAULT_LANG = 'hi';
  var FALLBACK_LANG = 'en';

  var LANGS = window.ASB_LANGUAGES || [];
  var LOCALES = window.ASB_LOCALES || {};
  var currentLang = DEFAULT_LANG;
  var overlay = null;
  var languageGate = null;
  var lastFocused = null;

  var LANGUAGE_GREETINGS = {
    hi: 'नमस्ते',
    en: 'Namaste',
    gu: 'નમસ્તે',
    mr: 'नमस्कार',
    kn: 'ನಮಸ್ಕಾರ',
    ml: 'നമസ്കാരം',
    pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    ta: 'வணக்கம்',
    te: 'నమస్కారం'
  };

  function locale() {
    return LOCALES[currentLang] || LOCALES[FALLBACK_LANG] || LOCALES[DEFAULT_LANG];
  }

  function sanitize(str) {
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  function t(key) {
    var active = locale();
    var fallback = LOCALES[FALLBACK_LANG] || LOCALES[DEFAULT_LANG] || {};
    var val = '';
    if (active && active.strings && active.strings[key] !== undefined) val = active.strings[key];
    else if (fallback.strings && fallback.strings[key] !== undefined) val = fallback.strings[key];
    return sanitize(val);
  }

  function selectedTier() {
    var checked = document.querySelector('input[name="tier"]:checked');
    return checked ? checked.value : 'community_entry';
  }

  function track(name, props) {
    var evt = { event: name, ts: Date.now(), lang: currentLang };
    if (props) {
      Object.keys(props).forEach(function (key) {
        evt[key] = props[key];
      });
    }
    window.asbEvents = window.asbEvents || [];
    window.asbEvents.push(evt);
  }

  function clearSelect(select) {
    while (select.firstChild) select.removeChild(select.firstChild);
  }

  function fillLanguageSelect() {
    var select = document.getElementById('lang-select');
    if (!select) return;
    clearSelect(select);
    LANGS.forEach(function (lang) {
      var opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = lang.label;
      select.appendChild(opt);
    });
    select.value = currentLang;
  }

  function updateLanguageGateActive() {
    document.querySelectorAll('.language-choice').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === currentLang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function fillLanguageGateOptions() {
    var wrap = document.getElementById('language-gate-options');
    if (!wrap) return;
    wrap.innerHTML = '';

    LANGS.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'language-choice';
      btn.setAttribute('data-lang', lang.code);
      btn.setAttribute('aria-pressed', 'false');

      var name = document.createElement('strong');
      name.textContent = lang.label;
      var greeting = document.createElement('span');
      greeting.textContent = LANGUAGE_GREETINGS[lang.code] || lang.label;

      btn.appendChild(name);
      btn.appendChild(greeting);
      btn.addEventListener('click', function () {
        setLanguage(lang.code);
        closeLanguageGate();
        track('language_gate_selected', { language: lang.code });
      });

      wrap.appendChild(btn);
    });

    updateLanguageGateActive();
  }

  function openLanguageGate() {
    if (!languageGate) return;
    languageGate.classList.add('open');
    document.body.classList.add('modal-open');

    var active = languageGate.querySelector('.language-choice.active') ||
      languageGate.querySelector('.language-choice');
    if (active) active.focus();
    track('language_gate_opened', {});
  }

  function closeLanguageGate() {
    if (!languageGate) return;
    languageGate.classList.remove('open');
    if (!overlay || !overlay.classList.contains('open')) {
      document.body.classList.remove('modal-open');
    }
  }

  function fillStateSelect() {
    var select = document.getElementById('modal-state');
    if (!select) return;
    var previous = select.value;
    clearSelect(select);

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = t('form_state');
    select.appendChild(placeholder);

    var names = locale().states || [];
    STATE_CODES.forEach(function (code, index) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = names[index] || code;
      select.appendChild(opt);
    });

    select.value = STATE_CODES.indexOf(previous) !== -1 ? previous : '';
  }

  function renderCategories() {
    var wrap = document.getElementById('category-groups');
    var modalCat = document.getElementById('modal-category');
    if (!wrap || !modalCat) return;

    wrap.innerHTML = '';
    clearSelect(modalCat);

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = t('form_category');
    modalCat.appendChild(placeholder);

    (locale().categories || []).forEach(function (group) {
      var card = document.createElement('div');
      card.className = 'cat-group';

      var heading = document.createElement('h3');
      heading.textContent = group.group;
      card.appendChild(heading);

      var optgroup = document.createElement('optgroup');
      optgroup.label = group.group;

      group.categories.forEach(function (cat) {
        var details = document.createElement('details');
        var summary = document.createElement('summary');
        summary.textContent = cat.name;

        var detail = document.createElement('p');
        detail.className = 'cat-detail';
        detail.textContent = cat.examples;

        var format = document.createElement('span');
        format.className = 'cat-format';
        format.textContent = cat.format;
        detail.appendChild(format);

        details.appendChild(summary);
        details.appendChild(detail);
        details.addEventListener('toggle', function () {
          if (details.open) track('category_clicked', { category: cat.name });
        });
        card.appendChild(details);

        var opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        optgroup.appendChild(opt);
      });

      wrap.appendChild(card);
      modalCat.appendChild(optgroup);
    });
  }

  function updateSubmitBtn() {
    var btn = document.getElementById('modal-submit');
    if (!btn) return;
    btn.textContent = t('form_submit').replace('{price}', TIER_PRICES[selectedTier()]);
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = t(el.getAttribute('data-i18n'));
      if (value) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var value = t(el.getAttribute('data-i18n-aria-label'));
      if (value) el.setAttribute('aria-label', value);
    });

    var active = locale();
    document.documentElement.lang = active.htmlLang || currentLang;
    fillStateSelect();
    renderCategories();
    updateSubmitBtn();
    initWhatsApp();
  }

  function setConditionalFieldState(section, active) {
    if (!section) return;
    section.hidden = !active;
    section.querySelectorAll('input').forEach(function (input) {
      input.required = active;
      if (!active) {
        input.value = '';
        input.classList.remove('invalid');
        var err = document.querySelector('[data-err-for="' + input.id + '"]');
        if (err) err.textContent = '';
      }
    });
  }

  function updateApplicantFields() {
    var applyingAs = document.getElementById('f-applying-as');
    if (!applyingAs) return;
    var value = applyingAs.value;
    setConditionalFieldState(document.getElementById('student-fields'), value === 'student');
    setConditionalFieldState(document.getElementById('professional-fields'), value === 'professional');
    setConditionalFieldState(document.getElementById('other-fields'), value === 'other');
  }

  function setLanguage(lang, opts) {
    if (!LOCALES[lang]) lang = DEFAULT_LANG;
    currentLang = lang;
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (e) {}

    var select = document.getElementById('lang-select');
    if (select && select.value !== lang) select.value = lang;

    function setImg(id, baseName) {
      var img = document.getElementById(id);
      if (!img) return;
      var newSrc = 'assets/' + baseName + '_' + lang + '.png';
      var fallbackSrc = 'assets/' + baseName + '_' + DEFAULT_LANG + '.png';
      if (img.getAttribute('src') === newSrc) return;
      img.onerror = function() {
        img.onerror = null;
        img.src = fallbackSrc;
      };
      img.src = newSrc;
    }

    setImg('hero-img', 'hero_duo');
    setImg('category-img', 'category_glamour');
    setImg('cta-img', 'cta_confidence');

    applyTranslations();
    updateLanguageGateActive();
    if (!opts || !opts.silent) track('language_changed', { language: lang });
  }

  function validateForm() {
    var valid = true;

    function setErr(id, msg) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('invalid', !!msg);
      var err = document.querySelector('[data-err-for="' + id + '"]');
      if (err) err.textContent = msg || '';
      if (msg) valid = false;
    }

    var name = document.getElementById('f-name').value.trim();
    setErr('f-name', name ? '' : t('error_name'));

    var phone = document.getElementById('f-phone').value.trim().replace(/\D/g, '');
    setErr('f-phone', phone.length >= 10 ? '' : t('error_phone'));

    var email = document.getElementById('f-email').value.trim();
    setErr('f-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : t('error_email'));

    var gender = document.getElementById('f-gender').value;
    setErr('f-gender', gender ? '' : t('error_gender'));

    var applyingAs = document.getElementById('f-applying-as').value;
    setErr('f-applying-as', applyingAs ? '' : t('error_applying_as'));

    if (applyingAs === 'student') {
      var institution = document.getElementById('f-institution').value.trim();
      var graduationYear = document.getElementById('f-graduation-year').value.trim();
      var graduationYearNum = Number(graduationYear);
      setErr('f-institution', institution ? '' : t('error_institution'));
      setErr(
        'f-graduation-year',
        /^\d{4}$/.test(graduationYear) && graduationYearNum >= 1950 && graduationYearNum <= 2100
          ? ''
          : t('error_graduation_year')
      );
    } else {
      setErr('f-institution', '');
      setErr('f-graduation-year', '');
    }

    if (applyingAs === 'professional') {
      var organization = document.getElementById('f-organization').value.trim();
      var designation = document.getElementById('f-designation').value.trim();
      setErr('f-organization', organization ? '' : t('error_organization'));
      setErr('f-designation', designation ? '' : t('error_designation'));
    } else {
      setErr('f-organization', '');
      setErr('f-designation', '');
    }

    if (applyingAs === 'other') {
      var other = document.getElementById('f-applying-other').value.trim();
      setErr('f-applying-other', other ? '' : t('error_other_specify'));
    } else {
      setErr('f-applying-other', '');
    }

    var city = document.getElementById('f-city').value.trim();
    setErr('f-city', city ? '' : t('error_city'));

    var state = document.getElementById('modal-state').value;
    setErr('modal-state', state ? '' : t('error_state'));

    var category = document.getElementById('modal-category').value;
    setErr('modal-category', category ? '' : t('error_category'));

    var rules = document.getElementById('f-rules').checked;
    setErr('f-rules', rules ? '' : t('error_rules'));

    var link = document.getElementById('f-link').value.trim();
    if (link && !/^https?:\/\/.+/.test(link)) {
      setErr('f-link', t('error_link'));
    } else {
      setErr('f-link', '');
    }

    return valid;
  }

  function whatsappHref() {
    var active = locale();
    return 'https://wa.me/' + CONFIG.whatsapp.phone +
      '?text=' + encodeURIComponent(active.whatsappMessage || '');
  }

  function initWhatsApp() {
    var cta = document.getElementById('whatsapp-cta');
    var success = document.getElementById('success-whatsapp');
    if (cta) cta.href = whatsappHref();
    if (success) success.href = whatsappHref();
  }

  function resetModalView() {
    document.getElementById('modal-form-view').hidden = false;
    document.getElementById('modal-success-view').hidden = true;
  }

  function showSuccessView(tier) {
    document.getElementById('modal-form-view').hidden = true;
    document.getElementById('modal-success-view').hidden = false;
    document.getElementById('success-pay').href = CONFIG.paymentLinks[tier] || '#';
    initWhatsApp();
  }

  function openModal(tier) {
    var modal = overlay.querySelector('.modal');
    resetModalView();
    if (tier) {
      var radio = document.querySelector('input[name="tier"][value="' + tier + '"]');
      if (radio) radio.checked = true;
    }
    updateSubmitBtn();
    overlay.classList.add('open');
    overlay.scrollTop = 0;
    if (modal) modal.scrollTop = 0;
    document.body.classList.add('modal-open');
    lastFocused = document.activeElement;
    try {
      document.getElementById('modal-close').focus({ preventScroll: true });
    } catch (e) {
      document.getElementById('modal-close').focus();
    }
    track('submit_cta_clicked', { tier: tier || selectedTier() });
  }

  function closeModal() {
    overlay.classList.remove('open');
    if (!languageGate || !languageGate.classList.contains('open')) {
      document.body.classList.remove('modal-open');
    }
    if (lastFocused) {
      try {
        lastFocused.focus({ preventScroll: true });
      } catch (e) {
        lastFocused.focus();
      }
    }
  }

  function initModal() {
    overlay = document.getElementById('modal-overlay');
    var header = document.querySelector('.site-header');
    if (overlay && header && overlay.nextElementSibling !== header) {
      document.body.insertBefore(overlay, header);
    }

    document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tier = btn.getAttribute('data-tier-cta');
        if (tier) track('pricing_card_clicked', { tier: tier });
        openModal(tier);
      });
    });

    document.getElementById('modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    document.querySelectorAll('input[name="tier"]').forEach(function (radio) {
      radio.addEventListener('change', updateSubmitBtn);
    });

    document.getElementById('modal-state').addEventListener('change', function (e) {
      try { localStorage.setItem(STORAGE_STATE, e.target.value); } catch (err) {}
      track('state_selected', { state: e.target.value, source: 'modal' });
    });

    document.getElementById('f-applying-as').addEventListener('change', updateApplicantFields);

    document.getElementById('entry-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm()) return;

      var tier = selectedTier();
      track('payment_link_clicked', {
        tier: tier,
        applying_as: document.getElementById('f-applying-as').value,
        state: document.getElementById('modal-state').value,
        city: document.getElementById('f-city').value.trim(),
        category: document.getElementById('modal-category').value
      });

      var payUrl = CONFIG.paymentLinks[tier];
      if (payUrl && payUrl.indexOf('REPLACE') === -1) {
        window.open(payUrl, '_blank', 'noopener,noreferrer');
      }
      showSuccessView(tier);
    });

    document.getElementById('success-close').addEventListener('click', closeModal);
    document.getElementById('success-pay').addEventListener('click', function () {
      track('payment_link_clicked', { tier: selectedTier(), source: 'success_view' });
    });
  }

  function initFaq() {
    document.querySelectorAll('.faq-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var answer = btn.closest('.faq-item').querySelector('.faq-a');
        btn.setAttribute('aria-expanded', String(!expanded));
        answer.hidden = expanded;
        if (!expanded) track('faq_opened', { question: btn.getAttribute('data-i18n') });
      });
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!window.IntersectionObserver) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  function initNav() {
    var hamburger = document.getElementById('hamburger');
    var nav = document.getElementById('main-nav');
    hamburger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initLanguage() {
    var savedLang = null;
    try { savedLang = localStorage.getItem(STORAGE_LANG); } catch (e) {}
    currentLang = savedLang && LOCALES[savedLang] ? savedLang : DEFAULT_LANG;
    fillLanguageSelect();

    document.getElementById('lang-select').addEventListener('change', function (e) {
      setLanguage(e.target.value);
    });
  }

  function initLanguageGate() {
    languageGate = document.getElementById('language-gate');
    fillLanguageGateOptions();
    if (languageGate && languageGate.classList.contains('open')) {
      document.body.classList.add('modal-open');
      var active = languageGate.querySelector('.language-choice.active') ||
        languageGate.querySelector('.language-choice');
      if (active) {
        try {
          active.focus({ preventScroll: true });
        } catch (e) {
          active.focus();
        }
      }
      track('language_gate_opened', { initial: true });
    }
  }

  function init() {
    initLanguage();
    initLanguageGate();
    initModal();
    initFaq();
    initNav();
    initReveal();

    applyTranslations();
    updateApplicantFields();
    updateLanguageGateActive();

    var savedState = null;
    try { savedState = localStorage.getItem(STORAGE_STATE); } catch (e) {}
    if (savedState && STATE_CODES.indexOf(savedState) !== -1) {
      document.getElementById('modal-state').value = savedState;
    }

    track('page_view', { state: savedState || '' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
