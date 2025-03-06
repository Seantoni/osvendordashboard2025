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
    
    const offersTable = document.querySelector('.offers-table');
    
    // Check if the element exists before adding event listeners
    if (offersTable) {
      offersTable.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, false);
      
      offersTable.addEventListener('touchend', e => {
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
    } else {
      console.log('Info: .offers-table element not found. Touch support not initialized.');
    }
  }

  // Initialize touch support
  document.addEventListener('DOMContentLoaded', function() {
    addTouchSupport();
  });
  
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

  const contactNameInput = document.getElementById("contact-name");
  const contactMessageTextarea = document.getElementById("contact-message");

  contactNameInput.addEventListener("invalid", function () {
    this.setCustomValidity("Por favor, complete este campo.");
  });

  contactMessageTextarea.addEventListener("invalid", function () {
    this.setCustomValidity("Por favor, complete este campo.");
  });

  // Clear the custom message when the user starts typing
  contactNameInput.addEventListener("input", function () {
    this.setCustomValidity("");
  });

  contactMessageTextarea.addEventListener("input", function () {
    this.setCustomValidity("");
  });
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
      showContactForm("Ventas");
      closePopup(popup);
    });
    
    document.getElementById("option-atencion-aliado").addEventListener("click", function() {
      showContactForm("Atención al Aliado");
      closePopup(popup);
    });
  }
  openPopup(popup);
}

// Function to display the contact form after selecting a department
function showContactForm(department) {
  let formPopup = document.getElementById("contact-form-popup");
  if (formPopup) {
    document.body.removeChild(formPopup);
  }
  
  // Determine which email to use based on department
  const departmentEmail = department === "Ventas" ? "sales@ofertasimple.com" : "ere@ofertasimple.com";
  
  formPopup = document.createElement("div");
  formPopup.id = "contact-form-popup";
  formPopup.innerHTML = `
    <div class="popup-overlay">
      <div class="popup-content email-form" style="width: 1200px; max-width: 95vw;">
        <div class="email-header">
          <div class="email-header-title">
            <div class="email-icon-container">
              <i class="fas fa-envelope email-icon"></i>
            </div>
            <h3 class="popup-title">
              Nuevo mensaje a ${department}
            </h3>
          </div>
          <div class="email-controls">
            <button id="form-close" class="email-control-btn close-btn" title="Cerrar">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <form id="expert-contact-form" class="contact-form">
          <div class="email-fields">
            <div class="email-field animated-field">
              <div class="field-row">
                <label for="contact-email">Para:</label>
                <div class="email-recipient">
                  <span class="department-chip">
                    <i class="fas ${department === "Ventas" ? "fa-dollar-sign" : "fa-handshake"}"></i>
                    ${department} <span class="email-address">&lt;${departmentEmail}&gt;</span>
                  </span>
                </div>
                <input type="hidden" id="contact-email" name="email" value="${departmentEmail}">
              </div>
            </div>
            
            <div class="email-field animated-field">
              <div class="field-row">
                <label for="contact-name">De:</label>
                <div class="input-with-icon">
                  <i class="fas fa-user input-icon"></i>
                  <input type="text" id="contact-name" name="name" required placeholder="Su nombre completo" class="animated-input">
                </div>
              </div>
              <div class="error-message" id="name-error">Por favor, complete este campo con su nombre.</div>
            </div>
            
            <div class="email-field animated-field">
              <div class="field-row">
                <label for="contact-phone">Teléfono:</label>
                <div class="input-with-icon">
                  <i class="fas fa-phone input-icon"></i>
                  <input type="tel" id="contact-phone" name="phone" required placeholder="Su número de teléfono" class="animated-input">
                </div>
              </div>
              <div class="error-message" id="phone-error">Por favor, introduzca su número de teléfono.</div>
            </div>
          </div>
          
          <div class="email-body">
            <div class="message-tips">
              <i class="fas fa-lightbulb tip-icon"></i>
              <span class="tip-text">Tip: Sea específico en su consulta para recibir una respuesta más rápida</span>
            </div>
            <label for="contact-message" class="sr-only">Mensaje:</label>
            <textarea id="contact-message" name="message" rows="8" required placeholder="Escriba su mensaje aquí..." class="animated-input"></textarea>
            <div class="error-message" id="message-error">Por favor, escriba su mensaje.</div>
          </div>
          
          <input type="hidden" id="contact-department" name="department" value="${department}">
          
          <div class="email-footer">
            <button type="submit" class="send-email-btn">
              <i class="fas fa-paper-plane send-icon"></i> Enviar mensaje
              <span class="send-effect"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(formPopup);
  
  // Add CSS for the enhanced email-like styling
  const styleElement = document.createElement('style');
  styleElement.id = 'email-form-styles';
  styleElement.textContent = `
    /* Target all popup content inside the form popup */
    #contact-form-popup .popup-content {
      width: 1200px !important;
      max-width: 95% !important;
      padding: 0 !important;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 15px 35px rgba(0,0,0,0.2);
      transform: translateY(20px);
      animation: slide-up 0.3s ease forwards;
      background: #fff;
      margin: auto;
    }
    
    /* Override any existing popup-content styles */
    .popup-content.email-form {
      width: 1200px !important;
      max-width: 95% !important;
    }
    
    @keyframes slide-up {
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .email-header {
      background: linear-gradient(135deg, var(--main-color) 0%, #ff7e3b 100%);
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .email-header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .email-icon-container {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(255,255,255,0.4);
      }
      70% {
        box-shadow: 0 0 0 8px rgba(255,255,255,0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255,255,255,0);
      }
    }
    
    .email-icon {
      font-size: 1.2rem;
    }
    
    .email-header .popup-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: white;
    }
    
    .form-title {
      padding: 1.25rem 1.25rem 0.5rem 1.25rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 0.75rem;
    }
    
    .department-name {
      color: var(--main-color);
      font-weight: 700;
    }
    
    .email-controls {
      display: flex;
      gap: 0.5rem;
    }
    
    .email-control-btn {
      background: transparent;
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .email-control-btn:hover {
      background: rgba(255,255,255,0.2);
    }
    
    .email-control-btn.close-btn:hover {
      background: rgba(255, 70, 70, 0.8);
    }
    
    .email-control-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .email-fields {
      padding: 1.25rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .email-field {
      display: flex;
      flex-direction: column;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eeeeee;
      position: relative;
    }
    
    .field-row {
      display: flex;
      align-items: center;
      width: 100%;
    }
    
    .animated-field {
      animation: fade-in 0.4s ease-out forwards;
      opacity: 0;
      transform: translateY(8px);
    }
    
    .animated-field:nth-child(1) { animation-delay: 0.1s; }
    .animated-field:nth-child(2) { animation-delay: 0.2s; }
    .animated-field:nth-child(3) { animation-delay: 0.3s; }
    .animated-field:nth-child(4) { animation-delay: 0.4s; }
    
    @keyframes fade-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .email-field:last-child {
      border-bottom: none;
    }
    
    .email-field label {
      min-width: 80px;
      font-weight: 600;
      color: #555;
      font-size: 0.9rem;
    }
    
    .input-with-icon {
      flex: 1;
      display: flex;
      align-items: center;
      position: relative;
      background: rgba(0,0,0,0.02);
      border-radius: 6px;
      transition: background 0.2s;
      height: 46px;
      border: 1px solid transparent;
    }
    
    .input-with-icon:focus-within {
      background: rgba(0,0,0,0.01);
      box-shadow: 0 0 0 2px rgba(232, 76, 15, 0.1);
      border-color: rgba(232, 76, 15, 0.3);
    }
    
    .input-icon {
      color: #999;
      margin-left: 15px;
      width: 18px;
      text-align: center;
      font-size: 1rem;
    }
    
    .animated-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 0.7rem 0.75rem;
      font-size: 0.95rem;
      transition: all 0.2s;
      height: 100%;
    }
    
    .animated-input:focus {
      outline: none;
    }
    
    .animated-input::placeholder {
      color: #aaa;
      transition: color 0.2s;
    }
    
    .animated-input:focus::placeholder {
      color: #ccc;
    }
    
    .error-message {
      display: none;
      color: #e53935;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      padding-left: 80px;
      font-weight: 500;
    }
    
    .email-recipient {
      flex: 1;
      display: flex;
      gap: 0.5rem;
    }
    
    .department-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.65rem 1rem;
      background: linear-gradient(135deg, #e9ecef 0%, #f5f7fa 100%);
      border-radius: 20px;
      font-size: 0.95rem;
      gap: 0.6rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: transform 0.2s, box-shadow 0.2s;
      height: 46px;
    }
    
    .department-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 6px rgba(0,0,0,0.1);
    }
    
    .email-address {
      color: #666;
      font-weight: normal;
    }
    
    .email-body {
      padding: 1.25rem;
      background: white;
      position: relative;
    }
    
    .email-body textarea {
      width: 100%;
      border: 1px solid transparent;
      border-radius: 6px;
      resize: vertical;
      min-height: 250px;
      font-size: 0.95rem;
      font-family: inherit;
      padding: 0.75rem;
      line-height: 1.6;
      margin-top: 10px;
      background: rgba(0,0,0,0.02);
      transition: all 0.2s;
    }
    
    .email-body textarea:focus {
      outline: none;
      background: rgba(0,0,0,0.01);
      box-shadow: 0 0 0 2px rgba(232, 76, 15, 0.1);
      border-color: rgba(232, 76, 15, 0.3);
    }
    
    .message-tips {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #777;
      margin-bottom: 10px;
    }
    
    .tip-icon {
      color: #FFC107;
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    .email-footer {
      padding: 1.25rem;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    
    .send-email-btn {
      background: linear-gradient(135deg, var(--main-color) 0%, #ff7e3b 100%);
      color: white;
      border: none;
      padding: 0.7rem 1.5rem;
      border-radius: 30px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(232, 76, 15, 0.2);
    }
    
    .send-email-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(232, 76, 15, 0.3);
    }
    
    .send-email-btn:active {
      transform: translateY(0);
    }
    
    .send-icon {
      transition: transform 0.3s;
    }
    
    .send-email-btn:hover .send-icon {
      transform: translateX(3px);
    }
    
    .send-effect {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0%;
      height: 0%;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.5s;
    }
    
    .send-email-btn:active .send-effect {
      width: 300%;
      height: 300%;
      opacity: 0;
    }
    
    #contact-form-popup .popup-overlay {
      padding: 30px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .input-error {
      border: 1px solid #e53935 !important;
      background-color: rgba(229, 57, 53, 0.05) !important;
    }
    
    @media (max-width: 768px) {
      .field-row {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .field-row label {
        margin-bottom: 0.5rem;
      }
      
      .input-with-icon, .department-chip {
        width: 100%;
      }
      
      .error-message {
        padding-left: 0;
      }
      
      .email-footer {
        flex-direction: column;
        align-items: stretch;
      }
      
      .send-email-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `;
  
  if (!document.getElementById('email-form-styles')) {
    document.head.appendChild(styleElement);
  } else {
    // Replace existing styles
    document.getElementById('email-form-styles').textContent = styleElement.textContent;
  }
  
  // Set up event listeners
  document.getElementById("form-close").addEventListener("click", function() {
    closePopup(formPopup);
    // Clean up added styles when closing
    const styles = document.getElementById('email-form-styles');
    if (styles) {
      styles.remove();
    }
  });
  
  // Get form elements
  const form = document.getElementById("expert-contact-form");
  const nameInput = document.getElementById("contact-name");
  const phoneInput = document.getElementById("contact-phone");
  const messageInput = document.getElementById("contact-message");
  
  // Get error message elements
  const nameError = document.getElementById("name-error");
  const phoneError = document.getElementById("phone-error");
  const messageError = document.getElementById("message-error");
  
  // Function to validate the form
  function validateForm() {
    let isValid = true;
    
    // Validate name
    if (!nameInput.value.trim()) {
      nameInput.closest('.input-with-icon').classList.add("input-error");
      nameError.style.display = "block";
      isValid = false;
    } else {
      nameInput.closest('.input-with-icon').classList.remove("input-error");
      nameError.style.display = "none";
    }
    
    // Validate phone
    if (!phoneInput.value.trim()) {
      phoneInput.closest('.input-with-icon').classList.add("input-error");
      phoneError.style.display = "block";
      isValid = false;
    } else {
      phoneInput.closest('.input-with-icon').classList.remove("input-error");
      phoneError.style.display = "none";
    }
    
    // Validate message
    if (!messageInput.value.trim()) {
      messageInput.classList.add("input-error");
      messageError.style.display = "block";
      isValid = false;
    } else {
      messageInput.classList.remove("input-error");
      messageError.style.display = "none";
    }
    
    return isValid;
  }
  
  // Clear validation errors on input
  nameInput.addEventListener("input", function() {
    this.closest('.input-with-icon').classList.remove("input-error");
    nameError.style.display = "none";
  });
  
  phoneInput.addEventListener("input", function() {
    this.closest('.input-with-icon').classList.remove("input-error");
    phoneError.style.display = "none";
  });
  
  messageInput.addEventListener("input", function() {
    this.classList.remove("input-error");
    messageError.style.display = "none";
  });
  
  // Handle form submission
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return false;
    }
    
    // Get the send button and add class for animation
    const sendBtn = document.querySelector(".send-email-btn");
    if (sendBtn) {
      sendBtn.classList.add("sending");
      sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      sendBtn.disabled = true;
    }
    
    // Simulate sending delay
    setTimeout(() => {
      const name = document.getElementById("contact-name").value;
      const email = document.getElementById("contact-email").value;
      const phone = document.getElementById("contact-phone").value;
      const message = document.getElementById("contact-message").value;
      const dept = document.getElementById("contact-department").value;
      
      // Here you would normally send this data to your backend
      // For now we'll just show a confirmation
      showConfirmationMessage(`Su mensaje ha sido enviado con éxito al departamento de ${dept}.`, "success");
      
      closePopup(formPopup);
      // Clean up added styles when closing
      const styles = document.getElementById('email-form-styles');
      if (styles) {
        styles.remove();
      }
    }, 1000);
  });
  
  // Force the popup to be wide enough
  setTimeout(() => {
    const popupContent = formPopup.querySelector('.popup-content');
    if (popupContent) {
      popupContent.style.width = '1200px';
      popupContent.style.maxWidth = '95vw';
    }
  }, 10);
  
  openPopup(formPopup);
}

// Function to display a confirmation message after form submission
function showConfirmationMessage(message, type = "info") {
  let confirmPopup = document.getElementById("confirmation-popup");
  if (confirmPopup) {
    document.body.removeChild(confirmPopup);
  }
  
  confirmPopup = document.createElement("div");
  confirmPopup.id = "confirmation-popup";
  confirmPopup.innerHTML = `
    <div class="popup-overlay">
      <div class="popup-content">
        <div class="${type}-icon">
          <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle'}"></i>
        </div>
        <h3 class="popup-title">${type === 'success' ? '¡Éxito!' : 'Información'}</h3>
        <p>${message}</p>
        <button id="confirmacion-close" class="popup-option-btn" style="background: var(--main-color); color: white;">
          <i class="fas fa-check"></i> Aceptar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmPopup);
  
  document.getElementById("confirmacion-close").addEventListener("click", function() {
    closePopup(confirmPopup);
  });
  
  openPopup(confirmPopup);
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