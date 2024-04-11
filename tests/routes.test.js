import indexRouter from '../routes/index.js';

import request from 'supertest';
import express from 'express';

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use('/', indexRouter);

test('GET "/" works', (done) => {
  request(app)
    .get('/')
    .expect('Content-Type', /json/)
    .expect({ project: 'Messaging App', author: 'dziubenzo' })
    .expect(200, done);
});
