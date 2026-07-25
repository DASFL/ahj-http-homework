const DEFAULT_API_URL = __API_URL__;

export default class HelpDeskApi {
  constructor(baseUrl = DEFAULT_API_URL) {
    this.baseUrl = baseUrl;
  }

  buildUrl(method, id) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('method', method);
    if (id !== undefined) url.searchParams.set('id', id);
    return url;
  }

  async request(method, { id, httpMethod = 'GET', body } = {}) {
    const response = await fetch(this.buildUrl(method, id), {
      method: httpMethod,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let message = `Ошибка сервера: ${response.status}`;
      try {
        const error = await response.json();
        message = error.message || message;
      } catch (_) {
        // Ответ сервера может не содержать JSON.
      }
      throw new Error(message);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  getAll() {
    return this.request('allTickets');
  }

  getById(id) {
    return this.request('ticketById', { id });
  }

  create(ticket) {
    return this.request('createTicket', { httpMethod: 'POST', body: ticket });
  }

  update(id, ticket) {
    return this.request('updateById', { id, httpMethod: 'POST', body: ticket });
  }

  delete(id) {
    return this.request('deleteById', { id });
  }
}
