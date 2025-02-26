// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
  // Ensure first deal is expanded by default
  const firstOfferRow = document.querySelector("tr.offer-row");
  const firstDetailsRow = firstOfferRow.nextElementSibling;
  if (firstOfferRow && firstDetailsRow) {
    firstOfferRow.classList.add("expanded");
    firstDetailsRow.style.display = "table-row";
  }

  const toggleButtons = document.querySelectorAll(".status-filters .toggle");
  const searchInput = document.getElementById("offerSearch");
  const offersTableBody = document.getElementById("offersTableBody");

  // Toggle button filter
  toggleButtons.forEach(button => {
    button.addEventListener("click", function () {
      // Remove active from all buttons and add to the clicked one
      toggleButtons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");
      filterOffers();
    });
  });

  // Debounce search input
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Use debounced search
  searchInput.addEventListener("input", debounce(filterOffers, 300));

  // Filter function for offers based on status and search
  function filterOffers() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector(".status-filters .active").getAttribute("data-status");
    
    // Get all offer rows (assumes each offer row is followed by a details row)
    const offerRows = offersTableBody.querySelectorAll("tr.offer-row");

    offerRows.forEach(row => {
      // Get only the offer name text, excluding the dropdown arrow
      const offerName = row.querySelector(".offer-name")?.innerText.toLowerCase() || "";
      const offerStatus = row.getAttribute("data-status"); // e.g., "active" or "inactive"
      
      // Determine if the row passes the status filter
      const statusMatches = activeFilter === "all" || offerStatus === activeFilter;
      // Determine if it passes the search filter
      const searchMatches = offerName.indexOf(searchTerm) !== -1;

      // Show or hide the row (and its details row)
      if (statusMatches && searchMatches) {
        row.style.display = "";
        // also show details row if it was expanded before filtering (optional)
        const detailsRow = row.nextElementSibling;
        if (detailsRow && detailsRow.classList.contains("offer-details")) {
          // Keep details row display state based on parent row's expanded state
          detailsRow.style.display = row.classList.contains("expanded") ? "table-row" : "none";
        }
      } else {
        row.style.display = "none";
        // Also hide its details row
        const detailsRow = row.nextElementSibling;
        if (detailsRow && detailsRow.classList.contains("offer-details")) {
          detailsRow.style.display = "none";
        }
      }
    });
  }

  // Expandable offer details toggle
  offersTableBody.addEventListener("click", function (e) {
    const arrowEl = e.target.closest(".dropdown-arrow");
    if (arrowEl) {
      const offerTitleDiv = arrowEl.closest(".offer-title");
      const offerRow = offerTitleDiv.closest("tr");
      const detailsRow = offerRow.nextElementSibling;
      
      if (detailsRow && detailsRow.classList.contains("offer-details")) {
        // Toggle the expanded class for animation
        offerRow.classList.toggle("expanded");
        
        // Check current display value, considering the CSS default is now "none"
        const currentDisplay = window.getComputedStyle(detailsRow).display;
        if (currentDisplay === "none") {
          detailsRow.style.display = "table-row";
        } else {
          detailsRow.style.display = "none";
        }
      }
    }
  });

  // Action buttons events (refresh, support, download)
  offersTableBody.addEventListener("click", function (e) {
    const btn = e.target.closest(".action-btn");
    if (btn) {
      if (btn.classList.contains("refresh")) {
        // Get the corresponding offer name from the row and show the repetir popup.
        const offerRow = btn.closest("tr.offer-row");
        const offerName = offerRow.querySelector(".offer-name").innerText;
        showRepetirPopup(offerName);
      } else if (btn.classList.contains("support")) {
        showContactPopup();
      } else if (btn.classList.contains("download")) {
        const offerRow = btn.closest("tr.offer-row");
        const offerName = offerRow.querySelector(".offer-name").innerText;
        showReportsPopup(offerName);
      } else if (btn.classList.contains("purchases-report")) {
        const offerRow = btn.closest("tr.offer-row");
        const offerName = offerRow.querySelector(".offer-name").innerText;
        showPurchasesReportPopup(offerName);
      }
    }
  });

  // Function to display the contact popup
  function showContactPopup() {
    let popup = document.getElementById("contact-popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "contact-popup";
      popup.innerHTML = `
        <div class="popup-overlay">
          <div class="popup-content">
            <h3 class="popup-title">Seleccione área de contacto</h3>
            <div class="popup-options">
              <button id="option-ventas" class="popup-option-btn">
                <i class="fas fa-dollar-sign"></i>
                Ventas
              </button>
              <button id="option-atencion-aliado" class="popup-option-btn">
                <i class="fas fa-handshake"></i>
                Atención al Aliado
              </button>
            </div>
            <button id="contact-popup-close" class="popup-close">Cerrar</button>
          </div>
        </div>
      `;
      document.body.appendChild(popup);

      // Set up event listeners
      document.getElementById("contact-popup-close").addEventListener("click", function() {
        closePopup(popup);
      });
      
      document.getElementById("option-ventas").addEventListener("click", function() {
        alert("Ventas seleccionado.");
        closePopup(popup);
      });
      
      document.getElementById("option-atencion-aliado").addEventListener("click", function() {
        alert("Atención al Aliado seleccionado.");
        closePopup(popup);
      });
    }
    openPopup(popup);
  }

  // Function to display the repetir popup
  function showRepetirPopup(offerName) {
    let popup = document.getElementById("repetir-popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "repetir-popup";
      popup.innerHTML = `
        <div class="popup-overlay">
          <div class="popup-content">
            <h3 class="popup-title">Repetir Publicación</h3>
            <p>¿Estás de acuerdo en repetir publicación <strong>${offerName}</strong>?</p>
            <div class="popup-options" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
              <button id="confirm-repetir" class="popup-option-btn">Sí</button>
              <button id="cancel-repetir" class="popup-option-btn">No</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(popup);

      // Set up event listeners for the repetir popup buttons
      document.getElementById("confirm-repetir").addEventListener("click", function() {
        closePopup(popup);
        showConfirmacionPopup();
      });
      document.getElementById("cancel-repetir").addEventListener("click", function() {
        closePopup(popup);
      });

      // Add keyboard support
      const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
          closePopup(popup);
        } else if (e.key === 'Enter') {
          document.getElementById('confirm-repetir').click();
        }
      };
      document.addEventListener('keydown', handleKeyPress);
      
      // Clean up event listener when popup closes
      const cleanup = () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
      popup.addEventListener('hidden', cleanup, { once: true });
    } else {
      // Update the message with the current offer name if the popup already exists
      const p = popup.querySelector("p");
      p.innerHTML = `¿Estás de acuerdo en repetir publicación <strong>${offerName}</strong>?`;
    }
    openPopup(popup);
  }

  // Function to create confetti
  function createConfetti() {
    const colors = ['#E84c0f', '#ff6b3d', '#ffd700', '#2563eb'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.width = (Math.random() * 10 + 5) + 'px';
      confetti.style.height = (Math.random() * 10 + 5) + 'px';
      confetti.style.background = randomColor;
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      // Random animation
      const animationName = Math.random() < 0.33 ? 'slow' : (Math.random() < 0.66 ? 'medium' : 'fast');
      confetti.classList.add(`confetti--animation-${animationName}`);
      
      document.body.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => confetti.remove(), 3000);
    }
  }

  // Function to display the confirmation popup after repetir publicación
  function showConfirmacionPopup() {
    let cPopup = document.getElementById("confirmacion-popup");
    if (!cPopup) {
      cPopup = document.createElement("div");
      cPopup.id = "confirmacion-popup";
      cPopup.innerHTML = `
        <div class="popup-overlay">
          <div class="popup-content success">
            <div class="success-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <h3 class="popup-title">Publicación Enviada</h3>
            <p style="margin: 1rem 0;">¡Excelente! Tu publicación fue enviada y será revisada por nuestro equipo 
            en las siguientes 24 horas hábiles. ¡Te contactaremos apenas terminemos! 🎉</p>
            <div class="popup-options" style="margin-top: 1rem;">
              <button id="confirmacion-close" class="popup-option-btn" style="background: var(--main-color); color: white;">
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(cPopup);

      document.getElementById("confirmacion-close").addEventListener("click", function() {
        closePopup(cPopup);
      });
    }
    openPopup(cPopup);
    // Trigger confetti animation
    createConfetti();
  }

  // Helper functions for popup animations
  function openPopup(popup) {
    popup.style.display = "block";
    // Trigger reflow
    popup.offsetHeight;
    popup.querySelector('.popup-overlay').classList.add('active');
  }

  function closePopup(popup) {
    const overlay = popup.querySelector('.popup-overlay');
    overlay.classList.remove('active');
    setTimeout(() => {
      popup.style.display = "none";
    }, 300); // Match the transition duration
  }

  // Generic error handler
  function handleError(error, retryFn) {
    const errorPopup = document.createElement('div');
    errorPopup.innerHTML = `
      <div class="popup-overlay">
        <div class="popup-content">
          <div class="error-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3 class="popup-title">Error</h3>
          <p>${error.message}</p>
          <div class="popup-options">
            <button class="popup-option-btn" onclick="retryFn()">Reintentar</button>
            <button class="popup-close">Cerrar</button>
          </div>
        </div>
      </div>
    `;
  }

  // Merge table sorting and best-deal button functionality in one DOMContentLoaded callback:
  // Initialize table sorting
  const table = document.querySelector('.offers-list table');
  if (table) {
    const headers = table.querySelectorAll('th.sortable');
    let currentSort = {
      column: null,
      direction: 'asc'
    };

    headers.forEach(header => {
      header.addEventListener('click', () => {
        const sortKey = header.dataset.sort;
        
        // Remove sort classes from all headers
        headers.forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });

        // Determine sort direction
        if (currentSort.column === sortKey) {
          currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.column = sortKey;
          currentSort.direction = 'asc';
        }

        // Add sort class to current header
        header.classList.add(`sort-${currentSort.direction}`);

        // Get table rows and convert to array for sorting
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr.offer-row'));

        // Sort rows
        const sortedRows = rows.sort((a, b) => {
          let aVal = getCellValue(a, sortKey);
          let bVal = getCellValue(b, sortKey);

          // Handle different data types
          switch(sortKey) {
            case 'date':
              aVal = new Date(aVal);
              bVal = new Date(bVal);
              break;
            case 'progress':
              aVal = parseFloat(aVal.replace('%', ''));
              bVal = parseFloat(bVal.replace('%', ''));
              break;
            case 'redemptions':
              aVal = parseInt(aVal.split('/')[0]);
              bVal = parseInt(bVal.split('/')[0]);
              break;
            case 'earnings':
              aVal = parseFloat(aVal.replace('$', '').replace(',', ''));
              bVal = parseFloat(bVal.replace('$', '').replace(',', ''));
              break;
          }

          if (currentSort.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });

        // Reorder rows in the table
        sortedRows.forEach(row => {
          const detailsRow = row.nextElementSibling;
          tbody.appendChild(row);
          if (detailsRow && detailsRow.classList.contains('offer-details')) {
            tbody.appendChild(detailsRow);
          }
        });
      });
    });

    // Helper function to get cell value based on sort key
    function getCellValue(row, key) {
      const cell = row.querySelector(`td:nth-child(${getColumnIndex(key)})`);
      if (!cell) return '';
      
      switch(key) {
        case 'name':
          return cell.querySelector('.offer-name')?.textContent || '';
        case 'status':
          return cell.querySelector('.status')?.textContent || '';
        case 'progress':
          return cell.querySelector('.progress-value')?.textContent || '0';
        default:
          return cell.textContent.trim();
      }
    }

    // Helper function to get column index based on sort key
    function getColumnIndex(key) {
      const map = {
        'name': 1,
        'date': 2,
        'status': 3,
        'progress': 4,
        'redemptions': 5,
        'earnings': 6
      };
      return map[key];
    }
  }

  // Add repetir publicación functionality to best deal cards (only for the "Repetir publicación" button)
  const bestDealCTAButtons = document.querySelectorAll(".best-deal-card .cta-button");
  console.log("Best deal CTA buttons found:", bestDealCTAButtons.length);
  bestDealCTAButtons.forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation(); // Prevent any parent card click events (if present)
      const bestDealCard = btn.closest(".best-deal-card");
      const offerNameElement = bestDealCard.querySelector(".best-deal-name strong");
      if (offerNameElement) {
        const offerName = offerNameElement.innerText;
        showRepetirPopup(offerName);
      }
    });
  });

  // Add touch support for table interactions
  function addTouchSupport() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.querySelector('.offers-table').addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    document.querySelector('.offers-table').addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, false);
    
    function handleSwipe() {
      const swipeThreshold = 100;
      const swipeDistance = touchEndX - touchStartX;
      
      if (Math.abs(swipeDistance) < swipeThreshold) {
        // If it's a tap rather than a swipe, handle row expansion
        return;
      }
    }
  }

  // Initialize touch support
  addTouchSupport();
  
  // Check if mobile and adjust initial state
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    // Collapse all rows initially on mobile
    document.querySelectorAll('.offer-details').forEach(row => {
      row.style.display = 'none';
    });
    document.querySelectorAll('.offer-row').forEach(row => {
      row.classList.remove('expanded');
    });
  }

  // Function to display the reports popup
  function showReportsPopup(offerName) {
    let popup = document.getElementById("reports-popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "reports-popup";
      popup.innerHTML = `
        <div class="popup-overlay">
          <div class="popup-content">
            <h3 class="popup-title">Seleccione el reporte</h3>
            <div class="popup-section">
              <div class="popup-options">
                <button id="period-dia-anterior" class="popup-option-btn">
                  <i class="fas fa-calendar-day"></i>
                  Día Anterior
                </button>
                <button id="period-mismo-dia" class="popup-option-btn">
                  <i class="fas fa-calendar-day"></i>
                  Mismo Día
                </button>
                <button id="period-semana-anterior" class="popup-option-btn">
                  <i class="fas fa-calendar-week"></i>
                  Semana Anterior
                </button>
                <button id="period-mes-anterior" class="popup-option-btn">
                  <i class="fas fa-calendar-alt"></i>
                  Mes Anterior
                </button>
              </div>
            </div>
            
            <button id="reports-popup-close" class="popup-close">Cerrar</button>
          </div>
        </div>
      `;
      document.body.appendChild(popup);

      // Set up event listeners
      document.getElementById("reports-popup-close").addEventListener("click", function() {
        closePopup(popup);
      });
      
      // Definir acciones para cada opción de periodo
      const handlePeriodSelection = (periodId) => {
        // En un escenario real, aquí se podría redirigir a una URL específica según el periodo
        // Por ahora, solo mostraremos un mensaje y cerraremos el popup
        const periodText = document.getElementById(periodId).innerText.trim();
        window.open(`https://example.com/reporte?periodo=${periodId}&oferta=${encodeURIComponent(offerName)}`, '_blank');
        closePopup(popup);
      };
      
      document.getElementById("period-dia-anterior").addEventListener("click", function() {
        handlePeriodSelection("period-dia-anterior");
      });
      
      document.getElementById("period-mismo-dia").addEventListener("click", function() {
        handlePeriodSelection("period-mismo-dia");
      });
      
      document.getElementById("period-semana-anterior").addEventListener("click", function() {
        handlePeriodSelection("period-semana-anterior");
      });
      
      document.getElementById("period-mes-anterior").addEventListener("click", function() {
        handlePeriodSelection("period-mes-anterior");
      });
      
      // Add keyboard navigation support
      const popupButtons = popup.querySelectorAll('.popup-option-btn');
      let currentFocusIndex = 0;
      
      const handleKeyNavigation = (e) => {
        if (e.key === 'Escape') {
          closePopup(popup);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          currentFocusIndex = Math.min(currentFocusIndex + 1, popupButtons.length - 1);
          popupButtons[currentFocusIndex].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          currentFocusIndex = Math.max(currentFocusIndex - 1, 0);
          popupButtons[currentFocusIndex].focus();
        } else if (e.key === 'Enter') {
          popupButtons[currentFocusIndex].click();
        }
      };
      
      document.addEventListener('keydown', handleKeyNavigation);
      
      // Remove event listener when popup is closed
      const cleanup = () => {
        document.removeEventListener('keydown', handleKeyNavigation);
      };
      popup.addEventListener('hidden', cleanup, { once: true });
    } else {
      // Update the message with the current offer name if the popup already exists
      const p = popup.querySelector("p");
      p.innerHTML = `Publicación: <strong>${offerName}</strong>`;
    }
    openPopup(popup);
  }

  // Function to display the purchases report popup
  function showPurchasesReportPopup(offerName) {
    // Redirect directly to the purchases report page
    window.open(`https://example.com/reporte-compras?oferta=${encodeURIComponent(offerName)}`, '_blank');
  }
}); 