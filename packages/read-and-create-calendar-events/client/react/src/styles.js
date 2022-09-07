export const styles = {
  App: {
    statusBar: {
      width: '80vw',
      margin: '0 auto',
      height: 60,
      border: '2px solid #4169e1',
      background: 'rgba(0,42,245,0.8)',
      borderRadius: 8,
      display: 'flex',
      alignContent: 'center',
      alignItems: 'center',
      padding: '8px 16px',
    },
    statusBarText: {
      padding: 0,
      marginBlock: 0,
      fontWeight: 'bold',
      color: 'white',
    },
    contentContainer: {
      maxWidth: '80vw',
      margin: '40px auto',
      display: 'flex',
      flexDirection: 'row',
    },
    agendaContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '70%',
      marginRight: 40,
    },
    agendaHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
  },
  Agenda: {
    container: {
      maxHeight: '60vh',
      overflowY: 'scroll',
      border: '4px solid rgb(65, 105, 225)',
      borderRadius: 16,
      padding: 12,
    },
    eventArticle: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 8,
      boxShadow: '0px 4px 8px rgb(115 115 115 / 60%)',
      padding: 16,
      marginBottom: 16,
      lineHeight: 1.2,
      whiteSpace: 'pre',
    },
    eventDateContainer: {
      display: 'flex',
      maxWidth: '50%',
      justifyContent: 'space-between',
    },
    eventTitle: { margin: '0 0 16px' },
    eventContent: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'flex',
      flexDirection: 'column',
      WebkitLineClamp: 3,
      maxHeight: 120,
      color: '#737373',
    },
  },
  CalendarEventDate: {
    text: { margin: '0 0 24px', fontSize: '0.9em', marginRight: 16 },
  },
  CreateEventForm: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: '30%',
    },
    title: { marginBottom: 16 },
    form: { display: 'flex', flexDirection: 'column' },
    label: { fontWeight: 'bold', marginBottom: 8 },
    input: {
      marginBottom: 16,
    },
    button: {
      border: 'none',
      outline: 'none',
      borderRadius: 4,
      background: '#4169e1',
      color: '#fff',
      padding: 16,
      marginBottom: '0.6em',
    },
  },
};