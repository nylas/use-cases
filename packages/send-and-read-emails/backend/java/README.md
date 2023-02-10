# Send and read emails

An implementation with Spark.

## Requirements

- Java 8 or higher
- [Configured .env file](../../../../README.md)

## Running this app independently

1. Confirm `.env` configuration

Head over to your Quickstart Application on the Nylas Dashboard for a copy of your `client_id` and `client_secret`.

Ensure the client_id and client_secret variables are configured in `.env` in this directory.

```yaml
# Nylas application keys - see https://developer.nylas.com/docs/the-basics/authentication/authorizing-api-requests/#sdk-authentication
CLIENT_ID=client_id...
CLIENT_SECRET=client_secret...
```

2. Install dependencies

**MacOS / Unix**

```
./gradlew build
```

**Windows (Powershell)**

```
gradlew.bat build
```

3. Run the server locally

**MacOS / Unix**

```
./gradlew run
```

**Windows (PowerShell)**

```
gradlew.bat run
```

4. Your server is now running on `localhost:9000`! Make API calls from the front end demo application.
