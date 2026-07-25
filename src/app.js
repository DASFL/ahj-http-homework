import HelpDeskApi from './api';

export default class HelpDesk {
  constructor(container, api = new HelpDeskApi()) {
    this.container = container;
    this.api = api;
    this.tickets = [];
    this.expanded = new Set();
  }

  init() {
    this.container.innerHTML = `
      <section class="helpdesk">
        <header class="helpdesk__header">
          <button class="button button--primary" data-action="add">Добавить тикет</button>
        </header>
        <div class="notice" hidden></div>
        <div class="tickets" aria-live="polite"></div>
      </section>
      <div class="modal-host"></div>
      <div class="loader" hidden aria-label="Загрузка"><span></span></div>
    `;
    this.container.addEventListener('click', (event) => this.onClick(event));
    this.container.addEventListener('submit', (event) => this.onSubmit(event));
    this.loadTickets();
  }

  async loadTickets() {
    this.setLoading(true);
    try {
      this.tickets = await this.api.getAll();
      this.renderTickets();
      this.showError('');
    } catch (error) {
      this.showError(`Не удалось загрузить тикеты. ${error.message}`);
      this.renderTickets();
    } finally {
      this.setLoading(false);
    }
  }

  renderTickets() {
    const list = this.container.querySelector('.tickets');
    if (!this.tickets.length) {
      list.innerHTML = '<div class="empty"><span>✓</span><h2>Список пуст</h2><p>Создайте первый тикет, чтобы начать работу.</p></div>';
      return;
    }
    list.innerHTML = this.tickets.map((ticket) => `
      <article class="ticket" data-id="${ticket.id}">
        <button class="status ${ticket.status ? 'status--done' : ''}" data-action="status" aria-label="Изменить статус">${ticket.status ? '✓' : ''}</button>
        <div class="ticket__body" data-action="details">
          <h2>${this.escape(ticket.name)}</h2>
        </div>
        <time datetime="${new Date(ticket.created).toISOString()}">${this.formatDate(ticket.created)}</time>
        <div class="ticket__actions">
          <button class="icon-button" data-action="edit" aria-label="Редактировать">✎</button>
          <button class="icon-button icon-button--danger" data-action="delete" aria-label="Удалить">×</button>
        </div>
        <div class="ticket__description" data-action="details" ${this.expanded.has(String(ticket.id)) ? '' : 'hidden'}>${ticket.description === undefined ? '<span class="muted">Загрузка описания…</span>' : this.escape(ticket.description || 'Описание отсутствует')}</div>
      </article>
    `).join('');
  }

  async onClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    if (action === 'close' && event.target !== actionButton) return;
    if (action === 'add') this.openTicketModal();
    if (action === 'cancel' || action === 'close') this.closeModal();

    const ticketElement = actionButton.closest('.ticket');
    if (!ticketElement) return;
    const ticket = this.tickets.find((item) => String(item.id) === ticketElement.dataset.id);
    if (!ticket) return;

    if (action === 'details') await this.toggleDetails(ticket);
    if (action === 'edit') await this.openEditModal(ticket);
    if (action === 'delete') this.openDeleteModal(ticket);
    if (action === 'status') await this.changeStatus(ticket);
  }

  async toggleDetails(ticket) {
    const id = String(ticket.id);
    if (this.expanded.has(id)) {
      this.expanded.delete(id);
      this.renderTickets();
      return;
    }
    this.expanded.add(id);
    this.renderTickets();
    if (ticket.description === undefined) {
      try {
        const fullTicket = await this.api.getById(ticket.id);
        Object.assign(ticket, fullTicket);
        this.renderTickets();
      } catch (error) {
        this.expanded.delete(id);
        this.showError(`Не удалось получить описание. ${error.message}`);
        this.renderTickets();
      }
    }
  }

  async openEditModal(ticket) {
    this.setLoading(true);
    try {
      const fullTicket = ticket.description === undefined ? await this.api.getById(ticket.id) : ticket;
      Object.assign(ticket, fullTicket);
      this.openTicketModal(ticket);
    } catch (error) {
      this.showError(`Не удалось загрузить тикет. ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  openTicketModal(ticket = null) {
    this.container.querySelector('.modal-host').innerHTML = `
      <div class="modal-backdrop" data-action="close">
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 id="modal-title">${ticket ? 'Изменить тикет' : 'Добавить тикет'}</h2>
          <form data-form="ticket" data-id="${ticket ? ticket.id : ''}">
            <label>Краткое описание<input name="name" required maxlength="120" value="${this.escape(ticket?.name || '')}"></label>
            <label>Подробное описание<textarea name="description" required rows="5">${this.escape(ticket?.description || '')}</textarea></label>
            <div class="modal__actions"><button type="button" class="button" data-action="cancel">Отмена</button><button class="button button--primary">Ок</button></div>
          </form>
        </section>
      </div>`;
    this.container.querySelector('input[name="name"]').focus();
  }

  openDeleteModal(ticket) {
    this.container.querySelector('.modal-host').innerHTML = `
      <div class="modal-backdrop" data-action="close">
        <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 id="modal-title">Удалить тикет</h2>
          <p>Вы уверены, что хотите удалить тикет? Это действие необратимо.</p>
          <form data-form="delete" data-id="${ticket.id}"><div class="modal__actions"><button type="button" class="button" data-action="cancel">Отмена</button><button class="button">Ок</button></div></form>
        </section>
      </div>`;
  }

  async onSubmit(event) {
    const form = event.target.closest('form');
    if (!form) return;
    event.preventDefault();
    const id = form.dataset.id;
    this.closeModal();
    this.setLoading(true);
    try {
      if (form.dataset.form === 'ticket') {
        const data = Object.fromEntries(new FormData(form));
        const oldTicket = this.tickets.find((item) => String(item.id) === id);
        const payload = { ...data, status: oldTicket?.status || false };
        if (id) await this.api.update(id, payload);
        else await this.api.create(payload);
      } else {
        await this.api.delete(id);
      }
      await this.loadTickets();
    } catch (error) {
      this.showError(`Не удалось сохранить изменения. ${error.message}`);
      this.setLoading(false);
    }
  }

  async changeStatus(ticket) {
    this.setLoading(true);
    try {
      const fullTicket = ticket.description === undefined ? await this.api.getById(ticket.id) : ticket;
      await this.api.update(ticket.id, { name: fullTicket.name, description: fullTicket.description, status: !ticket.status });
      await this.loadTickets();
    } catch (error) {
      this.showError(`Не удалось изменить статус. ${error.message}`);
      this.setLoading(false);
    }
  }

  closeModal() {
    this.container.querySelector('.modal-host').innerHTML = '';
  }

  setLoading(value) {
    this.container.querySelector('.loader').hidden = !value;
  }

  showError(message) {
    const notice = this.container.querySelector('.notice');
    notice.textContent = message;
    notice.hidden = !message;
  }

  formatDate(timestamp) {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(new Date(timestamp)).replace(',', '');
  }

  escape(value) {
    const element = document.createElement('div');
    element.textContent = String(value);
    return element.innerHTML;
  }
}
