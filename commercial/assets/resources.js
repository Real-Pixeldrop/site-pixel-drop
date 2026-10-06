(() => {
    'use strict';

    const normalize = value => String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae');

    const init = () => {
        document.querySelectorAll('[data-resources]').forEach(root => {
            if (root.dataset.resourcesReady === 'true') return;
            const search = root.querySelector('[data-resource-search]');
            const controls = root.querySelector('[data-resource-controls]');
            const counter = root.querySelector('[data-resource-count]');
            const empty = root.querySelector('[data-resource-empty]');
            const reset = root.querySelector('[data-resource-reset]');
            const filters = Array.from(root.querySelectorAll('[data-resource-filter]'));
            const groups = Array.from(root.querySelectorAll('[data-resource-group]'));
            const items = Array.from(root.querySelectorAll('[data-resource-item]')).map(element => ({
                element,
                text: normalize(element.dataset.resourceText || ''),
                audience: element.dataset.resourceAudience,
            }));
            if (!search || !controls || !counter || !empty || !items.length) return;
            root.dataset.resourcesReady = 'true';
            let audience = 'all';

            const update = () => {
                const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
                let visible = 0;
                items.forEach(item => {
                    const matches = (audience === 'all' || item.audience === audience)
                        && terms.every(term => item.text.includes(term));
                    item.element.hidden = !matches;
                    if (matches) visible += 1;
                });
                groups.forEach(group => {
                    group.hidden = !Array.from(group.querySelectorAll('[data-resource-item]'))
                        .some(item => !item.hidden);
                });
                filters.forEach(button => {
                    button.setAttribute('aria-pressed', String(button.dataset.resourceFilter === audience));
                });
                const label = `${visible} ${visible === 1 ? 'ressource' : 'ressources'}`;
                counter.textContent = (terms.length || audience !== 'all') ? `${label} sur ${items.length}` : label;
                empty.hidden = visible > 0;
            };

            search.addEventListener('input', update);
            search.addEventListener('search', update);
            filters.forEach(button => button.addEventListener('click', () => {
                audience = button.dataset.resourceFilter;
                update();
            }));
            if (reset) reset.addEventListener('click', () => {
                search.value = '';
                audience = 'all';
                update();
                search.focus();
            });
            controls.hidden = false;
            update();
        });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
