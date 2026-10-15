const engines = {
    youtube: { url: 'https://www.youtube.com/results?search_query=', placeholder: 'YouTube-ээс хайх эсвэл URL оруулах' },
    google: { url: 'https://www.google.com/search?q=', placeholder: 'Google-ээс хайх эсвэл URL оруулах' },
};

let engine = 'youtube';
const input = document.getElementById('q');

document.querySelectorAll('.engine').forEach((button) => {
    button.addEventListener('click', () => {
        engine = button.dataset.engine;
        document.querySelectorAll('.engine').forEach((b) => b.classList.toggle('active', b === button));
        input.placeholder = engines[engine].placeholder;
        input.focus();
    });
});

document.getElementById('search').addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;

    const looksLikeUrl = /^https?:\/\//i.test(value) || (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value) && !value.includes(' '));
    location.href = looksLikeUrl ? (/^https?:\/\//i.test(value) ? value : `https://${value}`) : engines[engine].url + encodeURIComponent(value);
});
