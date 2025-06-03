const updates = [
  "2025-06-01: Dark Theme хувилбар нэмэгдлээ!",
  "2025-05-28: Tab Manager extension update 1.1 гарлаа.",
  "2025-05-20: Minimal Theme шинэ өнгө нэмэгдлээ."
];

const extensions = [
  {
    name: "Dark Reader Plus",
    desc: "Бүх сайт дээр dark mode идэвхжүүлдэг хөнгөн extension.",
    link: "https://chrome.google.com/webstore/detail/dark-reader-plus/abcd1234",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "Tab Manager Pro",
    desc: "Олон табтай ажиллахад хялбар болгодог tab manager.",
    link: "https://chrome.google.com/webstore/detail/tab-manager-pro/efgh5678",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "Minimal Blue Theme",
    desc: "Цэвэрхэн, minimal загвартай Chrome theme.",
    link: "https://chrome.google.com/webstore/detail/minimal-blue-theme/ijkl9012",
    img: "https://via.placeholder.com/150"
  }
];

const updateList = document.getElementById("update-list");
updates.forEach(update => {
  const li = document.createElement("li");
  li.className = "bg-white shadow p-3 rounded";
  li.textContent = update;
  updateList.appendChild(li);
});

const extensionCards = document.getElementById("extension-cards");
extensions.forEach(ext => {
  const card = document.createElement("div");
  card.className = "bg-white shadow rounded overflow-hidden";
  card.innerHTML = `
    <img src="${ext.img}" alt="${ext.name}" class="w-full h-32 object-cover">
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2">${ext.name}</h3>
      <p class="text-sm mb-4">${ext.desc}</p>
      <a href="${ext.link}" target="_blank" class="text-blue-600 hover:underline">Дэлгэрэнгүй</a>
    </div>
  `;
  extensionCards.appendChild(card);
});
