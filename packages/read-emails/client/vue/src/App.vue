<template>
  <div :style="{ padding: '6em 1em' }">
    <section v-if="!userId">
      <h1>Read emails sample app</h1>
      <p>Authenticate your email to read</p>
      <div>
        <form @submit.prevent="submit">
          <input
            required
            type="email"
            placeholder="Email Address"
            v-model="email"
          />
          <button type="submit">Connect</button>
        </form>
      </div>
    </section>
    <section v-else id="statusBar">
      <div :style="{ padding: '1em' }">
        <p id="statusBarText">✨ Connected to Nylas!</p>
      </div>
    </section>
    <section id="contentContainer"></section>
    <section id="emailListContainer">
      <p v-if="emails.length === 0">Loading emails.</p>
      <ul v-else id="emailList">
        <li
          id="emailContainer"
          v-for="thread in emails"
          :key="thread.id"
          :data-thread-id="thread.id"
          @click="expandEmail"
        >
          <div>{{ thread.subject }}</div>
          <div id="date">
            {{ new Date(Math.floor(thread.date * 1000)).toDateString() }}
          </div>
          <div id="snippet">{{ thread.snippet }}</div>
          <pre v-if="this.openEmails[thread.id]" id="thread">
            <code>{{ JSON.stringify(thread, null, 4) }}</code>
          </pre>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: 'App',
  created() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      this.exchangeCodeFromUrlForToken().then((r) =>
        this.handleTokenExchange(r)
      );
    }

    if (params.has('userId')) {
      this.userId = params.get('userId');
    }
  },
  data() {
    return {
      userId: '',
      email: '',
      openEmails: {},
      emails: [],
    };
  },
  watch: {
    userId() {
      this.getEmails();
    },
  },
  methods: {
    submit() {
      this.authWithRedirect({
        emailAddress: this.email,
        successRedirectUrl: '',
      });
    },
    expandEmail(event) {
      const threadId = event.currentTarget.getAttribute('data-thread-id');
      this.openEmails[threadId] = !this.openEmails[threadId];
    },
    handleTokenExchange(r) {
      try {
        const user = JSON.parse(r);
        this.userId = user.id;
        window.history.replaceState({}, '', `/?userId=${user.id}`);
      } catch (e) {
        console.error('An error occurred parsing the response.');
        window.history.replaceState({}, '', '/');
      }
    },
    async getEmails() {
      try {
        const res = await fetch(`${this.serverBaseUrl}/nylas/read-emails`, {
          method: 'GET',
          headers: {
            Authorization: this.userId,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();

        console.log(data);
        this.emails = data;
      } catch (e) {
        console.warn(`Error retrieving emails:`, e);
        return false;
      }
    },
  },
};
</script>

<style>
#statusBar {
  width: 80vw;
  margin: 0 auto;
  height: 60px;
  border: 2px solid #4169e1;
  background: rgba(0, 42, 245, 0.8);
  border-radius: 8px;
  display: flex;
  align-content: center;
  align-items: center;
}

#statusBarText {
  padding: 0;
  margin-block: 0;
  font-weight: bold;
  color: white;
}

#contentContainer {
  width: 80vw;
  margin: 10vh auto;
  display: flex;
  flex-direction: column;
}

#emailListContainer {
  width: 80vw;
  margin: 10vh auto;
}

#emailList {
  padding: 0px;
  margin: 0;
}

#emailContainer {
  position: relative;
  padding: 20px;
  background-color: white;
  border: 1px solid black;
  border-width: 1px 2px 1px 2px;
  cursor: pointer;
  list-style: none;
}

#date {
  font-size: smaller;
  color: gray;
}

#snippet {
  color: gray;
}

#thread {
  padding: 40px;
  background-color: darkslategray;
  color: white;
  max-height: 140px;
  overflow-y: scroll;
  margin: 10px 0px 0px;
}
</style>
