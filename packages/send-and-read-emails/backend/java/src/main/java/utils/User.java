package utils;

public class User {
	private final String id;
	private String grantId;

	public User(String id, String grantId) {
		this.id = id;
		this.grantId = grantId;
	}

	public String getId() {
		return id;
	}

	public String getGrantId() {
		return grantId;
	}

	public void setGrantId(String grantId) {
		this.grantId = grantId;
	}
}
