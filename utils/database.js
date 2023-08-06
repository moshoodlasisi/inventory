import { config } from '../config';

const pgp = require('pg-promise')()

export const db = pgp(config.DATABASE_URL)
