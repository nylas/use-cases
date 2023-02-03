# frozen_string_literal: true

# This is a mock database class that is used to store user data in a json file.
class MockDb
  def initialize(filename)
    raise 'Filename is required' if filename.nil?

    @filename = filename
    begin
      raise 'FILE_NOT_FOUND' unless File.exist?(@filename)
      raise 'NO_PERMISSION' unless File.readable?(@filename) && File.writable?(@filename)

      puts 'mock_db//db file exists and permissions OK'
    rescue StandardError => e
      if e.to_s == 'NO_PERMISSION'
        puts 'mock_db//NO_PERMISSION'
        puts 'exiting...'
      else
        File.open(@filename, 'w') { |f| f.write('[]') }
        puts 'mock_db//no db file found, db file created'
      end
    end
  end

  def records
    json_records = File.read(@filename)
    JSON.parse(json_records)
  end

  def find_user(id, email_address = nil)
    json_records = records
    json_records.find { |r| r['email_address'] == email_address || r['id'] == id }
  end

  def update_user(id, payload)
    json_records = records
    idx = json_records.index { |r| r['id'] == id }
    raise 'Record not found' if idx.nil?

    json_records[idx].merge!(payload.transform_keys(&:to_s))

    puts json_records[idx]

    File.open(@filename, 'w') do |f|
      f.write(json_records.to_json)
    end

    json_records[idx]
  end

  def create_user(payload)
    json_records = records
    user = { 'id' => SecureRandom.uuid }.merge(payload)
    json_records << user

    File.open(@filename, 'w') do |f|
      f.write(json_records.to_json)
    end

    user
  end

  def create_or_update_user(id, attributes)
    record = find_user(id, attributes[:email_address])
    if record
      update_user(record['id'], attributes)
    else
      create_user(attributes)
    end
  end
end
