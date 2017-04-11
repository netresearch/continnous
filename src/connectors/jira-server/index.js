import ConfigurationForm from './Configuration';

export default class JiraConnector {
  constructor(options) {
    this.options = options;
  }
  static label = 'JIRA (Server)';
  static configurationForm = ConfigurationForm;
}
