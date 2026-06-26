import { Client } from 'colyseus.js';

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `${window.location.hostname}:3001`
  : window.location.host;

export const client = new Client(`${wsProtocol}//${wsHost}`);
