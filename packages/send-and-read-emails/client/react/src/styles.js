export const styles = {
  App: {
    statusBar: {
      width: "80vw",
      margin: "0 auto",
      height: "60px",
      border: "2px solid #4169e1",
      background: "rgba(0,42,245,0.8)",
      borderRadius: "8px",
      display: "flex",
      alignContent: "center",
      alignItems: "center",
    },
    statusBarText: {
      padding: 0,
      marginBlock: 0,
      fontWeight: "bold",
      color: "white",
    },
    contentContainer: {
      display: "flex",
      flexDirection: "row",
      width: "80vw",
      maxHeight: "50vh",
      margin: "10vh auto",
    },
  },
  ReadEmails: {
    container: {
      flex: 2,
      maxWidth: "60%",
      background: "rgba(0, 42, 245, 0.2)",
      padding: "1.2em 0.2em 1.2em 1.2em",
      borderRadius: "8px",
      minHeight: "100%",
    },
    list: {
      overflowY: "scroll",
      paddingRight: "1em",
      maxHeight: "90%",
    },
    button: {
      background: "#4169e1",
      color: "#fff",
      padding: "0.5em 1.4em",
      marginBottom: "0.6em",
    },
  },
  SendEmails: {
    container: {
      display: "flex",
      flexDirection: "column",
      flex: 2,
      marginLeft: "2em",
    },
    header: {
      width: "100%",
      padding: "0.5em",
      background: "#4169e1",
      color: "white",
    },
    to: {
      border: "1px solid #8d94a5",
      color: "#000",
      padding: "0.5em 1.4em",
    },
    body: {
      border: "1px solid #8d94a5",
      color: "#000",
      padding: "0.5em 1.4em",
    },
    cta: {
      marginTop: "1em",
      alignSelf: "end",
      justifySelf: "end",
    },
    button: {
      background: "#4169e1",
      color: "#fff",
      padding: "0.5em 1.4em",
      marginBottom: "0.6em",
    },
  },
};
