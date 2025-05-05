document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    let currentFilter = 'all';

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        locale: 'fr',
        events: function(info, successCallback, failureCallback) {
            fetch(`/calendar/events?start=${info.startStr}&end=${info.endStr}`)
                .then(response => response.json())
                .then(events => {
                    if (currentFilter !== 'all') {
                        events = events.filter(event => event.extendedProps.type === currentFilter);
                    }
                    successCallback(events);
                })
                .catch(error => {
                    console.error('Error fetching events:', error);
                    failureCallback(error);
                });
        },
        eventClick: function(info) {
            const event = info.event;
            const props = event.extendedProps;
            
            // Mise à jour du modal
            document.querySelector('#eventModal .modal-title').textContent = event.title;
            
            let detailsHtml = `
                <p><strong>Type:</strong> ${props.type === 'invoice' ? 'Facture' : 'Devis'}</p>
                <p><strong>Statut:</strong> ${props.status}</p>
                <p><strong>Montant:</strong> ${props.amount.toLocaleString()} €</p>
                <p><strong>Fournisseur:</strong> ${props.supplier}</p>
                <p><strong>Date de début:</strong> ${new Date(event.start).toLocaleDateString()}</p>
                <p><strong>Date de fin:</strong> ${new Date(event.end).toLocaleDateString()}</p>
            `;
            
            document.querySelector('#eventModal .event-details').innerHTML = detailsHtml;
            
            // Mise à jour du lien "Voir détails"
            const viewDetailsLink = document.querySelector('#eventModal .view-details');
            if (props.type === 'invoice') {
                viewDetailsLink.href = `/accounting/invoice/${event.id.replace('invoice-', '')}`;
            } else {
                viewDetailsLink.href = `/fournisseurs/${props.supplier}#quotation-${event.id.replace('quotation-', '')}`;
            }
            
            modal.show();
        }
    });

    calendar.render();

    // Gestionnaire de filtres
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            currentFilter = filter;
            
            // Mise à jour des classes des boutons
            document.querySelectorAll('[data-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Rafraîchir le calendrier
            calendar.refetchEvents();
        });
    });
});
