const fs = require('fs');
const crypto = require('crypto');
const util = require('util');

const scrypt = util.promisify(crypto.scrypt);

class UsersRepository {
  constructor(filename) {
    if (!filename) {
      throw new Error('Creating a repository requires a filename');
    }

    this.filename = filename;
    try {
      fs.accessSync(this.filename);
    } catch (err) {
      fs.writeFileSync(this.filename, '[]');
    }
  }

  async getAll() {
    return JSON.parse(
      await fs.promises.readFile(this.filename, {
        encoding: 'utf8'
      })
    );
  }

  async create(attrs) {

    attrs.id = this.randomID();

    const salt = crypto.randomBytes(8).toString('hex');
    const buf = await scrypt(attrs.password, salt, 64);

    const records = await this.getAll();
    const record = ({
      ...attrs,
      password: `${buf.toString('hex')}.${salt}`
    });
    // console.log(record);
    // console.log(records);

    records.push(record);
    // console.log(records);

    await this.writeAll(records);

    return attrs;
  }

  async comparePasswords(saved, supplied) {
    const [hashed, salt] = saved.split('.');
    const hashedSupplied = await scrypt(supplied, salt, 64);

    return hashed===hashedSupplied.toString('hex');
  }

  async writeAll(records) {
    await fs.promises.writeFile(
      this.filename,
      JSON.stringify(records, null, 2)
    );
  }

  randomID() {
    return crypto.randomBytes(4).toString('hex')
  }

  async getOne(id) {
      const records = await this.getAll();
      return records.find(record => record.id === id );
  }

  async delete(id) {
    const records = await this.getAll();
    const filteredRecords = records.filter(record => record.id !== id);
    await this.writeAll(filteredRecords);
  }

  async update(id, attrs) {
    const records = this.getAll();
    const record = records.find(record=> record.id === id);

    if (!record) {
        throw new Error(`Record with id ${id} not found`);
    }

    Object.assign(record, attrs);
    await this.writeAll(records);
  }

  async getOneBy(filters) {
      const records = await this.getAll();

      for (let record of records) {
          let found = true;

          for (let key in filters) {
              if (record[key] !== filters[key]) {
                  found = false;
              }
          }

          if (found) {return record;}
      }
  }
}

// const test = async () => {
//   const repo = new UsersRepository('users.json');

// //   await repo.create({ email: 'test@test.com', password: 'password' });

// //   const users = await repo.getAll();
// //   const user = await repo.getOne('daf8f6aa');
// // await repo.delete('9be1b118');
// //   console.log(user);
// const user = await repo.getOneBy({email: 'test@test.com'});
// console.log(user);
// };

// test();

module.exports = new UsersRepository('users.json');