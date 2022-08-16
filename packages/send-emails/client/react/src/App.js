import React, { useState, useEffect } from "react";
import { useNylas } from "@nylas/nylas-react";
import { styles } from "./styles";

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState("");

  const handleTokenExchange = (r) => {
    try {
      const user = JSON.parse(r);
      setUserId(user.id);
      window.history.replaceState({}, "", `/?userId=${user.id}`);
    } catch (e) {
      console.error("An error occurred parsing the response.");
      window.history.replaceState({}, "", "/");
    }
  };

  useEffect(() => {
    if (!nylas) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has("code")) {
      nylas.exchangeCodeFromUrlForToken().then(handleTokenExchange);
    }

    const userId = params.get("userId");

    if (userId) {
      setUserId(userId);
    }
  }, [nylas]);

  return (
    <div
      style={{
        padding: "6em 1em",
      }}
    >
      {userId ? (
        <>
          <section style={styles.App.statusBar}>
            <div
              style={{
                padding: "1em",
              }}
            >
              <p style={styles.App.statusBarText}>✨ Connected to Nylas!</p>
            </div>
          </section>
          <section style={styles.App.contentContainer}>
            <SendEmail userId={userId} />
          </section>
        </>
      ) : (
        <NylasLogin />
      )}
    </div>
  );
}

function SendEmail({ userId }) {
  const nylas = useNylas();

  const [to, setTo] = useState("");
  const [body, setBody] = useState("");

  const sendEmail = async ({ userId, to, body }) => {
    try {
      const url = nylas.serverBaseUrl + "/nylas/send-email";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: userId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, body }),
      });

      const data = await res.json();

      console.log(data);
      return data;
    } catch (e) {
      console.warn(`Error sending emails:`, e);

      return false;
    }
  };

  const send = async () => {
    if (!userId) {
      return;
    }

    const message = await sendEmail({ userId, to, body });
    console.log(message);

    alert("Sent. Check console for confirmation...");

    setTo("");
    setBody("");
  };

  return (
    <div style={styles.SendEmail.sendEmailContainer}>
      <div style={styles.SendEmail.sendEmailHeader}>New Message</div>
      <form
        style={styles.SendEmail.sendEmailForm}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          style={styles.SendEmail.sendEmailTo}
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <textarea
          style={styles.SendEmail.sendEmailBody}
          rows={30}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div style={styles.SendEmail.sendEmailAction}>
          <button
            style={styles.SendEmail.button}
            disabled={!to || !body}
            type="submit"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function NylasLogin() {
  const nylas = useNylas();

  const [email, setEmail] = useState("");

  return (
    <section style={{ width: "80vw", margin: "0 auto" }}>
      <h1>Send emails sample app</h1>
      <p>Authenticate your email to send</p>
      <div style={{ marginTop: "30px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            nylas.authWithRedirect({
              emailAddress: email,
              successRedirectUrl: "",
            });
          }}
        >
          <input
            required
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Connect</button>
        </form>
      </div>
    </section>
  );
}

export default App;
