# frozen_string_literal: true

# This is a mock database class that is used to store user data in a json file.
# Attributes
# ----------
#     filename : str
#         The name of the file to be used as the mock database.
#
# Methods
# -------
#     get_JSON_records()
#         Reads a JSON file from disk and returns its contents as a list.
#     find_user(id, email_address=None)
#         Find a user record in JSON records based on email address or id.
#     update_user(id, payload)
#         Update the user record with the given id in the JSON file.
#     create_user(payload)
#         Create a new user record in the JSON file.
#     create_or_update_user(email_address, payload)
#         Create a new user record in the JSON file if the user does not exist.
#         If the user exists, update the user record.
class MockDb
  # The constructor initializes the filename attribute with the value passed as an argument.
  # It then checks if the file exists and has the required permissions. If the file doesn't exist, it creates the file.
  # In case the file name is not provided, the file doesn't have the required permissions,
  # or the file could not successfully be created, it raises an exception and exits.
  #
  # Parmeters
  # ---------
  #     filename : string
  #         The name of the file to be used as the mock database.
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

  # Reads a JSON file from disk and returns its contents as a array.
  #
  #     Returns:
  #         array: A array containing the JSON records.
  def records
    json_records = File.read(@filename)
    JSON.parse(json_records)
  end

  # Find a user record in JSON records based on email address or id.
  #
  #     Parameters:
  #         id (string): ID of the user to search for.
  #         emailAddress (string): Email address of the user to search for.
  #
  #     Returns:
  #         hash: A hash containing the user record, or nil if no matching record is found.
  def find_user(id, email_address = nil)
    json_records = records
    json_records.find { |r| r['email_address'] == email_address || r['id'] == id }
  end

  # Update the user record with the given id in the JSON file.
  #
  #     Parameters:
  #         id (int): the id of the user record to be updated
  #         payload (hash): the updated information for the user record
  #
  #     Returns:
  #         hash: the updated user record
  #
  #     Raises:
  #         Exception: if the record with the given id is not found in the JSON file
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

  # Create a new user record in the JSON file.
  #
  #     Parameters:
  #         payload (hash): the information for the new user record
  #
  #     Returns:
  #         hash: the created user record
  def create_user(payload)
    json_records = records
    user = { 'id' => SecureRandom.uuid }.merge(payload)
    json_records << user

    File.open(@filename, 'w') do |f|
      f.write(json_records.to_json)
    end

    user
  end

  # Create a new user record or update an existing one in the JSON file.
  # The user is identified by either the id or email_address in the attributes.
  #
  #     Parameters:
  #         id (uuidv4): the id of the user to be created or updated
  #         attributes (hash): the information for the user record
  #
  #     Returns:
  #         hash: the created or updated user record
  def create_or_update_user(id, attributes)
    record = find_user(id, attributes[:email_address])
    if record
      update_user(record['id'], attributes)
    else
      create_user(attributes)
    end
  end
end
