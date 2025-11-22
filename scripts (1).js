// Shared scripts for the demo site
(function(){
  // If login modal already exists in travel.html, the header login buttons attach there.
  function attachHeaderLoginButtons(){
    const openBtns = document.querySelectorAll('#openLogin, #openLoginHeader');
    openBtns.forEach(b=>{
      b && b.addEventListener('click', ()=>{
        // If travel's modal exists, open it; otherwise just prompt demo login
        const overlay = document.getElementById('loginOverlay');
        if(overlay){ overlay.hidden = false; overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
        else {
          const name = prompt('Demo login — enter your name');
          if(name) localStorage.setItem('rvsUser', JSON.stringify({role:'customer', name}));
          window.location.reload();
        }
      });
    });
  }

  // Booking helper: dynamic pricing for tourism packages
  function initBookingForm(){
    const form = document.querySelector('#bookingForm');
    if(!form) return;
    const packageSelect = form.querySelector('[name="package"]');
    const guestsInput = form.querySelector('[name="guests"]');
    const basePriceEl = document.getElementById('basePrice');
    const totalPriceEl = document.getElementById('totalPrice');

    function updatePrice(){
      const selectedOption = packageSelect.options[packageSelect.selectedIndex];
      const basePrice = parseInt(selectedOption.getAttribute('data-price') || 0, 10);
      const guests = Math.max(1, parseInt(guestsInput.value || 1, 10));
      const total = basePrice * guests;
      
      basePriceEl.textContent = basePrice > 0 ? '₹' + basePrice.toLocaleString() : '₹0';
      totalPriceEl.textContent = total > 0 ? '₹' + total.toLocaleString() : '₹0.00';
    }
    packageSelect && packageSelect.addEventListener('change', updatePrice);
    guestsInput && guestsInput.addEventListener('input', updatePrice);
    
    // Check if a package was pre-selected from packages.html
    const selectedFromPackages = localStorage.getItem('selectedPackage');
    if(selectedFromPackages){
      try{
        const pkg = JSON.parse(selectedFromPackages);
        packageSelect.value = pkg.id;
        updatePrice();
      }catch(e){ console.warn('Could not restore package', e); }
    }
    updatePrice();

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const selectedOption = packageSelect.options[packageSelect.selectedIndex];
      const basePrice = parseInt(selectedOption.getAttribute('data-price') || 0, 10);
      const guests = parseInt(guestsInput.value || 1, 10);
      const total = basePrice * guests;
      
      const bookingId = 'BK' + Date.now();
      const data = {
        id: bookingId,
        package: selectedOption.text,
        basePrice: basePrice,
        guests: guests,
        totalPrice: total,
        name: form.querySelector('[name="name"]').value,
        email: form.querySelector('[name="email"]').value,
        phone: form.querySelector('[name="phone"]').value,
        date: form.querySelector('[name="date"]').value,
        created: new Date().toISOString(),
        status: 'pending'
      };
      const existing = JSON.parse(localStorage.getItem('rvsBookings')||'[]');
      existing.push(data);
      localStorage.setItem('rvsBookings', JSON.stringify(existing));
      localStorage.removeItem('selectedPackage'); // Clear the pre-selection
      alert('✓ Booking confirmed!\nBooking Reference: ' + bookingId + '\n\nYour booking has been saved locally. Visit Admin Dashboard to view all bookings.');
      form.reset();
      updatePrice();
    });
  }

  // Admin dashboard listing bookings
  function initAdminDashboard(){
    const root = document.getElementById('adminBookings');
    if(!root) return;
    function render(){
      const bookings = JSON.parse(localStorage.getItem('rvsBookings')||'[]');
      if(!bookings.length){ root.innerHTML = '<p>No bookings yet.</p>'; return; }
      const rows = bookings.map(b=>{
        return `<div class="booking-row"><strong>${b.package}</strong> — ${b.nights} nights — ${b.price} — ${b.name} <button class="approve" data-id="${b.id}">${b.status==='approved' ? 'Approved' : 'Approve'}</button> <button class="remove" data-id="${b.id}">Remove</button></div>`
      }).join('\n');
      root.innerHTML = rows;
      root.querySelectorAll('.approve').forEach(btn=> btn.addEventListener('click', function(){
        const id = this.dataset.id; const bookings = JSON.parse(localStorage.getItem('rvsBookings')||'[]');
        const idx = bookings.findIndex(x=>x.id===id); if(idx>=0){ bookings[idx].status='approved'; localStorage.setItem('rvsBookings', JSON.stringify(bookings)); render(); }
      }));
      root.querySelectorAll('.remove').forEach(btn=> btn.addEventListener('click', function(){
        const id = this.dataset.id; let bookings = JSON.parse(localStorage.getItem('rvsBookings')||'[]'); bookings = bookings.filter(x=>x.id!==id); localStorage.setItem('rvsBookings', JSON.stringify(bookings)); render();
      }));
    }
    render();
  }

  // Gallery lightbox
  function initGallery(){
    const grid = document.querySelector('.gallery-grid');
    if(!grid) return;
    const overlay = document.createElement('div'); overlay.className='lightbox-overlay'; overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:2000;visibility:hidden;opacity:0;transition:opacity .2s';
    const img = document.createElement('img'); img.style.maxWidth='90%'; img.style.maxHeight='90%'; overlay.appendChild(img);
    overlay.addEventListener('click', ()=>{ overlay.style.opacity='0'; overlay.style.visibility='hidden'; });
    document.body.appendChild(overlay);
    grid.querySelectorAll('img').forEach(im=>{
      im.style.cursor='zoom-in';
      im.addEventListener('click', ()=>{
        img.src = im.src; overlay.style.visibility='visible'; overlay.style.opacity='1';
      });
    });
  }

  // Replace destination images with random Unsplash photos based on data-query
  function initRandomDestinationImages(){
    const imgs = document.querySelectorAll('img[data-query]');
    if(!imgs || !imgs.length) return;
    imgs.forEach((img, i)=>{
      const q = img.getAttribute('data-query') || '';
      // Use Unsplash source to get a random image for the query; add a cache-buster
      try{
        const url = 'https://source.unsplash.com/800x600/?' + encodeURIComponent(q) + '&' + Date.now();
        img.src = url;
        img.loading = 'lazy';
      }catch(e){
        // If network fails, keep existing local svg
        console.warn('Could not load random image for', q, e);
      }
    });
  }

  // init on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    attachHeaderLoginButtons();
    initBookingForm();
    initAdminDashboard();
    initGallery();
    initRandomDestinationImages();
  });
})();

document.getElementById("bookingForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const packageSelect = document.getElementById("packageSelect");
    const totalPrice = document.getElementById("totalPrice").textContent;

    let booking = {
        id: Date.now(),
        name: this.name.value,
        email: this.email.value,
        phone: this.phone.value,
        package: packageSelect.options[packageSelect.selectedIndex].text,
        guests: this.guests.value,
        date: this.date.value,
        totalPrice: totalPrice
    };

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    bookings.push(booking);

    localStorage.setItem("bookings", JSON.stringify(bookings));

    alert("Booking saved successfully!");
    this.reset();
});

document.addEventListener("DOMContentLoaded", function () {
    let tableBody = document.querySelector("#bookingsTable tbody");

    // READ THE SAME KEY NAME AS SAVED IN booking page
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    if (bookings.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='8'>No bookings found.</td></tr>";
        return;
    }

    bookings.forEach(b => {
        let row = `
            <tr>
                <td>${b.id}</td>
                <td>${b.name}</td>
                <td>${b.email}</td>
                <td>${b.phone}</td>
                <td>${b.package}</td>
                <td>${b.guests}</td>
                <td>${b.date}</td>
                <td>${b.totalPrice}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
});

