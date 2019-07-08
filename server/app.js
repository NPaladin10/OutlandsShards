/**
 * Copyright 2019, Nathan Ellsworth.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express');
//gather ethereum
const eth = require('./eth');

//handle routes - give provider info
const heroes = require('./heroes')(eth)
const trouble = require('./trouble')(eth)

const app = express();

app.use('/heroes', heroes)
app.use('/trouble', trouble)

app.get('/', (req, res) => {
  res
    .status(200)
    .json({id:'Outlands Planes'})
    .end();
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
