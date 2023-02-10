package utils;

public class User {
	private final String id;
	private String emailAddress;
	private String accessToken;

	public User(String id, String emailAddress, String accessToken) {
		this.id = id;
		this.emailAddress = emailAddress;
		this.accessToken = accessToken;
	}

	public String getId() {
		return id;
	}

	public String getEmailAddress() {
		return emailAddress;
	}

	public String getAccessToken() {
		return accessToken;
	}

	public void setEmailAddress(String emailAddress) {
		this.emailAddress = emailAddress;
	}

	public void setAccessToken(String accessToken) {
		this.accessToken = accessToken;
	}
}
