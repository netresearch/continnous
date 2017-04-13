import xhr from 'xhr';
import ConfigurationForm from './Configuration';
import LinkForm from './Link';

const AUTH_PATH = 'auth/1/session';

export default class JiraConnector {
  constructor(options) {
    this.options = options;
    this.url = options.url.replace(/^\/+$/, '');
  }
  static label = 'JIRA (Server)';
  static configurationForm = ConfigurationForm;

  linkForm = LinkForm;

  /* eslint-disable class-methods-use-this */
  getLinkImg(link) {
    return this.options.self + link.img;
  }

  getLinkLabel(link) {
    return link.key + ' - ' + link.summary;
  }

  getLinkUrl(link) {
    return this.options.self + '/browse/' + link.key;
  }

  addLink() {
    return Promise.resolve();
  }

  removeLink() {
    return Promise.resolve();
  }

  signinIn = false;

  get(path, options) {
    return new Promise((resolve, reject) => {
      xhr(
        this.url + '/rest/' + path,
        Object.assign({ json: true, withCredentials: true }, options),
        (error, response, body) => {
          if (error) {
            error.response = response;
            reject(error);
          } else if (response.statusCode !== 200) {
            const e = new Error(
              body && body.errorMessages ? body.errorMessages[0] : 'Unknown error'
            );
            e.response = response;
            reject(e);
          } else {
            resolve(body);
          }
        }
      );
    }).catch((error) => {
      if (error.response.statusCode === 401 && !this.signinIn && options && options.login) {
        let credentialsWrong;
        this.signinIn = true;
        const signIn = () => options.login.login(credentialsWrong)
          .then(credentials => this.post(AUTH_PATH, credentials))
          .catch((signInError) => {
            if (signInError && signInError.response.statusCode === 401) {
              credentialsWrong = true;
              return signIn();
            }
            this.signinIn = false;
            options.login.close();
            return Promise.reject(signInError);
          })
          .then((session) => {
            this.signinIn = false;
            options.login.ok();
            if (path !== AUTH_PATH) {
              return session;
            }
            return this.get(path, options);
          });
        return signIn();
      }
      return Promise.reject(error);
    });
  }

  post(path, data, options) {
    return this.get(path, Object.assign({ body: data, method: 'POST' }, options));
  }

  signIn(login) {
    return this.get(AUTH_PATH, { login }).then((user) => {
      this.options.self = user.self.split('/rest/api/')[0];
    });
  }
}
