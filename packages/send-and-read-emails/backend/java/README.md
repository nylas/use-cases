# Send and read email Nylas sample app

A Java implementation with Spark.

## Requirements

- Java 8 or later
- [a .env file with your Quickstart app secrets](#set-up-your-env-file)

## Running this app independently

### Set up your `.env` file

Go to the Nylas Dashboard, and choose the Quickstart Application.

Click **App Settings** to see the `client_id` and `client_secret` for the Quickstart app.

Add these to a `.env` in this directory as in the example below.

```yaml
# Nylas application keys - see https://developer.nylas.com/docs/developer-guide/authentication/authorizing-api-requests/#sdk-authentication
CLIENT_ID=client_id...
CLIENT_SECRET=client_secret...
```

### Install Java dependencies

Run one of the following commands to install the Java dependencies for this sample app.

**MacOS / Unix**

```bash
./gradlew build
```

On MacOS, if you experience this error `./gradlew build  # fails due to permission error`, run this command first: `chmod 755 gradlew`

**Windows (Powershell)**

```bash
gradlew.bat build
```

The `build.gradle` file in this sample includes the Nylas packages. 

If you were installing this on your own app, you would add the package as a dependency by adding the following line to your `build.gradle` file.

`implementation('com.nylas.sdk:nylas-java-sdk:1.21.0')`

### Run the backend server locally

Start the backend server before you start the frontend. You will need two terminal sessions so you can run both at the same time.

**MacOS / Unix**

```bash
./gradlew run
```

**Windows (PowerShell)**

```bash
gradlew.bat run
```

Your backend server is now running on `localhost:9000` and you can now make API calls, or start a frontend for this sample application to run on top of it.
(See the README file in the `frontend` folder for more information.)
