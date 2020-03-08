'use strict';

const pgp = require('pg-promise')();
const get = require('dlv');

const reorder = (objects, names, prop = 'idk') => {
  const output = new Array(names.length);
  let i = 0;
  const lookup = names.reduce(
    (memo, name) => Object.assign(memo, { [name]: i++ }),
    {}
  );
  for (const obj of objects) {
    const spot = get(lookup, get(obj, prop), -1);
    if (spot >= 0) {
      output[spot] = obj;
    }
  }
  return output;
};

const cleanString = value => {
  if (!value) {
    return null;
  }
  const formatted = value.toString().trim();
  if (!formatted || formatted === '') {
    return null;
  }
  return formatted;
};

const formatSqrl = result =>
  Object.assign(result, {
    idk: cleanString(result.idk),
    suk: cleanString(result.suk),
    vuk: cleanString(result.vuk)
  });

const formatNut = result => {
  if (!result) {
    return null;
  }
  return {
    ip: result.ip,
    hmac: result.hmac ? result.hmac.toString().trim() : null,
    created: result.created,
    idk: cleanString(result.idk),
    ask: cleanString(result.ask),
    identified: result.identified,
    issued: result.issued,
    id: result.id,
    initial: result.initial,
    user_id: result.user_id
  };
};

class PgSqrlStore {
  constructor(connectionString) {
    this.db = pgp(connectionString);
  }

  async createNut(it) {
    const result = await this.db.oneOrNone(
      'INSERT INTO nuts (initial,ip,idk,user_id,hmac,ask) VALUES (${initial},${ip},${idk},${user_id},${hmac},${ask}) RETURNING id,initial,ip,hmac,created,idk,identified,issued,ask,user_id',
      it
    );
    return formatNut(result);
  }

  async retrieveNut(id) {
    const result = await this.db.oneOrNone(
      'SELECT id,initial,ip,hmac,created,idk,identified,issued,ask,user_id FROM nuts WHERE id = ${id}',
      { id }
    );
    return formatNut(result);
  }

  async updateNut(it) {
    const result = await this.db.oneOrNone(
      'UPDATE nuts SET hmac=${hmac},idk=${idk},issued=${issued},identified=${identified},user_id=${user_id} WHERE id = ${id} RETURNING id,initial,ip,hmac,created,idk,identified,issued,ask,user_id',
      it
    );
    return formatNut(result);
  }

  async createSqrl(it) {
    return await this.db.oneOrNone(
      'INSERT INTO sqrl (idk,user_id,suk,vuk,created) VALUES (${idk},${user_id},${suk},${vuk},${created}) RETURNING idk,user_id,suk,vuk,created,disabled,superseded',
      it
    );
  }

  async retrieveSqrl(idks) {
    const results = await this.db.manyOrNone(
      'SELECT idk,user_id,suk,vuk,created,disabled,superseded FROM sqrl WHERE idk IN ($1:list)',
      [idks]
    );
    if (!results) {
      return null;
    }

    return reorder(results.map(formatSqrl), idks);
  }

  async retrieveSqrlByUser(id) {
    const results = await this.db.oneOrNone(
      'SELECT idk,user_id,suk,vuk,created,disabled,superseded FROM sqrl WHERE user_id = ${id}',
      { id }
    );
    if (!results) {
      return null;
    }
    return formatSqrl(results);
  }

  async updateSqrl(it) {
    return await this.db.none(
      'UPDATE sqrl set disabled=${disabled},superseded=${superseded} WHERE idk = ${idk}',
      it
    );
  }

  async createUser() {
    // Create an account
    const user = await this.db.one(
      'INSERT INTO users default VALUES RETURNING id'
    );
    if (!user) {
      // something went wrong
      return null;
    }
    return user;
  }

  async retrieveUser(id) {
    return await this.db.oneOrNone(
      'SELECT id,created FROM users WHERE id = ${id}',
      { id }
    );
  }
}

module.exports = PgSqrlStore;
