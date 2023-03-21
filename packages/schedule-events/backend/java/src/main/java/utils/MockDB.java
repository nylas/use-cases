package utils;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import spark.utils.StringUtils;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class MockDB {
	private static final String filename = "datastore.json";
	private static final Type USER_LIST = new TypeToken<List<User>>(){}.getType();
	private static final Gson GSON = new Gson();

	/**
	 * Find a user in the Mock DB
	 * @param query The ID or email address to query for
	 * @return The user if found, otherwise returns null.
	 */
	public static User findUser(String query) {
		List<User> jsonRecords = getJSONRecords();

		return jsonRecords.stream()
				.filter(user -> user.getId().equals(query) || user.getEmailAddress().equals(query))
				.findFirst()
				.orElse(null);
	}

	/**
	 * Determines to create or update a user
	 * @param emailAddress The email address to update
	 * @param accessToken The access token to update
	 * @return The modified user
	 */
	public static User createOrUpdateUser(String emailAddress, String accessToken) {
		User user = findUser(emailAddress);
		if(user != null) {
			return updateUser(user, emailAddress, accessToken);
		} else {
			return createUser(emailAddress, accessToken);
		}
	}

	/**
	 * Loads the JSON database file
	 * @return The list of users from the database
	 */
	private static List<User> getJSONRecords() {
		File file = new File(filename);
		try {
			if(!file.exists()) {
				boolean fileCreated = file.createNewFile();
				if(!fileCreated) {
					throw new RuntimeException("Unable to create the JSON database file");
				}
				return new ArrayList<>();
			}
			// Read file contents of the datastore
			JsonReader reader = new JsonReader(new FileReader(filename));
			// Parse JSON records in Java
			List<User> userList = GSON.fromJson(reader, USER_LIST);
			if(userList == null) {
				return new ArrayList<>();
			}
			return userList;
		} catch (IOException e) {
			return new ArrayList<>();
		}
	}

	/**
	 * Write the database to a JSON file
	 * @param jsonRecords The list of users from the database
	 */
	private static void writeJSONRecords(List<User> jsonRecords) {
		try {
			// Writing all records back to the file
			try (FileWriter writer = new FileWriter(filename)) {
				GSON.toJson(jsonRecords, writer);
			}
		} catch (IOException e) {
			throw new RuntimeException("Unable to save file, IO error found: " + e);
		}
	}

	/**
	 * Update the user with provided values
	 * @param user The user object to update
	 * @param emailAddress The email address to update
	 * @param accessToken The access token to update
	 * @return The updated user
	 */
	private static User updateUser(User user, String emailAddress, String accessToken) {
		if(user == null) {
			throw new IllegalArgumentException("No user provided to update.");
		}

		if(StringUtils.isNotEmpty(emailAddress)) {
			user.setEmailAddress(emailAddress);
		}
		if(StringUtils.isNotEmpty(accessToken)) {
			user.setAccessToken(accessToken);
		}
		List<User> jsonRecords = getJSONRecords().stream()
				.map(record -> record.getId().equals(user.getId()) ? user : record)
				.collect(Collectors.toList());

		writeJSONRecords(jsonRecords);
		return user;
	}

	/**
	 * Create a user with provided values
	 * @param emailAddress The email address to create the user with
	 * @param accessToken The access token to create the user with
	 * @return The created user
	 */
	private static User createUser(String emailAddress, String accessToken) {
		if(StringUtils.isEmpty(emailAddress)) {
			throw new IllegalArgumentException("Must provide an email address to create a user.");
		}
		if(StringUtils.isEmpty(accessToken)) {
			throw new IllegalArgumentException("Must provide an access token to create a user.");
		}
		List<User> jsonRecords = getJSONRecords();
		String userId = UUID.randomUUID().toString();
		User user = new User(userId, emailAddress, accessToken);
		// Adding new user
		jsonRecords.add(user);

		writeJSONRecords(jsonRecords);
		return user;
	}
}
