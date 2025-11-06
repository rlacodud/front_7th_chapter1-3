import { randomUUID } from 'crypto';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import express from 'express';

const app = express();
const port = 3000;
const __dirname = path.resolve();

app.use(express.json());

const dbName = process.env.TEST_ENV === 'e2e' ? 'e2e.json' : 'realEvents.json';

/**
 * 파일 작업을 큐에 추가하여 순차적으로 실행 (race condition 방지)
 * 같은 파일에 대한 여러 작업이 동시에 실행되는 것을 방지합니다.
 * @param {string} filePath - 작업할 파일 경로
 * @param {Function} operation - 실행할 비동기 작업
 * @returns {Promise} 작업 결과
 */
const fileOperationQueue = new Map();

const queueFileOperation = async (filePath, operation) => {
  if (!fileOperationQueue.has(filePath)) {
    fileOperationQueue.set(filePath, Promise.resolve());
  }

  const previousOperation = fileOperationQueue.get(filePath);
  const currentOperation = previousOperation.then(() => operation());
  fileOperationQueue.set(filePath, currentOperation);

  return currentOperation;
};

const getEvents = async () => {
  const data = await readFile(`${__dirname}/src/__mocks__/response/${dbName}`, 'utf8');

  return JSON.parse(data);
};

app.get('/api/events', async (_, res) => {
  const events = await getEvents();
  res.json(events);
});

app.post('/api/events', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;
  
  await queueFileOperation(filePath, async () => {
    const events = await getEvents();
    const newEvent = { id: randomUUID(), ...req.body };

    fs.writeFileSync(
      filePath,
      JSON.stringify({
        events: [...events.events, newEvent],
      })
    );

    return newEvent;
  }).then((newEvent) => {
    res.status(201).json(newEvent);
  }).catch((error) => {
    console.error('Error creating event:', error);
    res.status(500).send('Failed to create event');
  });
});

app.put('/api/events/:id', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;
  const id = req.params.id;

  await queueFileOperation(filePath, async () => {
    const events = await getEvents();
    const eventIndex = events.events.findIndex((event) => event.id === id);
    if (eventIndex > -1) {
      const newEvents = [...events.events];
      newEvents[eventIndex] = { ...events.events[eventIndex], ...req.body };

      fs.writeFileSync(
        filePath,
        JSON.stringify({
          events: newEvents,
        })
      );

      return events.events[eventIndex];
    } else {
      throw new Error('Event not found');
    }
  }).then((updatedEvent) => {
    res.json(updatedEvent);
  }).catch((error) => {
    if (error.message === 'Event not found') {
      res.status(404).send('Event not found');
    } else {
      console.error('Error updating event:', error);
      res.status(500).send('Failed to update event');
    }
  });
});

app.delete('/api/events/:id', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;
  const id = req.params.id;

  await queueFileOperation(filePath, async () => {
    const events = await getEvents();

    fs.writeFileSync(
      filePath,
      JSON.stringify({
        events: events.events.filter((event) => event.id !== id),
      })
    );
  }).then(() => {
    res.status(204).send();
  }).catch((error) => {
    console.error('Error deleting event:', error);
    res.status(500).send('Failed to delete event');
  });
});

app.post('/api/events-list', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;

  await queueFileOperation(filePath, async () => {
    const events = await getEvents();
    const repeatId = randomUUID();
    const newEvents = req.body.events.map((event) => {
      const isRepeatEvent = event.repeat.type !== 'none';
      return {
        id: randomUUID(),
        ...event,
        repeat: {
          ...event.repeat,
          id: isRepeatEvent ? repeatId : undefined,
        },
      };
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify({
        events: [...events.events, ...newEvents],
      })
    );

    return newEvents;
  }).then((newEvents) => {
    res.status(201).json(newEvents);
  }).catch((error) => {
    console.error('Error creating events list:', error);
    res.status(500).send('Failed to create events');
  });
});

app.put('/api/events-list', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;

  await queueFileOperation(filePath, async () => {
    const events = await getEvents();
    let isUpdated = false;

    const newEvents = [...events.events];
    req.body.events.forEach((event) => {
      const eventIndex = events.events.findIndex((target) => target.id === event.id);
      if (eventIndex > -1) {
        isUpdated = true;
        newEvents[eventIndex] = { ...events.events[eventIndex], ...event };
      }
    });

    if (isUpdated) {
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          events: newEvents,
        })
      );

      return events.events;
    } else {
      throw new Error('Event not found');
    }
  }).then((updatedEvents) => {
    res.json(updatedEvents);
  }).catch((error) => {
    if (error.message === 'Event not found') {
      res.status(404).send('Event not found');
    } else {
      console.error('Error updating events list:', error);
      res.status(500).send('Failed to update events');
    }
  });
});

app.delete('/api/events-list', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;

  await queueFileOperation(filePath, async () => {
    const events = await getEvents();
    const newEvents = events.events.filter((event) => !req.body.eventIds.includes(event.id));

    fs.writeFileSync(
      filePath,
      JSON.stringify({
        events: newEvents,
      })
    );
  }).then(() => {
    res.status(204).send();
  }).catch((error) => {
    console.error('Error deleting events list:', error);
    res.status(500).send('Failed to delete events');
  });
});

app.put('/api/recurring-events/:repeatId', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;
  const repeatId = req.params.repeatId;
  const updateData = req.body;

  await queueFileOperation(filePath, async () => {
    const events = await getEvents();
    const seriesEvents = events.events.filter((event) => event.repeat.id === repeatId);

    if (seriesEvents.length === 0) {
      throw new Error('Recurring series not found');
    }

    const newEvents = events.events.map((event) => {
      if (event.repeat.id === repeatId) {
        return {
          ...event,
          title: updateData.title || event.title,
          description: updateData.description || event.description,
          location: updateData.location || event.location,
          category: updateData.category || event.category,
          notificationTime: updateData.notificationTime || event.notificationTime,
          repeat: updateData.repeat ? { ...event.repeat, ...updateData.repeat } : event.repeat,
        };
      }
      return event;
    });

    fs.writeFileSync(filePath, JSON.stringify({ events: newEvents }));

    return seriesEvents;
  }).then((seriesEvents) => {
    res.json(seriesEvents);
  }).catch((error) => {
    if (error.message === 'Recurring series not found') {
      res.status(404).send('Recurring series not found');
    } else {
      console.error('Error updating recurring events:', error);
      res.status(500).send('Failed to update recurring events');
    }
  });
});

app.delete('/api/recurring-events/:repeatId', async (req, res) => {
  const filePath = `${__dirname}/src/__mocks__/response/${dbName}`;
  const repeatId = req.params.repeatId;

  await queueFileOperation(filePath, async () => {
    const events = await getEvents();
    const remainingEvents = events.events.filter((event) => event.repeat.id !== repeatId);

    if (remainingEvents.length === events.events.length) {
      throw new Error('Recurring series not found');
    }

    fs.writeFileSync(filePath, JSON.stringify({ events: remainingEvents }));
  }).then(() => {
    res.status(204).send();
  }).catch((error) => {
    if (error.message === 'Recurring series not found') {
      res.status(404).send('Recurring series not found');
    } else {
      console.error('Error deleting recurring events:', error);
      res.status(500).send('Failed to delete recurring events');
    }
  });
});

/**
 * e2e 테스트용 원본 데이터 로드
 * 별도 JSON 파일에서 원본 데이터를 읽어옵니다.
 * @returns {Promise<{events: Array}>} 원본 이벤트 데이터
 */
const getInitialE2EData = async () => {
  try {
    const data = await readFile(
      `${__dirname}/src/__mocks__/response/e2e-initial.json`,
      'utf8'
    );
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading e2e initial data:', error);
    // 파일이 없거나 읽기 실패 시 빈 데이터 반환
    return { events: [] };
  }
};

// e2e 테스트용 데이터 리셋 엔드포인트
app.post('/api/reset-e2e-data', async (req, res) => {
  // e2e 모드에서만 동작
  if (process.env.TEST_ENV !== 'e2e') {
    return res.status(403).send('This endpoint is only available in e2e mode');
  }

  const filePath = `${__dirname}/src/__mocks__/response/e2e.json`;

  await queueFileOperation(filePath, async () => {
    const initialData = await getInitialE2EData();
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }).then((initialData) => {
    res.status(200).json({ message: 'e2e data reset successfully', events: initialData.events });
  }).catch((error) => {
    console.error('Error resetting e2e data:', error);
    res.status(500).send('Failed to reset e2e data');
  });
});

app.listen(port, () => {
  if (!fs.existsSync(`${__dirname}/src/__mocks__/response/${dbName}`)) {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: [],
      })
    );
  }
  console.log(`Server running at http://localhost:${port}`);
});
