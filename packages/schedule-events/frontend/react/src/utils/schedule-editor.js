// Variables injected from the Flask app serving this script
const ENV_SCHEDULING_WEB_BASE_URL =
  import.meta.env.VITE_SCHEDULER_URL || 'https://scheduler.nylas.com';

export default (function () {
  const spinnerEl = document.createElement('div');
  spinnerEl.setAttribute('class', 'nylas-spinner');
  spinnerEl.innerHTML = `<svg width="38" height="38" viewBox="0 0 40 40" stroke="currentColor">
    <g transform="translate(1 1)" stroke-width={2} fill="none" fill-rule="evenodd">
    <circle stroke-opacity=".4" cx="18" cy="18" r="18" /><path d="M36 18c0-9.94-8.06-18-18-18">
    <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" />
    </path></g></svg>`;
  const iframeEl = document.createElement('iframe');

  function subscribeToPostMessage(handler) {
    if (window.addEventListener) {
      window.addEventListener('message', handler, false);
      return function () {
        window.removeEventListener('message', handler, false);
      };
    } else {
      window.attachEvent('onmessage', handler, false);
      return function () {
        window.detachEvent('onmessage', handler, false);
      };
    }
  }

  function ensureProtocolPresent(url) {
    if (url.includes('://')) {
      return url;
    } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return 'http://' + url;
    }
    return 'https://' + url;
  }

  const nylas = {
    scheduler: {
      show: function (config) {
        // Validation of config

        if (
          !config.auth ||
          !(config.auth.pageEditToken || config.auth.accessToken)
        ) {
          throw new Error(
            'Nylas: You must provide an auth object with either a pageEditToken or accessToken'
          );
        }
        if (config.behavior && config.behavior.displayOnly) {
          if (!(config.behavior.displayOnly instanceof Array)) {
            throw new Error(
              'behavior.displayOnly should be an array of tab IDs'
            );
          }
          if (config.behavior.displayOnly.length === 0) {
            throw new Error(
              'behavior.displayOnly must contain at least one tab ID'
            );
          }
        }
        if (config.behavior && config.behavior.disableEditing) {
          if (!(config.behavior.disableEditing instanceof Array)) {
            throw new Error(
              'behavior.disableEditing should be an array of feature strings'
            );
          }
        }

        const theme = config.style || {};
        const key = Object.keys(theme).find(
          (k) => !['tintColor', 'backgroundColor', 'modalTitle'].includes(k)
        );
        if (key) {
          throw new Error(
            'Nylas: Unknown style key "' +
              key +
              '" found in the styling configuration.'
          );
        }

        // Use the `region` and `iframeDomain` configuration to determine the Nylas Scheduling service
        // hostname we will embed in the iframe. iframeDomain primarily used for testing (eg: setting to localhost)
        const nylasDomain = ensureProtocolPresent(
          config.iframeDomain || ENV_SCHEDULING_WEB_BASE_URL
        );

        // Clean the `pageDomain` configuration. This determines the URL is shown in the interface for
        // scheduling pages and is provided so the user can specify their whitelabeled domain.
        config.pageDomain = ensureProtocolPresent(
          config.pageDomain || nylasDomain
        );
        if (config.pageDomain.substr(config.pageDomain.length - 1) === '/') {
          config.pageDomain = config.pageDomain.substr(
            0,
            config.pageDomain.length - 1
          );
        }

        const instance = {};

        instance.show = function () {
          iframeEl.setAttribute('src', nylasDomain + '/embed/');

          const container = document.querySelector('.scheduler-app');
          container.appendChild(iframeEl);
          container.appendChild(spinnerEl);

          subscribeToPostMessage(function (e) {
            if (e.data && e.data.type === 'nylas:close-modal') {
              // TODO: What to do with this close button?
            }
            if (e.data && e.data.type === 'nylas:config-request') {
              // NOTE: We specify a target origin of `host` so other iframes / listeners do
              // not receive this postMessage.
              iframeEl.contentWindow.postMessage(
                { type: 'nylas:config-response', config: config },
                nylasDomain
              );
            }
            if (e.data && e.data.type === 'nylas:ready') {
              container.setAttribute('class', 'scheduler-app nylas-ready');
              setTimeout(function () {
                spinnerEl.remove();
              }, 190);
            }
          });

          setTimeout(function () {
            spinnerEl.setAttribute('class', 'nylas-spinner');
          }, 50);
        };

        instance.save = function () {
          iframeEl.contentWindow.postMessage(
            { type: 'nylas:save-request' },
            nylasDomain
          );
        };

        instance.show();

        return instance;
      },
    },
  };

  return nylas;
})();
