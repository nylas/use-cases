import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface JSONRecord {
  id: string;
  emailAddress: string;
  accessToken: string;
}

class MockDB {
  filename: string;

  constructor(filename: string) {
    if (!filename) {
      throw new Error('Filename is required');
    }
    this.filename = filename;
    try {
      fs.accessSync(filename, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      fs.writeFileSync(filename, '[]');
    }
  }

  async getJSONRecords(): Promise<JSONRecord[]> {
    // Read filecontents of the datastore
    const jsonRecords = await fs.promises.readFile(this.filename, {
      encoding: 'utf8',
    });
    // Parse JSON records in JavaScript
    return JSON.parse(jsonRecords);
  }

  // Logic to find data
  async findUser(id: string, emailAddress?: string) {
    const jsonRecords = await this.getJSONRecords();
    return jsonRecords.find(
      (r) => r.emailAddress === emailAddress || r.id === id
    );
  }

  // Logic to update data
  async updateUser(id: string, payload: Partial<JSONRecord>) {
    const jsonRecords = await this.getJSONRecords();

    const idx = jsonRecords.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error('Record not found');
    }

    // Update existing record
    jsonRecords[idx] = { ...jsonRecords[idx], ...payload };

    await fs.promises.writeFile(
      this.filename,
      JSON.stringify(jsonRecords, null, 2)
    );
    return jsonRecords[idx];
  }

  // Logic to add data
  async createUser(payload: Omit<JSONRecord, 'id'>) {
    const jsonRecords = await this.getJSONRecords();

    const user: JSONRecord = {
      id: uuidv4(),
      ...payload,
    };
    // Adding new record
    jsonRecords.push(user);

    // Writing all records back to the file
    await fs.promises.writeFile(
      this.filename,
      JSON.stringify(jsonRecords, null, 2)
    );

    return user;
  }

  // Logic to add or update data
  async createOrUpdateUser(id: string, attributes: Omit<JSONRecord, 'id'>) {
    const record = await this.findUser(id, attributes.emailAddress);
    if (record) {
      return await this.updateUser(record.id, attributes);
    } else {
      return await this.createUser(attributes);
    }
  }
}

// 'datastore.json' is created at runtime
const mockDB = new MockDB('datastore.json');

export default mockDB;
