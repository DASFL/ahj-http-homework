const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json({ type: '*/*' }));
app.use((request, response, next) => {
  response.setHeader('Content-Type', 'application/json');
  next();
});

let tickets = [
  {
    id: crypto.randomUUID(),
    name: 'Поменять краску в принтере, ком. 404',
    description: 'Принтер HP LJ-1210, картриджи на складе',
    status: false,
    created: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Переустановить Windows, ПК-Hall24',
    description: '',
    status: false,
    created: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Установить обновление KB-31642',
    description: 'Вышло критическое обновление для Windows',
    status: true,
    created: Date.now(),
  },
];

app.get('/health', (request, response) => {
  response.json({ status: 'ok' });
});

app.all('/', (request, response) => {
  const { method, id } = request.query;

  switch (method) {
    case 'allTickets':
      response.json(tickets.map(({ description, ...ticket }) => ticket));
      break;

    case 'ticketById': {
      const ticket = tickets.find((item) => item.id === id);
      if (!ticket) {
        response.status(404).json({ message: 'Ticket not found' });
        return;
      }
      response.json(ticket);
      break;
    }

    case 'createTicket': {
      const ticket = {
        id: crypto.randomUUID(),
        name: request.body.name,
        description: request.body.description || '',
        status: Boolean(request.body.status),
        created: Date.now(),
      };
      tickets.push(ticket);
      response.status(201).json(ticket);
      break;
    }

    case 'updateById': {
      const ticket = tickets.find((item) => item.id === id);
      if (!ticket) {
        response.status(404).json({ message: 'Ticket not found' });
        return;
      }
      Object.assign(ticket, request.body, { id: ticket.id, created: ticket.created });
      response.json(ticket);
      break;
    }

    case 'deleteById': {
      const index = tickets.findIndex((item) => item.id === id);
      if (index === -1) {
        response.status(404).json({ message: 'Ticket not found' });
        return;
      }
      tickets.splice(index, 1);
      response.status(204).end();
      break;
    }

    default:
      response.status(404).json({ message: 'Unknown method' });
  }
});

const port = process.env.PORT || 7070;
app.listen(port, () => {
  console.log(`HelpDesk server started on port ${port}`);
});
