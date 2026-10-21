// Optional specimen controls only. Production materials do not need JavaScript.
const solid = document.getElementById('solid-toggle');
const grain = document.getElementById('grain-toggle');
solid.addEventListener('change', () => { document.documentElement.dataset.paraGlass = solid.checked ? 'solid' : 'auto'; });
grain.addEventListener('change', () => { document.body.dataset.showGrain = grain.checked ? 'on' : 'off'; });
document.getElementById('support').textContent = CSS.supports('backdrop-filter','blur(1px)') || CSS.supports('-webkit-backdrop-filter','blur(1px)') ? 'Backdrop filter available' : 'Solid fallback active';
