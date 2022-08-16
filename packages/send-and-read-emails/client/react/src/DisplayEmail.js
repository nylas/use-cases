import React from "react";

function DisplayEmail({ subject, snippet }) {
  return (
    <article style={styles.email}>
      <p style={styles.emailSubject}>
        {subject === "" ? "(No Subject)" : subject}
      </p>
      <span style={styles.emailSnippet}>
        {snippet === "" ? "(No Snippet)" : snippet}
      </span>
    </article>
  );
}

const styles = {
  email: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    padding: "0.6em",
    marginTop: "0.6em",
    borderRadius: "4px",
    border: "2px solid #3355f7",
    minWidth: "100%",
    height: "80px",
    background: "white",
  },
  emailSubject: {
    width: "30%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    marginRight: "1em",
    fontWeight: "bold",
  },
  emailSnippet: {
    width: "70%",
    overflow: "hidden",
    display: "-webkit-box",
    textOverflow: "ellipsis",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  },
};

export default DisplayEmail;
