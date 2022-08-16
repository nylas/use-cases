export const styles = {
  App: {
    statusBar: {
      width: '80vw',
      margin: '0 auto',
      height: '60px',
      border: '2px solid #4169e1',
      background: 'rgba(0,42,245,0.8)',
      borderRadius: '8px',
      display: 'flex',
      alignContent: 'center',
      alignItems: 'center',
    },
    statusBarText: {
      padding: 0,
      marginBlock: 0,
      fontWeight: 'bold',
      color: 'white',
    },
    contentContainer: {
      width: '80vw',
      margin: '10vh auto',
      display: 'flex',
      flexDirection: 'column',
    },
  },
  SendEmail: {
    sendEmailContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    sendEmailHeader: {
      width: '100%',
      padding: '0.5em',
      background: '#4169e1',
      color: 'white',
    },
    sendEmailForm: {
      display: 'flex',
      flexDirection: 'column',
    },
    sendEmailTo: {
      border: '1px solid #8d94a5',
      color: '#000',
      padding: '0.5em 1.4em',
    },
    sendEmailBody: {
      border: '1px solid #8d94a5',
      color: '#000',
      padding: '0.5em 1.4em',
    },
    sendEmailAction: {
      marginTop: '1em',
      alignSelf: 'end',
      justifySelf: 'end',
    },
    button: {
      background: '#4169e1',
      color: '#fff',
      padding: '0.5em 1.4em',
      marginBottom: '0.6em',
    },
  },
};
