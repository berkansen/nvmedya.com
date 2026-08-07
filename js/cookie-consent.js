/* NVM Cookie Consent & Analytics Gating System (August 2026) */
(function() {
    'use strict';

    // Central bio link routes list (tracking-light / consent-free link hubs)
    const BIO_LINK_ROUTES = [
        '/nisan-vitrini',
        '/berkan',
        '/yeliz',
        '/iklim-davetiye',
        '/media',
        '/hepsert'
    ];

    function isBioLinkRoute() {
        let path = (window.location.pathname || '').toLowerCase();
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        if (path.endsWith('.html')) {
            path = path.slice(0, -5);
        }
        return BIO_LINK_ROUTES.includes(path);
    }

    // Immediately disable non-essential tracking if on a bio link route
    if (isBioLinkRoute()) {
        window['ga-disable-G-JD1C5PBEKD'] = true;
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
            });
        }
        // Do NOT initialize cookie consent UI, do NOT modify localStorage
        return;
    }

    const STORAGE_KEY = 'nvm_cookie_consent_v1';

    function getConsent() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function setConsent(necessary, analytics, marketing) {
        const consentData = {
            necessary: true,
            analytics: !!analytics,
            marketing: !!marketing,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
        } catch (e) {}

        applyConsent(consentData);
    }

    function applyConsent(consent) {
        if (consent && consent.analytics) {
            enableGoogleAnalytics();
        }
    }

    function enableGoogleAnalytics() {
        if (window.gtagAnalyticsEnabled) return;
        window.gtagAnalyticsEnabled = true;

        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    function renderBanner() {
        if (document.getElementById('nvm-cookie-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'nvm-cookie-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Çerez Tercihleri');
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #0d0d0d;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #e0e0e0;
            padding: 1.5rem;
            z-index: 999999;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
            font-family: 'Outfit', sans-serif;
        `;

        banner.innerHTML = `
            <div style="max-width: 1100px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.5rem;">
                <div style="flex: 1 1 500px; font-size: 0.95rem; line-height: 1.6;">
                    <strong style="color: #fff; font-weight: 600; display: block; margin-bottom: 0.25rem;">Çerez Tercihleriniz</strong>
                    Web sitemizde deneyiminizi geliştirmek, site trafiğini analiz etmek ve hizmetlerimizi optimize etmek amacıyla çerezler kullanılmaktadır. Detaylı bilgi için <a href="/yasal/cerez-politikasi" style="color: #ef781a; text-decoration: underline;">Çerez Politikamızı</a> inceleyebilirsiniz.
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                    <button id="nvm-cookie-reject" type="button" style="padding: 0.6rem 1.2rem; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-family: inherit;">Tümünü Reddet</button>
                    <button id="nvm-cookie-manage" type="button" style="padding: 0.6rem 1.2rem; background: transparent; border: 1px solid #ef781a; color: #ef781a; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-family: inherit;">Tercihleri Yönet</button>
                    <button id="nvm-cookie-accept" type="button" style="padding: 0.6rem 1.4rem; background: #ef781a; border: 1px solid #ef781a; color: #fff; font-weight: 600; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-family: inherit;">Tümünü Kabul Et</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('nvm-cookie-accept').addEventListener('click', function() {
            setConsent(true, true, true);
            banner.remove();
        });

        document.getElementById('nvm-cookie-reject').addEventListener('click', function() {
            setConsent(true, false, false);
            banner.remove();
        });

        document.getElementById('nvm-cookie-manage').addEventListener('click', function() {
            openModal();
        });
    }

    function openModal() {
        let modal = document.getElementById('nvm-cookie-modal');
        const currentConsent = getConsent() || { necessary: true, analytics: false, marketing: false };

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'nvm-cookie-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(5px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                font-family: 'Outfit', sans-serif;
            `;

            modal.innerHTML = `
                <div style="background: #141414; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem; color: #fff;">
                    <h3 style="font-size: 1.4rem; font-weight: 600; margin-bottom: 1rem; color: #fff;">Çerez Tercih Merkezi</h3>
                    <p style="font-size: 0.95rem; color: #aaa; line-height: 1.6; margin-bottom: 1.5rem;">
                        Web sitemizde kullanılan çerez kategorilerini aşağıdan inceleyebilir ve tercihlerinizi yönetebilirsiniz.
                    </p>

                    <div style="margin-bottom: 1.25rem; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong style="color: #fff;">Kesinlikle Gerekli Çerezler</strong>
                            <span style="font-size: 0.8rem; color: #ef781a; font-weight: 600;">HER ZAMAN AKTİF</span>
                        </div>
                        <p style="font-size: 0.85rem; color: #888; margin: 0;">Web sitemizin güvenli çalışması, form iletimi ve temel fonksiyonları için zorunludur.</p>
                    </div>

                    <div style="margin-bottom: 1.25rem; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong style="color: #fff;">Analitik ve Performans Çerezleri</strong>
                            <input type="checkbox" id="nvm-toggle-analytics" style="width: 18px; height: 18px; accent-color: #ef781a; cursor: pointer;">
                        </div>
                        <p style="font-size: 0.85rem; color: #888; margin: 0;">Ziyaretçi sayısını ve trafik kaynaklarını ölçerek site performansımızı değerlendirmemize olanak tanır (Google Analytics).</p>
                    </div>

                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong style="color: #fff;">Pazarlama ve Hedefleme Çerezleri</strong>
                            <input type="checkbox" id="nvm-toggle-marketing" style="width: 18px; height: 18px; accent-color: #ef781a; cursor: pointer;">
                        </div>
                        <p style="font-size: 0.85rem; color: #888; margin: 0;">İlginizi çekebilecek reklamları sunmak ve kampanya verimliliğini ölçmek amacıyla kullanılır (Google Ads, Meta Pixel).</p>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem;">
                        <button id="nvm-save-preferences" type="button" style="padding: 0.75rem 1.5rem; background: #ef781a; border: none; color: #fff; font-weight: 600; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-family: inherit;">Tercihleri Kaydet</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        } else {
            modal.style.display = 'flex';
        }

        const analyticsToggle = document.getElementById('nvm-toggle-analytics');
        const marketingToggle = document.getElementById('nvm-toggle-marketing');

        if (analyticsToggle) analyticsToggle.checked = !!currentConsent.analytics;
        if (marketingToggle) marketingToggle.checked = !!currentConsent.marketing;

        document.getElementById('nvm-save-preferences').onclick = function() {
            const analyticsVal = analyticsToggle ? analyticsToggle.checked : false;
            const marketingVal = marketingToggle ? marketingToggle.checked : false;
            setConsent(true, analyticsVal, marketingVal);
            modal.style.display = 'none';

            const banner = document.getElementById('nvm-cookie-banner');
            if (banner) banner.remove();
        };
    }

    document.addEventListener('DOMContentLoaded', function() {
        const consent = getConsent();
        if (consent) {
            applyConsent(consent);
        } else {
            renderBanner();
        }

        // Attach event listener to any footer link for cookie settings
        document.body.addEventListener('click', function(e) {
            const target = e.target.closest('.cookie-settings-btn, a[href="#cerez-tercihleri"]');
            if (target) {
                e.preventDefault();
                openModal();
            }
        });
    });
})();
