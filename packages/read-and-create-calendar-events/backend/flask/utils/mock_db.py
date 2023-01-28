import os
import json
import io
import uuid


class MockDb:

    def __init__(self, filename):
        if not filename:
            raise Exception('Filename is required')

        self.filename = filename
        try:
            if not os.access(self.filename, os.F_OK):
                raise Exception('FILE_NOT_FOUND')

            if not os.access(self.filename,  os.R_OK or os.W_OK):
                raise Exception('NO_PERMISSION')

            print('mock_db//db file exists and permissions OK')
        except Exception as err:
            if err.__str__() == 'NO_PERMISSION':
                print('mock_db//NO_PERMISSION')
                print('exiting...')
            else:
                open(self.filename, 'w').write('[]')

    def get_JSON_records(self):
        with io.open(self.filename, 'r', encoding='utf-8') as f:
            json_records = f.read()

        return json.loads(json_records)

    def find_user(self, id, emailAddress=None):
        json_records = self.get_JSON_records()
        return next((r for r in json_records if r['email_address'] == emailAddress or r['id'] == id), None)

    def update_user(self, id, payload):
        json_records = self.get_JSON_records()

        idx = next((i for i, r in enumerate(
            json_records) if r['id'] == id), None)
        if idx is None:
            raise Exception('Record not found')

        json_records[idx] = {**json_records[idx], **payload}

        with io.open(self.filename, 'w', encoding='utf-8') as f:
            f.write(json.dumps(json_records, ensure_ascii=False))

        return json_records[idx]

    def create_user(self, payload):
        json_records = self.get_JSON_records()

        user = {
            'id': str(uuid.uuid4()),
            **payload
        }

        json_records.append(user)

        with io.open(self.filename, 'w', encoding='utf-8') as f:
            f.write(json.dumps(json_records, ensure_ascii=False))

        return user

    def create_or_update_user(self, id, attributes):
        record = self.find_user(id, attributes['email_address'])
        if record:
            return self.update_user(record['id'], attributes)
        else:
            return self.create_user(attributes)


# const mockDB = new MockDB('datastore.json');

# # 'datastore.json' is created at runtime
# module.exports = mockDB;
