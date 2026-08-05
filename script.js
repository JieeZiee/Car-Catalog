// Simple static catalog renderer reading cars.json
let cars = [];
const catalog = document.getElementById('catalog');
const emptyMsg = document.getElementById('empty');
const searchInput = document.getElementById('search');
const filterStatus = document.getElementById('filter-status');

// Modal elements
const modal = document.getElementById('detailModal');
const closeModalBtn = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalYear = document.getElementById('modalYear');
const modalMileage = document.getElementById('modalMileage');
const modalLocation = document.getElementById('modalLocation');
const modalDesc = document.getElementById('modalDesc');
const modalStatus = document.getElementById('modalStatus');
const whatsappBtn = document.getElementById('whatsappBtn');
const shareBtn = document.getElementById('shareBtn');
const prevImg = document.getElementById('prevImg');
const nextImg = document.getElementById('nextImg');

let currentImages = [];
let currentImgIndex = 0;
let currentDetailUrl = '';

function formatPrice(n){
  if(!n) return '-';
  return 'Rp' + Number(n).toLocaleString('id-ID');
}

function renderCard(car){
  const div = document.createElement('article');
  div.className = 'card';
  const imgSrc = (car.images && car.images.length) ? car.images[0] : 'https://via.placeholder.com/600x400?text=No+Image';
  div.innerHTML = `
    <img loading="lazy" src="${imgSrc}" alt="${car.title}" />
    <div class="card-body">
      <div>
        <div class="card-title">${car.title}</div>
        <div class="card-sub">${car.location} • ${car.year} • ${car.mileage ? car.mileage+' km' : ''}</div>
      </div>
    </div>
    <div class="card-foot">
      <div class="card-price">${formatPrice(car.price)}</div>
      <button class="btn" data-id="${car.id}">Detail</button>
    </div>`;
  catalog.appendChild(div);

  div.querySelector('.btn').addEventListener('click', ()=> openDetail(car));
}

function openDetail(car){
  currentImages = car.images && car.images.length ? car.images : ['https://via.placeholder.com/1000x600?text=No+Image'];
  currentImgIndex = 0;
  modalImage.src = currentImages[0];
  modalTitle.textContent = car.title;
  modalPrice.textContent = formatPrice(car.price);
  modalYear.textContent = car.year || '-';
  modalMileage.textContent = car.mileage ? car.mileage + ' km' : '-';
  modalLocation.textContent = car.location || '-';
  modalDesc.textContent = car.description || '-';
  modalStatus.textContent = car.status || 'available';
  // whatsapp link
  const wa = (car.whatsapp || '').replace(/\D/g,'');
  const text = encodeURIComponent(`Halo, saya tertarik dengan ${car.title}. Apakah unit masih tersedia?`);
  if(wa) whatsappBtn.href = `https://wa.me/${wa}?text=${text}`;
  else whatsappBtn.href = '#';
  // share detail: we create a pseudo link with hash id to allow direct linking if hosted
  currentDetailUrl = location.href.split('#')[0] + '#car-' + encodeURIComponent(car.id);
  shareBtn.href = currentDetailUrl;
  shareBtn.onclick = (e)=>{ e.preventDefault(); navigator.clipboard?.writeText(currentDetailUrl).then(()=>alert('Link detail disalin ke clipboard')); };
  if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute('open', true);
}

function closeModal(){
  if (typeof modal.close === "function") modal.close(); else modal.removeAttribute('open');
}

prevImg.addEventListener('click', ()=> {
  if(!currentImages.length) return;
  currentImgIndex = (currentImgIndex - 1 + currentImages.length) % currentImages.length;
  modalImage.src = currentImages[currentImgIndex];
});
nextImg.addEventListener('click', ()=> {
  if(!currentImages.length) return;
  currentImgIndex = (currentImgIndex + 1) % currentImages.length;
  modalImage.src = currentImages[currentImgIndex];
});
closeModalBtn.addEventListener('click', closeModal);

function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  const status = filterStatus.value;
  catalog.innerHTML = '';
  const filtered = cars.filter(c=>{
    if(status && c.status !== status) return false;
    if(!q) return true;
    return (c.title || '').toLowerCase().includes(q)
      || (c.description || '').toLowerCase().includes(q)
      || (c.location || '').toLowerCase().includes(q)
      || (''+c.year).includes(q);
  });
  if(filtered.length === 0){ emptyMsg.hidden = false; } else { emptyMsg.hidden = true; filtered.forEach(renderCard) }
}

fetch('cars.json').then(r=>r.json()).then(data=>{
  // support both formats: { cars: [...] } or [...]
  cars = data.cars || data;
  applyFilters();
  // if URL contains hash to open a specific car
  if(location.hash && location.hash.startsWith('#car-')){
    const id = decodeURIComponent(location.hash.replace('#car-',''));
    const c = cars.find(x=> String(x.id) === String(id));
    if(c) openDetail(c);
  }
}).catch(err=>{
  emptyMsg.hidden = false;
  emptyMsg.textContent = 'Gagal memuat data katalog.';
  console.error(err);
});

searchInput.addEventListener('input', ()=> applyFilters());
filterStatus.addEventListener('change', ()=> applyFilters());
